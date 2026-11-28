import { UiSchema } from '@effect/ui';
import { Html } from '@effect/ui/html';
import { Array, Option, Schema } from 'effect';

import { Design, Port, Position } from '#src/Design';
import * as Geometry from '#src/Geometry';
import * as Palette from '#src/Palette';

/** A schema of how the canvas is shown in its panel: where the origin of the canvas lies in the panel, in CSS pixels of the panel, and the factor the canvas is drawn larger or smaller by. A point of the canvas lies in the panel at the point times the zoom, plus the origin. The canvas has no edge, so the view pans without limit. */
export const View = Schema.Struct({
  /** How far the origin of the canvas lies right of the left edge of the panel, negative to its left. */
  x: Schema.Finite,
  /** How far the origin of the canvas lies below the top edge of the panel, negative above it. */
  y: Schema.Finite,
  /** The factor the canvas is drawn by, one at its own size. */
  zoom: Schema.Finite,
});

/** How the canvas is shown in its panel. */
export type View = typeof View.Type;

/** A schema of a pointer pressing the canvas: the id the browser tells it by from other pointers, as two fingers of a touch, and where it is in the viewport. */
export const Pointer = Schema.Struct({
  /** The id of the pointer. */
  id: Schema.Finite,
  /** Where the pointer is in the viewport, from the left. */
  x: Schema.Finite,
  /** Where the pointer is in the viewport, from the top. */
  y: Schema.Finite,
});

/** A pointer pressing the canvas. */
export type Pointer = typeof Pointer.Type;

/** A schema of what can be selected in the design: a box, by its id, or a wire, by the input port it enters, which names it, as no input port takes two wires. */
export const Entity = Schema.Union([
  Schema.TaggedStruct('Box', {
    /** The id of the box. */
    id: Schema.String,
  }),
  Schema.TaggedStruct('Wire', {
    /** The input port the wire enters. */
    to: Port,
  }),
]);

/** What can be selected in the design: a box or a wire. */
export type Entity = typeof Entity.Type;

/** A schema of what the editor holds: the design, and what the person is doing to it, which no design file keeps. */
export const EditorModel = Schema.Struct({
  /** The design on the canvas. */
  design: Design,
  /** How many boxes were ever placed, which numbers the next one so that no id is given twice, even after a box is deleted. */
  placed: Schema.Int,
  /** The box or the wire the inspector shows and the canvas highlights, if one is selected. */
  selected: Schema.NullOr(Entity),
  /** The output port a wire is being drawn from, until an input port is chosen or the drawing is given up. */
  connecting: Schema.NullOr(Port),
  /** The box being dragged by its header: where the pointer pressed it and where the box lay then, so that every move places the box by how far the pointer went, and a cancelled drag puts it back. */
  dragging: Schema.NullOr(
    Schema.Struct({
      /** The id of the box. */
      box: Schema.String,
      /** Where the pointer pressed the header, in the viewport. */
      pointer: Position,
      /** Where the box lay when it was pressed, on the canvas. */
      origin: Position,
    }),
  ),
  /** The press on an output port that may become a wire drawn by dragging: the port, where the pointer pressed it and where it is now, both in the viewport, and where the corner of the canvas panel lies in the viewport, once it is measured, which with the view places the pointer on the canvas. */
  drawing: Schema.NullOr(
    Schema.Struct({
      /** The output port that was pressed. */
      from: Port,
      /** Where the pointer pressed the port, in the viewport. */
      press: Position,
      /** Where the pointer is, in the viewport. */
      pointer: Position,
      /** Where the top left corner of the canvas panel lies in the viewport, until it is measured. */
      origin: Schema.NullOr(Position),
    }),
  ),
  /** Whether the pointer went farther than the drag threshold since it last pressed an output port or the canvas, which makes the press a drag: a wire follows the pointer or the view pans, and the click the browser sends as the press ends does nothing of its own. */
  dragged: Schema.Boolean,
  /** How the canvas is shown in its panel, which panning and zooming change and no design file keeps. */
  view: View,
  /** The pointers pressing the canvas where no box lies, which pan the view, and with two, as two fingers, zoom it: where each is now, where they were and how the view was as the last of them pressed, and where the top left corner of the canvas panel lies in the viewport once it is measured, which places the pointers in the panel. */
  panning: Schema.NullOr(
    Schema.Struct({
      /** The pointers pressing the canvas, at most two, where they are now. */
      pointers: Schema.Array(Pointer),
      /** The pointers as the last of them pressed, or as one of them was lifted, where each was then. */
      anchor: Schema.Array(Pointer),
      /** How the canvas was shown as the last of the pointers pressed, or as one of them was lifted. */
      from: View,
      /** Where the top left corner of the canvas panel lies in the viewport, until it is measured. */
      origin: Schema.NullOr(Position),
    }),
  ),
  /** The last copy of the design file to the clipboard: the text that was copied and whether the clipboard took it, which the inspector says for as long as the design file is that text. */
  copied: Schema.NullOr(
    Schema.Struct({
      /** The text of the design file that was copied. */
      json: Schema.String,
      /** Whether the clipboard took the text. */
      succeeded: Schema.Boolean,
    }),
  ),
});

/** What the editor holds. */
export type EditorModel = typeof EditorModel.Type;

/** The output port a wire is being drawn from by either way, if one is: the port chosen by a click or by the keyboard, or the port a drag started on. */
export const sourceOf = (model: EditorModel): Port | null =>
  model.connecting ?? (model.drawing !== null && model.dragged ? model.drawing.from : null);

/** Where the pointer that drags a wire is on the canvas, once the canvas panel is measured and the press is a drag: its place in the panel, less the origin of the canvas, over the zoom, so that it holds at every zoom and pan. */
export const pointerOf = (model: EditorModel): Option.Option<Position> =>
  model.drawing === null || model.drawing.origin === null || !model.dragged
    ? Option.none()
    : Option.some({
        x: (model.drawing.pointer.x - model.drawing.origin.x - model.view.x) / model.view.zoom,
        y: (model.drawing.pointer.y - model.drawing.origin.y - model.view.y) / model.view.zoom,
      });

/** The input port the pointer that drags a wire is over, if it is over one the wire can enter: an input port of another box than the one the wire leaves. Of boxes that overlap, the one placed last, which is drawn over the others, is taken. */
export const aimedOf = (model: EditorModel): Option.Option<Port> =>
  Option.flatMap(pointerOf(model), (pointer) =>
    Array.findLast(
      model.design.boxes.flatMap((box) =>
        box.id === model.drawing?.from.box
          ? []
          : Option.match(Palette.find(box.primitive), {
              onNone: () => [],
              onSome: (primitive) => primitive.inputs.map((port, index) => ({ box, port, index })),
            }),
      ),
      ({ box, index }) => Geometry.isOverInput(pointer, box.position, index),
    ).pipe(Option.map(({ box, port }) => ({ box: box.id, port }))),
  );

/** The rectangle of the canvas a box or a wire of a design takes, if the design has it: a box from its corner, as wide as a box and as high as its header and the rows of the side with more ports; a wire between the ports it joins. A box whose primitive the palette does not offer has its header alone, and a wire into or out of it ends at the first row, as the view draws them. */
export const boundsOf = (
  design: Design,
  entity: Entity,
): Option.Option<{ x: number; y: number; width: number; height: number }> =>
  entity._tag === 'Box'
    ? Option.map(
        Array.findFirst(design.boxes, (box) => box.id === entity.id),
        (box) => ({
          x: box.position.x,
          y: box.position.y,
          width: Geometry.boxWidth,
          height:
            Geometry.headerHeight +
            Geometry.portHeight *
              Option.match(Palette.find(box.primitive), {
                onNone: () => 0,
                onSome: (primitive) => Math.max(primitive.inputs.length, primitive.outputs.length),
              }),
        }),
      )
    : Option.flatMap(
        Array.findFirst(
          design.wires,
          (wire) => wire.to.box === entity.to.box && wire.to.port === entity.to.port,
        ),
        (wire) =>
          Option.map(
            Option.all([
              Array.findFirst(design.boxes, (box) => box.id === wire.from.box),
              Array.findFirst(design.boxes, (box) => box.id === wire.to.box),
            ]),
            ([from, to]) => {
              const start = Geometry.outputAnchor(
                from.position,
                Option.match(Palette.find(from.primitive), {
                  onNone: () => 0,
                  onSome: (primitive) => Math.max(primitive.outputs.indexOf(wire.from.port), 0),
                }),
              );
              const end = Geometry.inputAnchor(
                to.position,
                Option.match(Palette.find(to.primitive), {
                  onNone: () => 0,
                  onSome: (primitive) => Math.max(primitive.inputs.indexOf(wire.to.port), 0),
                }),
              );
              return {
                x: Math.min(start.x, end.x),
                y: Math.min(start.y, end.y),
                width: Math.abs(end.x - start.x),
                height: Math.abs(end.y - start.y),
              };
            },
          ),
      );

/** A schema of the arrow keys, by the names the browser gives them, which move a box on the canvas or pan the view. */
export const Arrow = Schema.Literals(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** A schema of the ways the view is zoomed by a button or a key: in to the next larger level, out to the next smaller, or back to the size of the canvas itself. */
export const ZoomDirection = Schema.Literals(['in', 'out', 'reset']);

/** A schema of what happens in the editor, each a fact named for its cause. */
export const EditorMessage = UiSchema.TaggedEnum({
  /** A primitive of the palette was chosen, by its name. */
  ClickedPrimitive: { primitive: Schema.String },
  /** A primitive of the palette was dragged onto the canvas and dropped, by its name, at a place in the canvas panel, from its top left corner. */
  DroppedPrimitive: { primitive: Schema.String, x: Schema.Finite, y: Schema.Finite },
  /** A box was clicked anywhere but on a port. */
  ClickedBox: { id: Schema.String },
  /** Focus came to a box or to something in it, as by the Tab key. */
  FocusedBox: { id: Schema.String },
  /** An arrow key was pressed on a box, by the name of the key. */
  PressedBoxArrow: { id: Schema.String, key: Arrow },
  /** Delete or Backspace was pressed on a box. */
  PressedBoxDelete: { id: Schema.String },
  /** The header of a box was pressed by a pointer, at a place in the viewport. */
  PressedHeader: { id: Schema.String, x: Schema.Finite, y: Schema.Finite },
  /** The pointer that pressed a header moved, to a place in the viewport. */
  MovedPointer: { x: Schema.Finite, y: Schema.Finite },
  /** The pointer that pressed a header was lifted. */
  ReleasedPointer: {},
  /** The press on a header was taken over by the browser, as by a scroll. */
  CancelledPointer: {},
  /** An output port was clicked, by a pointer or, as by Enter, by none. */
  ClickedOutput: { box: Schema.String, port: Schema.String, pointer: Schema.Boolean },
  /** An output port was pressed by a pointer, at a place in the viewport. */
  PressedOutput: { box: Schema.String, port: Schema.String, x: Schema.Finite, y: Schema.Finite },
  /** The canvas was measured after an output port was pressed: where its top left corner lies in the viewport, or nothing when it is not drawn. */
  CompletedMeasureCanvas: { origin: Schema.NullOr(Position) },
  /** The pointer that pressed an output port moved, to a place in the viewport. */
  MovedWire: { x: Schema.Finite, y: Schema.Finite },
  /** The pointer that pressed an output port was lifted, at a place in the viewport. */
  ReleasedWire: { x: Schema.Finite, y: Schema.Finite },
  /** The press on an output port was taken over by the browser, as by a scroll. */
  CancelledWire: {},
  /** An input port was clicked. */
  ClickedInput: { box: Schema.String, port: Schema.String },
  /** The canvas was clicked where no box lies. */
  ClickedCanvas: {},
  /** The canvas was pressed where no box lies, by a pointer of an id, at a place in the viewport. */
  PressedCanvas: { pointer: Schema.Finite, x: Schema.Finite, y: Schema.Finite },
  /** A pointer pressing the canvas moved, to a place in the viewport. */
  MovedCanvas: { pointer: Schema.Finite, x: Schema.Finite, y: Schema.Finite },
  /** A pointer pressing the canvas was lifted. */
  ReleasedCanvas: { pointer: Schema.Finite },
  /** A press on the canvas was taken over by the browser. */
  CancelledCanvas: { pointer: Schema.Finite },
  /** An arrow key was pressed on the canvas, by the name of the key. */
  PressedCanvasArrow: { key: Arrow },
  /** The canvas panel was measured as a second pointer pressed it: where its top left corner lies in the viewport, or nothing when it is not drawn. */
  CompletedMeasurePinch: { origin: Schema.NullOr(Position) },
  /** A zoom button was clicked, by the way it zooms. */
  ClickedZoom: { direction: ZoomDirection },
  /** A zoom key was pressed anywhere in the document but in a field, by the way it zooms. */
  PressedZoom: { direction: ZoomDirection },
  /** The canvas panel was measured to zoom the view about its centre: the zoom to go to, and the centre of the panel in the panel, or nothing when it is not drawn. */
  CompletedMeasureZoom: { zoom: Schema.Finite, centre: Schema.NullOr(Position) },
  /** A wire was clicked on the canvas, the wire named by the input port it enters. */
  ClickedWire: { to: Port },
  /** A box or a wire was clicked in the lists of the inspector. */
  ClickedEntity: { entity: Entity },
  /** The canvas panel was measured to bring the selected box or wire into view: its size, or nothing when it is not drawn. */
  CompletedMeasureReveal: {
    size: Schema.NullOr(Schema.Struct({ width: Schema.Finite, height: Schema.Finite })),
  },
  /** Escape was pressed anywhere in the document. */
  PressedEscape: {},
  /** Delete or Backspace was pressed anywhere in the document but in a field or on a box, which handles it itself. */
  PressedDelete: {},
  /** A parameter of the selected box was written in the inspector. */
  UpdatedParameter: { name: Schema.String, value: Schema.String },
  /** The delete button of the selected box was clicked in the inspector. */
  ClickedDelete: {},
  /** The remove button of the selected wire was clicked in the inspector, the wire named by the input port it enters. */
  ClickedRemoveWire: { box: Schema.String, port: Schema.String },
  /** The copy button of the design file was clicked. */
  ClickedCopy: {},
  /** The clipboard took the text of the design file. */
  SucceededCopyDesign: { json: Schema.String },
  /** The clipboard refused the text of the design file, as a browser does outside a secure page or without permission. */
  FailedCopyDesign: { json: Schema.String },
});

/** What happens in the editor. */
export type EditorMessage = typeof EditorMessage.Type;

/**
 * The editor of Falkara Workspace: a palette of the primitives of the theory, a canvas where boxes of them are placed and wired, and an inspector of every box and every wire and of the one selected. Its update and its view are written against this definition, in files of their own.
 */
export const EditorDef = Html.component({
  name: 'Editor',
  model: EditorModel,
  message: EditorMessage,
});
