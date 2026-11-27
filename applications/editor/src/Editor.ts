import { Clipboard } from '@effect/platform-browser';
import { Command, Component, Head, type UiStruct } from '@effect/ui';
import { HtmlCommand, HtmlSubscription } from '@effect/ui/html';
import { Array, Effect, Exit, Layer, Option, Schema } from 'effect';

import * as Design from '#src/Design';
import {
  EditorDef,
  EditorMessage,
  type EditorModel,
  type Pointer,
  type View,
  type ZoomDirection,
  aimedOf,
  boundsOf,
} from '#src/EditorDefinition';
import { canvas, view } from '#src/EditorView';
import * as Geometry from '#src/Geometry';
import * as Palette from '#src/Palette';

/** The Command that zooms the view a way about the centre of the canvas panel: it works out the level to go to from the view as it is, the next level in or out, or the size of the canvas itself, and measures the panel, whose centre nothing else gives. */
const zoomAboutCentre = (view: View, direction: typeof ZoomDirection.Type) =>
  HtmlCommand.measure(canvas, (rect) =>
    EditorMessage.CompletedMeasureZoom({
      zoom:
        direction === 'reset'
          ? 1
          : direction === 'in'
            ? Option.getOrElse(
                Array.findFirst(Geometry.zoomLevels, (level) => level > view.zoom),
                () => Geometry.maximumZoom,
              )
            : Option.getOrElse(
                Array.findLast(Geometry.zoomLevels, (level) => level < view.zoom),
                () => Geometry.minimumZoom,
              ),
      centre: Option.match(rect, {
        onNone: () => null,
        onSome: (rect) => ({ x: rect.width / 2, y: rect.height / 2 }),
      }),
    }),
  );

/**
 * How the view is shown while pointers press the canvas, from how it was and where they were as the last of them pressed. One pointer pans it by how far it went. Two, as two fingers, zoom it by how far apart they went, within the smallest and the largest zoom, and pan it by how far their midpoint went, so that the point of the canvas that lay between them stays between them; they wait for the panel to be measured, which places their midpoint in the panel, and two that pressed at one place zoom nothing.
 */
const pannedView = (
  panning: NonNullable<EditorModel['panning']>,
  pointers: ReadonlyArray<Pointer>,
): View => {
  const [firstAnchor, secondAnchor] = panning.anchor;
  const [first, second] = pointers;
  if (firstAnchor === undefined || first === undefined) return panning.from;
  if (secondAnchor === undefined || second === undefined) {
    return {
      x: panning.from.x + first.x - firstAnchor.x,
      y: panning.from.y + first.y - firstAnchor.y,
      zoom: panning.from.zoom,
    };
  }
  if (panning.origin === null) return panning.from;
  const apart = Math.hypot(secondAnchor.x - firstAnchor.x, secondAnchor.y - firstAnchor.y);
  const zoom =
    apart === 0
      ? panning.from.zoom
      : Math.min(
          Math.max(
            (panning.from.zoom * Math.hypot(second.x - first.x, second.y - first.y)) / apart,
            Geometry.minimumZoom,
          ),
          Geometry.maximumZoom,
        );
  // The point of the canvas between the pointers as they pressed, and where their midpoint is now in the panel.
  const between = {
    x:
      ((firstAnchor.x + secondAnchor.x) / 2 - panning.origin.x - panning.from.x) /
      panning.from.zoom,
    y:
      ((firstAnchor.y + secondAnchor.y) / 2 - panning.origin.y - panning.from.y) /
      panning.from.zoom,
  };
  return {
    x: (first.x + second.x) / 2 - panning.origin.x - between.x * zoom,
    y: (first.y + second.y) / 2 - panning.origin.y - between.y * zoom,
    zoom,
  };
};

/** What placing a box of a primitive at a place of the canvas changes, after a count of boxes placed before it: the design gains the box, numbered after every box placed before it so that no id is given twice, on the grid nearest the place and within the canvas, with every parameter of the primitive empty; and the box is selected, so that the inspector shows it at once. */
const withBox = (placed: number, primitive: Palette.Primitive, place: Design.Position) =>
  ({
    design: Design.add({
      id: `box-${placed + 1}`,
      primitive: primitive.name,
      position: Geometry.snap(Geometry.within(place)),
      parameters: Object.fromEntries(primitive.parameters.map((name) => [name, ''])),
    }),
    placed: placed + 1,
    selected: { _tag: 'Box', id: `box-${placed + 1}` },
  }) satisfies UiStruct.EvolveFields<EditorModel>;

/** What deleting the box of an id from a design changes: the design loses the box and its wires, and nothing the person was doing keeps naming either, the selection neither the box nor a wire of it. */
const withoutBox = (id: string, design: Design.Design) =>
  ({
    design: Design.remove(id),
    selected: (selected) =>
      selected === null ||
      (selected._tag === 'Box'
        ? selected.id === id
        : selected.to.box === id ||
          design.wires.some(
            (wire) =>
              wire.from.box === id &&
              wire.to.box === selected.to.box &&
              wire.to.port === selected.to.port,
          ))
        ? null
        : selected,
    connecting: (connecting) => (connecting?.box === id ? null : connecting),
    dragging: (dragging) => (dragging?.box === id ? null : dragging),
    drawing: (drawing) => (drawing?.from.box === id ? null : drawing),
  }) satisfies UiStruct.EvolveFields<EditorModel>;

/** The Command that writes the text of the design file to the clipboard, and says whether the clipboard took it. It reaches the clipboard through the service of Effect, so that a test gives it one of its own. */
export class CopyDesign extends Command.Service<CopyDesign>()('editor/CopyDesign', {
  args: { json: Schema.String },
  success: EditorMessage,
}) {
  static readonly layer = this.toLayer(
    Effect.gen(function* () {
      const clipboard = yield* Clipboard.Clipboard;
      return ({ json }) =>
        clipboard.writeString(json).pipe(
          Effect.match({
            onSuccess: () => EditorMessage.SucceededCopyDesign({ json }),
            onFailure: () => EditorMessage.FailedCopyDesign({ json }),
          }),
        );
    }),
  );
}

/**
 * The editor without the Layers it provides itself, for a test that provides its own. A primitive chosen in the palette places a box of it on the canvas, and one dragged from the palette places it where it is dropped; a box is selected by a click, by focus or from the inspector, moved on the grid by dragging its header or by the arrow keys, and deleted by Delete or from the inspector; a wire is drawn by dragging from an output port to an input port of another box, or by choosing the one and then the other, as the keyboard does, and is selected by a click or from the inspector and removed by Delete or from the inspector. The view is panned by dragging the canvas or by the arrow keys on it, and zoomed by its buttons, by keys and by a pinch. Everything it holds beyond the design is what the person is doing at the moment.
 */
export const EditorNoDeps = EditorDef.make({
  init: () => ({
    design: Design.empty,
    placed: 0,
    selected: null,
    connecting: null,
    dragging: null,
    drawing: null,
    dragged: false,
    view: { x: 0, y: 0, zoom: 1 },
    panning: null,
    copied: null,
  }),
  update: {
    // A box of the primitive, set a little down and to the right of the last from the top left corner of the view, the point of the canvas that lies there, so that it is in view however the canvas is panned and zoomed. A name the palette does not offer places nothing.
    ClickedPrimitive: ($, { primitive }) =>
      Option.match(Palette.find(primitive), {
        onNone: () => $.model,
        onSome: (found) =>
          $.evolve(
            withBox($.model.placed, found, {
              x:
                -$.model.view.x / $.model.view.zoom +
                Geometry.firstBoxOffset +
                Geometry.nextBoxOffset * ($.model.placed % Geometry.nextBoxCount),
              y:
                -$.model.view.y / $.model.view.zoom +
                Geometry.firstBoxOffset +
                Geometry.nextBoxOffset * ($.model.placed % Geometry.nextBoxCount),
            }),
          ),
      }),
    // A box of the primitive where it was dropped: the point of the canvas under the pointer, through the view, lies in the middle of its header, which is where a box is held. A name the palette does not offer places nothing.
    DroppedPrimitive: ($, { primitive, x, y }) =>
      Option.match(Palette.find(primitive), {
        onNone: () => $.model,
        onSome: (found) =>
          $.evolve(
            withBox($.model.placed, found, {
              x: (x - $.model.view.x) / $.model.view.zoom - Geometry.boxWidth / 2,
              y: (y - $.model.view.y) / $.model.view.zoom - Geometry.headerHeight / 2,
            }),
          ),
      }),
    ClickedBox: ($, { id }) => $.evolve({ selected: { _tag: 'Box', id } }),
    FocusedBox: ($, { id }) => $.evolve({ selected: { _tag: 'Box', id } }),
    // The box moves by a step of the grid in the direction of the key, lands on the grid, and stays within the canvas.
    PressedBoxArrow: ($, { id, key }) =>
      Option.match(
        Array.findFirst($.model.design.boxes, (box) => box.id === id),
        {
          onNone: () => $.model,
          onSome: (box) =>
            $.evolve({
              design: Design.move(
                id,
                Geometry.snap(
                  Geometry.within({
                    x:
                      box.position.x +
                      (key === 'ArrowLeft'
                        ? -Geometry.gridStep
                        : key === 'ArrowRight'
                          ? Geometry.gridStep
                          : 0),
                    y:
                      box.position.y +
                      (key === 'ArrowUp'
                        ? -Geometry.gridStep
                        : key === 'ArrowDown'
                          ? Geometry.gridStep
                          : 0),
                  }),
                ),
              ),
            }),
        },
      ),
    // The box held focus, or something in it did, and is gone with it: focus goes to the canvas rather than be lost to the document.
    PressedBoxDelete: ($, { id }) =>
      $.evolve(withoutBox(id, $.model.design)).run(
        HtmlCommand.Focus.make({ ref: canvas }).pipe(Command.asNoop),
      ),
    // The press selects the box and starts dragging it, from where the box lies and where the pointer is.
    PressedHeader: ($, { id, x, y }) =>
      Option.match(
        Array.findFirst($.model.design.boxes, (box) => box.id === id),
        {
          onNone: () => $.model,
          onSome: (box) =>
            $.evolve({
              selected: { _tag: 'Box', id },
              dragging: { box: id, pointer: { x, y }, origin: box.position },
            }),
        },
      ),
    // The box goes as far from where it lay as the pointer went from where it pressed, over the zoom, as the pointer moves in the viewport and the box on the canvas; to the nearest place on the grid, and within the canvas.
    MovedPointer: ($, { x, y }) =>
      $.model.dragging === null
        ? $.model
        : $.evolve({
            design: Design.move(
              $.model.dragging.box,
              Geometry.snap(
                Geometry.within({
                  x:
                    $.model.dragging.origin.x +
                    (x - $.model.dragging.pointer.x) / $.model.view.zoom,
                  y:
                    $.model.dragging.origin.y +
                    (y - $.model.dragging.pointer.y) / $.model.view.zoom,
                }),
              ),
            ),
          }),
    ReleasedPointer: ($) => $.evolve({ dragging: null }),
    // The browser took the press over, so the drag never ended where the person meant: the box goes back to where it lay.
    CancelledPointer: ($) =>
      $.model.dragging === null
        ? $.model
        : $.evolve({
            design: Design.move($.model.dragging.box, $.model.dragging.origin),
            dragging: null,
          }),
    // A wire starts at the port, or the wire that started there is given up when the port is clicked again.
    // The click a pointer sends as it ends a drag starts no wire of its own: the drag drew its wire or gave it up.
    ClickedOutput: ($, { box, port, pointer }) =>
      pointer && $.model.dragged
        ? $.evolve({ dragged: false })
        : $.evolve({
            selected: { _tag: 'Box', id: box },
            connecting: (connecting) =>
              connecting?.box === box && connecting.port === port ? null : { box, port },
          }),
    // The press may become a drag that draws a wire, or stay the click it starts as.
    PressedOutput: ($, { box, port, x, y }) =>
      $.evolve({
        selected: { _tag: 'Box', id: box },
        dragged: false,
        drawing: { from: { box, port }, press: { x, y }, pointer: { x, y }, origin: null },
      }),
    CompletedMeasureCanvas: ($, { origin }) =>
      $.evolve({ drawing: (drawing) => (drawing === null ? null : { ...drawing, origin }) }),
    // The wire follows the pointer. As the pointer first goes farther than the drag threshold from where it pressed, the press becomes a drag, which takes the place of a wire started by a click. A pointer event says where the pointer is in the viewport alone, so the canvas panel is measured then, which with the view places the pointer on the canvas; a press that stays a click measures nothing.
    MovedWire: ($, { x, y }) =>
      $.model.drawing === null
        ? $.model
        : $.model.dragged ||
            Math.hypot(x - $.model.drawing.press.x, y - $.model.drawing.press.y) <=
              Geometry.dragThreshold
          ? $.evolve({ drawing: { ...$.model.drawing, pointer: { x, y } } })
          : $.evolve({
              drawing: { ...$.model.drawing, pointer: { x, y } },
              dragged: true,
              connecting: null,
            }).run(
              HtmlCommand.measure(canvas, (rect) =>
                EditorMessage.CompletedMeasureCanvas({
                  origin: Option.match(rect, {
                    onNone: () => null,
                    onSome: (rect) => ({ x: rect.x, y: rect.y }),
                  }),
                }),
              ),
            ),
    // A drag released over an input port the wire can enter draws the wire, which is selected, so that the inspector shows it at once; released anywhere else, it draws nothing. A press that never became a drag is a click, which the browser sends next.
    ReleasedWire: ($, { x, y }) =>
      Option.match(Option.fromNullishOr($.model.drawing), {
        onNone: () => $.model,
        onSome: (drawing) =>
          Option.match(aimedOf({ ...$.model, drawing: { ...drawing, pointer: { x, y } } }), {
            onNone: () => $.evolve({ drawing: null }),
            onSome: (to) =>
              $.evolve({
                design: Design.connect({ from: drawing.from, to }),
                selected: { _tag: 'Wire', to },
                drawing: null,
              }),
          }),
      }),
    CancelledWire: ($) => $.evolve({ drawing: null }),
    // The wire being drawn enters the port, and is selected. Without a wire being drawn, or from the same box, which no composition of the theory wires to itself, the click changes nothing.
    ClickedInput: ($, { box, port }) =>
      $.model.connecting === null || $.model.connecting.box === box
        ? $.model
        : $.evolve({
            design: Design.connect({ from: $.model.connecting, to: { box, port } }),
            selected: { _tag: 'Wire', to: { box, port } },
            connecting: null,
          }),
    // A click on the canvas deselects and gives up the wire started by a click; the click a pointer sends as it ends a pan only ends the pan.
    ClickedCanvas: ($) =>
      $.model.dragged
        ? $.evolve({ dragged: false })
        : $.evolve({ selected: null, connecting: null }),
    // The first press starts panning the view from where it is. A second pointer, as a second finger, joins it to zoom: both are taken anew from where they are, with the view as it is, and the panel is measured, which places their midpoint in it; the press is a drag from then on. A third pointer is ignored.
    PressedCanvas: ($, { pointer, x, y }) =>
      $.model.panning === null
        ? $.evolve({
            dragged: false,
            panning: {
              pointers: [{ id: pointer, x, y }],
              anchor: [{ id: pointer, x, y }],
              from: $.model.view,
              origin: null,
            },
          })
        : $.model.panning.pointers.length !== 1 ||
            $.model.panning.pointers.some((pressing) => pressing.id === pointer)
          ? $.model
          : $.evolve({
              dragged: true,
              panning: {
                pointers: [...$.model.panning.pointers, { id: pointer, x, y }],
                anchor: [...$.model.panning.pointers, { id: pointer, x, y }],
                from: $.model.view,
                origin: $.model.panning.origin,
              },
            }).run(
              HtmlCommand.measure(canvas, (rect) =>
                EditorMessage.CompletedMeasurePinch({
                  origin: Option.match(rect, {
                    onNone: () => null,
                    onSome: (rect) => ({ x: rect.x, y: rect.y }),
                  }),
                }),
              ),
            ),
    CompletedMeasurePinch: ($, { origin }) =>
      $.evolve({ panning: (panning) => (panning === null ? null : { ...panning, origin }) }),
    // The view follows the pointers. As a pointer first goes farther than the drag threshold from where it pressed, the press becomes a drag, so that the click that ends it deselects nothing.
    MovedCanvas: ($, { pointer, x, y }) =>
      Option.match(
        Option.fromNullishOr($.model.panning).pipe(
          Option.filter((panning) => panning.pointers.some((pressing) => pressing.id === pointer)),
        ),
        {
          onNone: () => $.model,
          onSome: (panning) =>
            $.evolve({
              panning: {
                ...panning,
                pointers: panning.pointers.map((pressing) =>
                  pressing.id === pointer ? { id: pointer, x, y } : pressing,
                ),
              },
              view: pannedView(
                panning,
                panning.pointers.map((pressing) =>
                  pressing.id === pointer ? { id: pointer, x, y } : pressing,
                ),
              ),
              dragged: (dragged) =>
                dragged ||
                panning.anchor.some(
                  (anchor) =>
                    anchor.id === pointer &&
                    Math.hypot(x - anchor.x, y - anchor.y) > Geometry.dragThreshold,
                ),
            }),
        },
      ),
    // A lifted pointer leaves the others where they are, taken anew with the view as it is, so that a pinch that loses a finger goes on as a pan; the last ends the pan where the view is.
    ReleasedCanvas: ($, { pointer }) =>
      $.evolve({
        panning: (panning) =>
          panning === null || !panning.pointers.some((pressing) => pressing.id === pointer)
            ? panning
            : panning.pointers.length === 1
              ? null
              : {
                  pointers: panning.pointers.filter((pressing) => pressing.id !== pointer),
                  anchor: panning.pointers.filter((pressing) => pressing.id !== pointer),
                  from: $.model.view,
                  origin: panning.origin,
                },
      }),
    // The browser took a press over, as when a touch becomes a gesture of its own: the view stays where the pan brought it, as nothing was made or lost by it, and the pan ends.
    CancelledCanvas: ($, { pointer }) =>
      $.evolve({
        panning: (panning) =>
          panning === null || !panning.pointers.some((pressing) => pressing.id === pointer)
            ? panning
            : null,
      }),
    // Zooming by a button or a key keeps the centre of the panel where it is, which the panel is measured for.
    ClickedZoom: ($, { direction }) => $.run(zoomAboutCentre($.model.view, direction)),
    PressedZoom: ($, { direction }) => $.run(zoomAboutCentre($.model.view, direction)),
    // The point of the canvas at the centre of the panel stays there as the canvas is drawn at the new zoom; a panel that is not drawn zooms about its corner.
    CompletedMeasureZoom: ($, { zoom, centre }) =>
      $.evolve({
        view: (view) => ({
          x: (centre?.x ?? 0) - ((centre?.x ?? 0) - view.x) * (zoom / view.zoom),
          y: (centre?.y ?? 0) - ((centre?.y ?? 0) - view.y) * (zoom / view.zoom),
          zoom,
        }),
      }),
    // The view pans by a step in the direction of the key, as a page scrolls: the canvas moves the other way.
    PressedCanvasArrow: ($, { key }) =>
      $.evolve({
        view: (view) => ({
          x:
            view.x +
            (key === 'ArrowLeft' ? Geometry.panStep : key === 'ArrowRight' ? -Geometry.panStep : 0),
          y:
            view.y +
            (key === 'ArrowUp' ? Geometry.panStep : key === 'ArrowDown' ? -Geometry.panStep : 0),
          zoom: view.zoom,
        }),
      }),
    ClickedWire: ($, { to }) => $.evolve({ selected: { _tag: 'Wire', to } }),
    // The box or the wire chosen in the inspector is selected, and highlighted on the canvas; the panel is measured, so that it is brought into view if it lies outside.
    ClickedEntity: ($, { entity }) =>
      $.evolve({ selected: entity }).run(
        HtmlCommand.measure(canvas, (rect) =>
          EditorMessage.CompletedMeasureReveal({
            size: Option.match(rect, {
              onNone: () => null,
              onSome: (rect) => ({ width: rect.width, height: rect.height }),
            }),
          }),
        ),
      ),
    // A selection that lies whole within the panel stays where it is, so that the view does not jump; one that does not is brought to the middle of the panel, at the zoom the view has.
    CompletedMeasureReveal: ($, { size }) =>
      Option.match(
        Option.all([
          Option.fromNullishOr(size),
          Option.flatMap(Option.fromNullishOr($.model.selected), (entity) =>
            boundsOf($.model.design, entity),
          ),
        ]),
        {
          onNone: () => $.model,
          onSome: ([size, bounds]) =>
            bounds.x * $.model.view.zoom + $.model.view.x >= 0 &&
            bounds.y * $.model.view.zoom + $.model.view.y >= 0 &&
            (bounds.x + bounds.width) * $.model.view.zoom + $.model.view.x <= size.width &&
            (bounds.y + bounds.height) * $.model.view.zoom + $.model.view.y <= size.height
              ? $.model
              : $.evolve({
                  view: {
                    x: size.width / 2 - (bounds.x + bounds.width / 2) * $.model.view.zoom,
                    y: size.height / 2 - (bounds.y + bounds.height / 2) * $.model.view.zoom,
                    zoom: $.model.view.zoom,
                  },
                }),
        },
      ),
    // Escape gives up the wire being drawn first, by either way, and deselects only when none is.
    PressedEscape: ($) =>
      $.model.connecting === null && $.model.drawing === null
        ? $.evolve({ selected: null })
        : $.evolve({ connecting: null, drawing: null }),
    // The selected box or wire is deleted. Focus may have been on what is gone, a box or the item of the inspector that named it, so it goes to the canvas rather than be lost to the document.
    PressedDelete: ($) =>
      $.model.selected === null
        ? $.model
        : $.model.selected._tag === 'Box'
          ? $.evolve(withoutBox($.model.selected.id, $.model.design)).run(
              HtmlCommand.Focus.make({ ref: canvas }).pipe(Command.asNoop),
            )
          : $.evolve({ design: Design.disconnect($.model.selected.to), selected: null }).run(
              HtmlCommand.Focus.make({ ref: canvas }).pipe(Command.asNoop),
            ),
    UpdatedParameter: ($, { name, value }) =>
      $.model.selected?._tag !== 'Box'
        ? $.model
        : $.evolve({ design: Design.setParameter($.model.selected.id, name, value) }),
    // The button is gone with the box, so focus goes to the canvas rather than be lost to the document.
    ClickedDelete: ($) =>
      $.model.selected?._tag !== 'Box'
        ? $.model
        : $.evolve(withoutBox($.model.selected.id, $.model.design)).run(
            HtmlCommand.Focus.make({ ref: canvas }).pipe(Command.asNoop),
          ),
    // The wire is gone, and with it the selection of it and the button, so focus goes to the canvas rather than be lost to the document.
    ClickedRemoveWire: ($, { box, port }) =>
      $.evolve({
        design: Design.disconnect({ box, port }),
        selected: (selected) =>
          selected?._tag === 'Wire' && selected.to.box === box && selected.to.port === port
            ? null
            : selected,
      }).run(HtmlCommand.Focus.make({ ref: canvas }).pipe(Command.asNoop)),
    // The text of the design file as it stands goes to the clipboard. A design that has no text, which the editor never makes, copies nothing.
    ClickedCopy: ($) =>
      Exit.match(Design.toJson($.model.design), {
        onFailure: () => $.model,
        onSuccess: (json) => $.evolve({ copied: null }).run(CopyDesign.make({ json })),
      }),
    SucceededCopyDesign: ($, { json }) => $.evolve({ copied: { json, succeeded: true } }),
    FailedCopyDesign: ($, { json }) => $.evolve({ copied: { json, succeeded: false } }),
  },
  // The keys of the editor are heard on the whole document, wherever focus is: Escape, in a field too, while there is a wire to give up or something to deselect; Delete and Backspace, anywhere but in a field, while something is selected; and the keys that zoom the view anywhere but in a field, as the browser's own zoom with Control or Command is left to the browser. A key an element has handled, as a box handles Delete, is left alone.
  subscriptions: ({ model }) => [
    HtmlSubscription.shortcuts([
      ...(model.connecting !== null || model.drawing !== null || model.selected !== null
        ? [{ key: 'Escape', message: EditorMessage.PressedEscape(), whileTyping: true }]
        : []),
      ...(model.selected === null
        ? []
        : [
            { key: 'Delete', message: EditorMessage.PressedDelete() },
            { key: 'Backspace', message: EditorMessage.PressedDelete() },
          ]),
      { key: '+', message: EditorMessage.PressedZoom({ direction: 'in' }) },
      { key: '=', message: EditorMessage.PressedZoom({ direction: 'in' }) },
      { key: '-', message: EditorMessage.PressedZoom({ direction: 'out' }) },
      { key: '0', message: EditorMessage.PressedZoom({ direction: 'reset' }) },
    ]),
  ],
  view,
  head: () => [Head.title('Falkara Workspace')],
});

/** The editor with what it provides itself: the Command that copies the design file, over the clipboard of the browser. */
export const Editor = EditorNoDeps.pipe(
  Component.provide(CopyDesign.layer.pipe(Layer.provide(Clipboard.layer))),
);
