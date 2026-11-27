import { Button, Field, Input, Toggle } from '@effect/ui-kit';
import { Html } from '@effect/ui/html';
import * as stylex from '@stylexjs/stylex';
import { Array, Cause, Exit, Option, Schema } from 'effect';

import * as Design from '#src/Design';
import {
  Arrow,
  EditorDef,
  EditorMessage,
  type EditorModel,
  type Entity,
  aimedOf,
  pointerOf,
  sourceOf,
} from '#src/EditorDefinition';
import * as Geometry from '#src/Geometry';
import * as Palette from '#src/Palette';
import { Scheme } from '#src/Scheme';
import { styled } from '#src/Styled';

// Relative, as StyleX finds variables by the path of the module that defines them.
import { handle } from './Port.stylex';

/** The canvas panel, the view the canvas is panned and zoomed in. Named so that focus is moved to it when the box that held focus is deleted and focus would otherwise be lost to the document, and so that it is measured when a pointer needs a place on the canvas: a pointer event says where the pointer is in the viewport, and the place of the panel in the viewport, with the view, turns that into a place among the boxes. */
export const canvas = Html.ref('canvas', 'section');

/** The styles of the editor. Every length and color comes from `stylex.env`, which the Vite config works out with Falkara Presentation, save the geometry of the canvas, which the view passes in CSS pixels from `Geometry`, as the wires are drawn from the same numbers. */
const styles = stylex.create({
  // The three panels side by side, the canvas taking what the palette and the inspector leave. Below the width at which the canvas would fall under the two panels together, they stack, so that nothing needs scrolling in two directions, as WCAG 2.2 Reflow requires.
  editor: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(14rem, 1fr) minmax(0, 4fr) minmax(16rem, 1fr)',
      '@media (max-width: 60rem)': 'minmax(0, 1fr)',
    },
    gridTemplateRows: {
      default: 'minmax(0, 1fr)',
      '@media (max-width: 60rem)': 'auto minmax(24rem, 1fr) auto',
    },
    gap: stylex.env.space.half,
    boxSizing: 'border-box',
    height: '100%',
    backgroundColor: stylex.env.color.ground,
    color: stylex.env.color.text,
    fontFamily: 'system-ui, sans-serif',
    fontSize: stylex.env.fontSize.body,
    lineHeight: stylex.env.lineHeight,
  },
  panel: {
    minWidth: 0,
    padding: stylex.env.space.two,
    overflow: 'auto',
    backgroundColor: stylex.env.color.panel,
  },
  heading: {
    marginBlock: 0,
    fontSize: stylex.env.fontSize.heading,
  },
  subheading: {
    marginBlockStart: stylex.env.space.two,
    marginBlockEnd: 0,
    fontSize: stylex.env.fontSize.body,
  },
  list: {
    display: 'grid',
    gap: stylex.env.space.oneAndHalf,
    marginBlockStart: stylex.env.space.two,
    marginBlockEnd: 0,
    padding: 0,
    listStyleType: 'none',
  },
  // An item of the palette is dragged by the pointer: it shows that it can be grabbed.
  primitive: {
    cursor: 'grab',
  },
  description: {
    marginBlockStart: stylex.env.space.half,
    marginBlockEnd: 0,
    color: stylex.env.color.mutedText,
    fontSize: stylex.env.fontSize.small,
  },
  // A button is a raised surface edged by the border, which shows it can be pressed: under the pointer its edge takes the color of text, and under the keyboard's focus a ring of the accent stands off it.
  button: {
    paddingBlock: stylex.env.space.half,
    paddingInline: stylex.env.space.oneAndHalf,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: {
      default: stylex.env.color.border,
      ':hover': stylex.env.color.text,
    },
    borderRadius: stylex.env.space.half,
    backgroundColor: stylex.env.color.raised,
    color: stylex.env.color.text,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    cursor: 'pointer',
    outlineColor: stylex.env.color.accent,
    outlineOffset: 2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  },
  danger: {
    borderColor: {
      default: stylex.env.color.danger,
      ':hover': stylex.env.color.text,
    },
    color: stylex.env.color.danger,
  },
  // The canvas panel is the view the canvas is panned and zoomed in, which the editor draws itself rather than scroll: what lies beyond its edges is cut off, and a press on it pans the view, a touch too, rather than scroll the page. It shows the ground, the lowest level, under the panels on either side, and a ring of the accent inside its edge while it has the keyboard's focus.
  stage: {
    position: 'relative',
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: stylex.env.color.ground,
    cursor: 'grab',
    touchAction: 'none',
    outlineColor: stylex.env.color.accent,
    outlineOffset: -2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  },
  panning: {
    cursor: 'grabbing',
  },
  // The status of the canvas stays in a corner of the panel, over the canvas, however it is panned: a raised bar, edged by the border where it meets the canvas.
  status: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    zIndex: 1,
    margin: 0,
    paddingBlock: stylex.env.space.half,
    paddingInline: stylex.env.space.two,
    borderColor: stylex.env.color.border,
    borderStyle: 'solid',
    borderWidth: 0,
    borderBlockEndWidth: 1,
    borderInlineEndWidth: 1,
    backgroundColor: stylex.env.color.raised,
    color: stylex.env.color.mutedText,
    fontSize: stylex.env.fontSize.small,
  },
  // The zoom of the view stays in the other corner of the panel, over the canvas, a raised bar as the status is.
  zoom: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineEnd: 0,
    zIndex: 1,
    display: 'flex',
    gap: stylex.env.space.half,
    padding: stylex.env.space.half,
    borderColor: stylex.env.color.border,
    borderStyle: 'solid',
    borderWidth: 0,
    borderBlockEndWidth: 1,
    borderInlineStartWidth: 1,
    backgroundColor: stylex.env.color.raised,
    cursor: 'default',
  },
  // A control on the canvas has square corners, as everything on the canvas has.
  square: {
    borderRadius: 0,
  },
  // The canvas lies in its panel as the view says: moved from the top left corner of the panel and drawn larger or smaller from that corner. It shows the square grid boxes are placed on as a dot where every two lines of the grid cross, the corners a box is placed at and the points its wires end at: a dot is quiet beside a line across the whole canvas, while its color keeps the contrast of a graphic, so that the grid shows in either scheme.
  canvas: (width: number, height: number, step: number, x: number, y: number, zoom: number) => ({
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    width,
    height,
    transformOrigin: '0 0',
    transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    backgroundImage: `radial-gradient(circle, ${stylex.env.color.grid} 1px, transparent 1.5px)`,
    backgroundPosition: `${step / -2}px ${step / -2}px`,
    backgroundSize: `${step}px ${step}px`,
  }),
  wires: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    pointerEvents: 'none',
  },
  wire: {
    fill: 'none',
    stroke: stylex.env.color.text,
    strokeWidth: 2,
  },
  // The selected wire, in the accent and wider, as a selected box is edged in the accent.
  chosenWire: {
    stroke: stylex.env.color.accent,
    strokeWidth: 4,
  },
  // What the pointer clicks to select a wire: its path, unseen, as wide as a step of the grid, so that a thin wire need not be hit exactly.
  wireTarget: (width: number) => ({
    fill: 'none',
    stroke: 'transparent',
    strokeWidth: width,
    cursor: 'pointer',
  }),
  // The wire a drag is drawing, dashed and in the accent, as it is not yet part of the design.
  drawing: {
    stroke: stylex.env.color.accent,
    strokeDasharray: '6 4',
  },
  // A box is placed by a transform from the corner of the canvas. It is a raised surface, its border an inset shadow, which takes no room, so that the rows of its ports lie exactly where the wires are drawn to, under a soft shadow that lifts it off the canvas. Its corners are square, as everything on the canvas is, so that its edges run along the lines of the grid. Under the keyboard's focus a ring of the accent stands off it.
  box: (x: number, y: number, width: number) => ({
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineStart: 0,
    transform: `translate(${x}px, ${y}px)`,
    width,
    backgroundColor: stylex.env.color.raised,
    boxShadow: `inset 0 0 0 1px ${stylex.env.color.border}, 0 2px 6px color-mix(in oklch, black 25%, transparent)`,
    outlineColor: stylex.env.color.accent,
    outlineOffset: 3,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  }),
  // The selected box: edged twice as thick in the accent, with a glow of the accent around it, so that it stands out by more than its color.
  selected: {
    boxShadow: `inset 0 0 0 2px ${stylex.env.color.accent}, 0 0 0 3px color-mix(in oklch, ${stylex.env.color.accent} 35%, transparent), 0 2px 6px color-mix(in oklch, black 25%, transparent)`,
  },
  // The header is what a box is dragged by. A touch on it drags the box rather than scrolls the canvas, and dragging selects no text. A faint line, within its height, parts it from the ports.
  header: (height: number) => ({
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    height,
    borderBlockEndColor: `color-mix(in oklch, ${stylex.env.color.border} 50%, transparent)`,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    paddingInline: stylex.env.space.oneAndHalf,
    overflow: 'hidden',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  }),
  ports: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  },
  side: {
    display: 'grid',
    alignContent: 'start',
  },
  // A port is a row of its side of the box: its handle, which lies on the edge of the box where its wires end, and its name beside the handle. The row is the whole target, so that the handle need not be hit exactly, and under the keyboard's focus a ring of the accent runs inside it.
  port: (height: number) => ({
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    minWidth: 0,
    height,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: stylex.env.color.text,
    fontFamily: 'inherit',
    fontSize: stylex.env.fontSize.small,
    cursor: 'pointer',
    outlineColor: stylex.env.color.accent,
    outlineOffset: -2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  }),
  input: { flexDirection: 'row' },
  // A touch on an output port drags a wire rather than scrolls the canvas.
  output: { flexDirection: 'row-reverse', touchAction: 'none' },
  // The handle is centred on the edge of the box by a margin of half its size to either side, so that it takes no room in the row, and its centre lies where a line of the grid crosses the edge. It stays a round dot, the one round thing on the canvas, as it marks a point, the end of a wire, rather than an area as the square box does. Its fill, its edge and its glow are the port's to set.
  handle: (size: number) => ({
    flexShrink: 0,
    boxSizing: 'border-box',
    width: size,
    height: size,
    marginInline: size / -2,
    borderRadius: '50%',
    backgroundColor: handle.fill,
    boxShadow: `inset 0 0 0 2px ${handle.ring}, 0 0 0 4px ${handle.halo}`,
  }),
  name: {
    minWidth: 0,
    paddingInline: stylex.env.space.oneAndHalf,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // A port that answers a press: its handle fills under the pointer and under focus, and glows while it is pressed.
  live: {
    [handle.fill]: {
      default: stylex.env.color.raised,
      ':hover': stylex.env.color.accent,
      ':focus-visible': stylex.env.color.accent,
    },
    [handle.ring]: {
      default: stylex.env.color.border,
      ':hover': stylex.env.color.accent,
      ':focus-visible': stylex.env.color.accent,
    },
    [handle.halo]: {
      default: 'transparent',
      ':active': `color-mix(in oklch, ${stylex.env.color.accent} 30%, transparent)`,
    },
  },
  // A port with a wire: its handle is filled, as the end of the wire.
  wired: {
    [handle.fill]: {
      default: stylex.env.color.text,
      ':hover': stylex.env.color.accent,
      ':focus-visible': stylex.env.color.accent,
    },
    [handle.ring]: {
      default: stylex.env.color.text,
      ':hover': stylex.env.color.accent,
      ':focus-visible': stylex.env.color.accent,
    },
  },
  // The output port a wire is being drawn from: its handle filled with the accent and glowing, its name in the accent.
  drawn: {
    color: stylex.env.color.accent,
    fontWeight: 700,
    [handle.fill]: stylex.env.color.accent,
    [handle.ring]: stylex.env.color.accent,
    [handle.halo]: `color-mix(in oklch, ${stylex.env.color.accent} 30%, transparent)`,
  },
  // An input port the wire being drawn can enter: its handle edged with the accent and glowing, and filled under the pointer and under focus, its name in the accent.
  offered: {
    color: stylex.env.color.accent,
    fontWeight: 700,
    [handle.fill]: {
      default: stylex.env.color.raised,
      ':hover': stylex.env.color.accent,
      ':focus-visible': stylex.env.color.accent,
    },
    [handle.ring]: stylex.env.color.accent,
    [handle.halo]: `color-mix(in oklch, ${stylex.env.color.accent} 30%, transparent)`,
  },
  // The input port a dragged wire is over and would enter: its handle filled, as under a pointer, which the port never feels while the output port holds the pointer.
  aimed: {
    [handle.fill]: stylex.env.color.accent,
  },
  // An input port a click does nothing to: while no wire is being drawn, or while one is drawn from its own box.
  idle: {
    color: stylex.env.color.mutedText,
    cursor: 'default',
  },
  field: {
    display: 'grid',
    gap: stylex.env.space.half,
    marginBlockStart: stylex.env.space.oneAndHalf,
  },
  // A field is sunk into its panel, on the ground, the level below it, edged by the border, with a ring of the accent under the keyboard's focus, as a button has.
  control: {
    boxSizing: 'border-box',
    width: '100%',
    paddingBlock: stylex.env.space.half,
    paddingInline: stylex.env.space.one,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: stylex.env.color.border,
    borderRadius: stylex.env.space.half,
    backgroundColor: stylex.env.color.ground,
    color: stylex.env.color.text,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    outlineColor: stylex.env.color.accent,
    outlineOffset: 2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  },
  // The deletion of the selected box or wire stands apart from what is above it.
  action: {
    marginBlockStart: stylex.env.space.oneAndHalf,
  },
  // The lists of every box and every wire, an item to a line.
  entities: {
    display: 'grid',
    marginBlockStart: stylex.env.space.one,
    marginBlockEnd: 0,
    padding: 0,
    listStyleType: 'none',
  },
  // An item of a list is a button the width of the panel, its name read from the start, a line of it the height WCAG 2.2 Target Size (Minimum) asks of a target at the least.
  entity: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 24,
    paddingBlock: stylex.env.space.half,
    paddingInline: stylex.env.space.one,
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':hover': stylex.env.color.raised },
    boxShadow: 'none',
    color: stylex.env.color.text,
    fontFamily: 'inherit',
    fontSize: stylex.env.fontSize.small,
    lineHeight: 'inherit',
    textAlign: 'start',
    cursor: 'pointer',
    outlineColor: stylex.env.color.accent,
    outlineOffset: -2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
  },
  // The item of what is selected: raised, in the accent, bold, and marked by a bar of the accent at its start, as the canvas edges what is selected in the accent.
  currentEntity: {
    backgroundColor: stylex.env.color.raised,
    boxShadow: `inset 3px 0 0 ${stylex.env.color.accent}`,
    color: stylex.env.color.accent,
    fontWeight: 700,
  },
  file: {
    marginBlockStart: stylex.env.space.three,
  },
  copy: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: stylex.env.space.one,
    alignItems: 'center',
    marginBlockStart: stylex.env.space.one,
    fontSize: stylex.env.fontSize.small,
  },
  // The text of the design file as it is written, every line whole: a line longer than the panel scrolls rather than break within a name or a number, and a file longer than the block scrolls within it.
  json: {
    maxBlockSize: '24rem',
    marginBlock: stylex.env.space.one,
    padding: stylex.env.space.one,
    overflow: 'auto',
    borderRadius: stylex.env.space.half,
    backgroundColor: stylex.env.color.ground,
    fontFamily: 'ui-monospace, monospace',
    fontSize: stylex.env.fontSize.small,
    whiteSpace: 'pre',
    tabSize: 2,
  },
});

/** The type a primitive dragged from the palette is carried by, its name the data: a type of the editor's own, so that the canvas takes no other drag, such as text or a file. */
const primitiveType = 'application/x-falkara-primitive';

/** The palette: every primitive as a button that places a box of it, with what the primitive makes. The whole item is dragged onto the canvas, to place the box where it is dropped; the button is the way that needs no pointer. Under the primitives, the switch of the color scheme. */
const palette = EditorDef.fragment((h) =>
  styled(h.aside.attr('aria-label', 'Palette'), styles.panel).children(
    styled(h.h2, styles.heading).children('Palette'),
    styled(h.ul, styles.list).children(
      Palette.primitives.map((primitive) =>
        styled(
          h.li
            .key(primitive.name)
            .draggable({ [primitiveType]: primitive.name }, { effectAllowed: 'copy' }),
          styles.primitive,
        ).children(
          styled(
            Button(h, {
              onPress: EditorMessage.ClickedPrimitive({ primitive: primitive.name }),
            }),
            styles.button,
          ).children(primitive.title),
          styled(h.p, styles.description).children(primitive.description),
        ),
      ),
    ),
    // The switch of the color scheme, a component of its own, at the end of the panel.
    Scheme(h, { key: 'scheme', props: {} }),
  ),
);

/** A box of the design with the primitive it is of; a box whose primitive the palette does not offer, as in a design file written for a later theory, is shown by the name of the primitive, with no ports. */
const placedOf = (box: Design.Box) => ({
  box,
  primitive: Option.getOrElse(Palette.find(box.primitive), (): Palette.Primitive => ({
    name: box.primitive,
    title: box.primitive,
    description: '',
    inputs: [],
    outputs: [],
    parameters: [],
  })),
});

/** The name a box goes by where a person reads it, by its id among the boxes of the design: the title of its primitive and the number the editor gave it, as `Series 1`. A box of a design file whose id is no number of the editor's goes by its id after the title, and an id no box has by itself. */
const nameOf = (placed: ReadonlyArray<ReturnType<typeof placedOf>>, id: string): string =>
  Option.match(
    Array.findFirst(placed, ({ box }) => box.id === id),
    {
      onNone: () => id,
      onSome: ({ primitive }) =>
        `${primitive.title} ${id.startsWith('box-') ? id.slice('box-'.length) : id}`,
    },
  );

/** The name a wire goes by where a person reads it: the box it leaves, the box it enters and the input port it enters, as `Series 1 → Map input 2: machine`; and the output port it leaves too, when the box it leaves has more than one. */
const wireNameOf = (placed: ReadonlyArray<ReturnType<typeof placedOf>>, wire: Design.Wire) =>
  `${nameOf(placed, wire.from.box)}${placed.some(({ box, primitive }) => box.id === wire.from.box && primitive.outputs.length > 1) ? `: ${wire.from.port}` : ''} → ${nameOf(placed, wire.to.box)}: ${wire.to.port}`;

/** The canvas: the wires, drawn under the boxes, and every box with its header and its ports. */
const stage = EditorDef.fragment((h, model: EditorModel) => {
  const placed = model.design.boxes.map(placedOf);
  const source = sourceOf(model);
  const aimed = aimedOf(model);
  // Where the wire a drag draws ends: at the input port the pointer is over, which it would enter, or else at the pointer.
  const end = Option.getOrUndefined(
    Option.orElse(
      Option.flatMap(aimed, (to) =>
        Option.map(
          Array.findFirst(placed, (target) => target.box.id === to.box),
          (target) =>
            Geometry.inputAnchor(
              target.box.position,
              Math.max(target.primitive.inputs.indexOf(to.port), 0),
            ),
        ),
      ),
      () => pointerOf(model),
    ),
  );
  // The panel takes focus, so that the arrow keys pan the view, and holds the pointer that presses it where no box lies, so that the pan follows the pointer wherever it goes. The moves and the end of a press send a message only while a press lasts. A primitive dragged from the palette is dropped anywhere on the panel, boxes included, and placed where the pointer lets it go, which the drop gives from the corner of the panel.
  return styled(
    h.section.ref(canvas).attrs({ 'aria-label': 'Canvas', tabindex: '0' }),
    styles.stage,
    model.panning !== null && styles.panning,
  )
    .on('click', EditorMessage.ClickedCanvas())
    .on(
      'pointerdown',
      ({ button, pointerId, x, y }) =>
        button === 0 || button === 1
          ? EditorMessage.PressedCanvas({ pointer: pointerId, x, y })
          : undefined,
      { capturePointer: true },
    )
    .on('pointermove', ({ pointerId, x, y }) =>
      model.panning === null ? undefined : EditorMessage.MovedCanvas({ pointer: pointerId, x, y }),
    )
    .on('pointerup', ({ pointerId }) =>
      model.panning === null ? undefined : EditorMessage.ReleasedCanvas({ pointer: pointerId }),
    )
    .on('pointercancel', ({ pointerId }) =>
      model.panning === null ? undefined : EditorMessage.CancelledCanvas({ pointer: pointerId }),
    )
    .on(
      'keydown',
      ({ key }) => (Schema.is(Arrow)(key) ? EditorMessage.PressedCanvasArrow({ key }) : undefined),
      { preventDefault: true },
    )
    .dropTarget({ accepts: [primitiveType], dropEffect: 'copy' })
    .on('drop', ({ data, x, y }) =>
      Option.match(Option.fromNullishOr(data[primitiveType]), {
        onNone: () => undefined,
        onSome: (primitive) => EditorMessage.DroppedPrimitive({ primitive, x, y }),
      }),
    )
    .children(
      styled(h.p.attr('role', 'status'), styles.status).children(
        source === null
          ? `Boxes: ${model.design.boxes.length}. Wires: ${model.design.wires.length}.`
          : `Drawing a wire from ${source.port} of ${nameOf(placed, source.box)}. Choose an input port of another box, or press Escape.`,
      ),
      // The zoom of the view, which the keys +, - and 0 change too. A press on it pans nothing, so that a click reaches its buttons rather than the canvas, which would hold the pointer.
      styled(h.div.attrs({ role: 'group', 'aria-label': 'Zoom' }), styles.zoom)
        .on('pointerdown', () => undefined)
        .children(
          styled(
            Button(h, {
              props: {
                disabled: model.view.zoom <= Geometry.minimumZoom,
                focusableWhenDisabled: true,
              },
              onPress: EditorMessage.ClickedZoom({ direction: 'out' }),
            }).attr('aria-label', 'Zoom out'),
            styles.button,
            styles.square,
          ).children('−'),
          styled(
            Button(h, { onPress: EditorMessage.ClickedZoom({ direction: 'reset' }) }).attr(
              'aria-label',
              `Zoom ${Math.round(model.view.zoom * 100)}%, reset to 100%`,
            ),
            styles.button,
            styles.square,
          ).children(`${Math.round(model.view.zoom * 100)}%`),
          styled(
            Button(h, {
              props: {
                disabled: model.view.zoom >= Geometry.maximumZoom,
                focusableWhenDisabled: true,
              },
              onPress: EditorMessage.ClickedZoom({ direction: 'in' }),
            }).attr('aria-label', 'Zoom in'),
            styles.button,
            styles.square,
          ).children('+'),
        ),
      styled(
        h.div,
        styles.canvas(
          Geometry.canvasWidth,
          Geometry.canvasHeight,
          Geometry.gridStep,
          model.view.x,
          model.view.y,
          model.view.zoom,
        ),
      ).children(
        // The wires are drawn for the eye and the pointer alone: the ports and the inspector say the same in words, and the inspector selects a wire by the keyboard.
        styled(
          h.svg.attrs({
            width: String(Geometry.canvasWidth),
            height: String(Geometry.canvasHeight),
            viewBox: `0 0 ${Geometry.canvasWidth} ${Geometry.canvasHeight}`,
            'aria-hidden': 'true',
          }),
          styles.wires,
        ).children(
          model.design.wires.flatMap((wire) => {
            const from = placed.find(({ box }) => box.id === wire.from.box);
            const to = placed.find(({ box }) => box.id === wire.to.box);
            if (from === undefined || to === undefined) return [];
            const path = Geometry.wirePath(
              Geometry.outputAnchor(
                from.box.position,
                Math.max(from.primitive.outputs.indexOf(wire.from.port), 0),
              ),
              Geometry.inputAnchor(
                to.box.position,
                Math.max(to.primitive.inputs.indexOf(wire.to.port), 0),
              ),
            );
            // The wire as it is seen, in the accent while it is selected; and over it the same path, unseen and as wide as a step of the grid, which is what the pointer clicks to select the wire. SVG's own attribute lets the pointer at that path alone, as the drawing of the wires lets it at nothing. A press on it pans nothing, so that its click reaches it rather than the canvas, which would hold the pointer.
            return [
              styled(
                h.path.key(`${wire.to.box}:${wire.to.port}`),
                styles.wire,
                model.selected?._tag === 'Wire' &&
                  model.selected.to.box === wire.to.box &&
                  model.selected.to.port === wire.to.port &&
                  styles.chosenWire,
              ).attr('d', path),
              styled(
                h.path
                  .key(`${wire.to.box}:${wire.to.port}:target`)
                  .attrs({ d: path, 'pointer-events': 'stroke' }),
                styles.wireTarget(Geometry.gridStep),
              )
                .on('pointerdown', () => undefined)
                .on('click', EditorMessage.ClickedWire({ to: wire.to })),
            ];
          }),
          // The wire a drag draws, from its output port to the pointer, or to the input port the pointer is over, which it would enter.
          placed.flatMap(({ box, primitive }) =>
            end === undefined || source === null || source.box !== box.id
              ? []
              : [
                  styled(h.path.key('drawing'), styles.wire, styles.drawing).attr(
                    'd',
                    Geometry.wirePath(
                      Geometry.outputAnchor(
                        box.position,
                        Math.max(primitive.outputs.indexOf(source.port), 0),
                      ),
                      end,
                    ),
                  ),
                ],
          ),
        ),
        placed.map(({ box, primitive }) => {
          const header = styled(h.div, styles.header(Geometry.headerHeight))
            .on(
              'pointerdown',
              ({ button, x, y }) =>
                button === 0 ? EditorMessage.PressedHeader({ id: box.id, x, y }) : undefined,
              { capturePointer: true },
            )
            .children(primitive.title);
          // A press on the box, where it has no handle of its own, pans nothing: its handler sends no message, and the canvas, which hears only what no element within it hears, neither pans nor holds the pointer, so that a click on a port still reaches the port.
          return styled(
            h.div.key(box.id).attrs({
              role: 'group',
              tabindex: '0',
              'aria-label': nameOf(placed, box.id),
              'aria-current':
                model.selected?._tag === 'Box' && model.selected.id === box.id ? 'true' : undefined,
            }),
            styles.box(box.position.x, box.position.y, Geometry.boxWidth),
            model.selected?._tag === 'Box' && model.selected.id === box.id && styles.selected,
          )
            .on('pointerdown', () => undefined)
            .on('click', EditorMessage.ClickedBox({ id: box.id }))
            .on('focusin', EditorMessage.FocusedBox({ id: box.id }))
            .on(
              'keydown',
              ({ key }) =>
                Schema.is(Arrow)(key)
                  ? EditorMessage.PressedBoxArrow({ id: box.id, key })
                  : key === 'Delete' || key === 'Backspace'
                    ? EditorMessage.PressedBoxDelete({ id: box.id })
                    : undefined,
              { preventDefault: true },
            )
            .children(
              // The moves and the end of a press are heard only while this box is dragged, as the header holds the pointer from the press on.
              model.dragging?.box === box.id
                ? header
                    .on('pointermove', ({ x, y }) => EditorMessage.MovedPointer({ x, y }))
                    .on('pointerup', EditorMessage.ReleasedPointer())
                    .on('pointercancel', EditorMessage.CancelledPointer())
                : header,
              styled(h.div, styles.ports).children(
                styled(h.div, styles.side).children(
                  primitive.inputs.map((port) => {
                    const wire = model.design.wires.find(
                      (wire) => wire.to.box === box.id && wire.to.port === port,
                    );
                    // An input port takes a wire only while one is drawn from another box. It keeps its place in the order of focus meanwhile, so that it can be found before a wire is drawn.
                    const isOffered = source !== null && source.box !== box.id;
                    return styled(
                      Button(h, {
                        element: h.button.key(port),
                        props: { disabled: !isOffered, focusableWhenDisabled: true },
                        onPress: EditorMessage.ClickedInput({ box: box.id, port }),
                      }).attr(
                        'aria-label',
                        wire === undefined
                          ? `Input ${port} of ${nameOf(placed, box.id)}`
                          : `Input ${port} of ${nameOf(placed, box.id)}, wired from ${wire.from.port} of ${nameOf(placed, wire.from.box)}`,
                      ),
                      styles.port(Geometry.portHeight),
                      styles.input,
                      wire !== undefined && styles.wired,
                      isOffered ? styles.offered : styles.idle,
                      Option.exists(aimed, (to) => to.box === box.id && to.port === port) &&
                        styles.aimed,
                    ).children(
                      styled(
                        h.span.attr('aria-hidden', 'true'),
                        styles.handle(Geometry.handleSize),
                      ),
                      styled(h.span, styles.name).children(port),
                    );
                  }),
                ),
                styled(h.div, styles.side).children(
                  primitive.outputs.map((port) => {
                    const isDrawn =
                      source !== null && source.box === box.id && source.port === port;
                    // A press on the port may become a drag that draws a wire, and holds the pointer from then on. The click that ends a press, or that Enter makes, comes with the kind of pointer that made it, none for the keyboard, which the toggle of the kit would not pass on; so the kit writes the pressed state alone and the click is heard here.
                    const output = h.button
                      .key(port)
                      .on(
                        'pointerdown',
                        ({ button, x, y }) =>
                          button === 0
                            ? EditorMessage.PressedOutput({ box: box.id, port, x, y })
                            : undefined,
                        { capturePointer: true },
                      )
                      .on('click', ({ pointerType }) =>
                        EditorMessage.ClickedOutput({
                          box: box.id,
                          port,
                          pointer: pointerType !== '',
                        }),
                      );
                    return styled(
                      Toggle(h, {
                        // The moves and the end of the press are heard only while it lasts.
                        element:
                          model.drawing !== null &&
                          model.drawing.from.box === box.id &&
                          model.drawing.from.port === port
                            ? output
                                .on('pointermove', ({ x, y }) => EditorMessage.MovedWire({ x, y }))
                                .on('pointerup', ({ x, y }) => EditorMessage.ReleasedWire({ x, y }))
                                .on('pointercancel', EditorMessage.CancelledWire())
                            : output,
                        props: { pressed: isDrawn },
                      }).attr('aria-label', `Output ${port} of ${nameOf(placed, box.id)}`),
                      styles.port(Geometry.portHeight),
                      styles.output,
                      model.design.wires.some(
                        (wire) => wire.from.box === box.id && wire.from.port === port,
                      )
                        ? styles.wired
                        : styles.live,
                      isDrawn && styles.drawn,
                    ).children(
                      styled(
                        h.span.attr('aria-hidden', 'true'),
                        styles.handle(Geometry.handleSize),
                      ),
                      styled(h.span, styles.name).children(port),
                    );
                  }),
                ),
              ),
            );
        }),
      ),
    );
});

/** The selected box as the inspector shows it: its name, what it is and where, a field for each of its parameters, and its deletion. Its wires are in the list of every wire. */
const inspectedBox = EditorDef.fragment(
  (h, name: string, { box, primitive }: ReturnType<typeof placedOf>) =>
    h.div.key(box.id).children(
      styled(h.h3, styles.subheading).children(name),
      styled(h.p, styles.description).children(primitive.description),
      styled(h.p, styles.description).children(
        `${primitive.name} at ${box.position.x}, ${box.position.y}`,
      ),
      primitive.parameters.map((name) =>
        Field(h, {
          key: `${box.id}:${name}`,
          props: {},
          view: (field) =>
            styled(field.root(h.div), styles.field).children(
              field.label(h.label).children(name),
              styled(
                Input(h, {
                  element: field.control(h.input),
                  props: { value: box.parameters[name] ?? '' },
                  onUpdate: ({ value }) => EditorMessage.UpdatedParameter({ name, value }),
                }),
                styles.control,
              ),
            ),
        }),
      ),
      styled(
        Button(h, { onPress: EditorMessage.ClickedDelete() }),
        styles.button,
        styles.danger,
        styles.action,
      ).children(`Delete ${name}`),
    ),
);

/** The selected wire as the inspector shows it: its name, the ports it joins in words, and its removal. */
const inspectedWire = EditorDef.fragment(
  (h, name: string, wire: Design.Wire, from: string, to: string) =>
    h.div.key(`${wire.to.box}:${wire.to.port}`).children(
      styled(h.h3, styles.subheading).children(name),
      styled(h.p, styles.description).children(
        `A wire from the output ${wire.from.port} of ${from} into the input ${wire.to.port} of ${to}.`,
      ),
      styled(
        Button(h, {
          onPress: EditorMessage.ClickedRemoveWire({ box: wire.to.box, port: wire.to.port }),
        }).attr('aria-label', `Remove the wire ${name}`),
        styles.button,
        styles.danger,
        styles.action,
      ).children('Remove'),
    ),
);

/** An item of a list of the inspector: a box or a wire by its name, as a button that selects it and brings it into view, marked while it is selected, as the canvas highlights it. */
const entityItem = EditorDef.fragment(
  (h, key: string, name: string, entity: Entity, isSelected: boolean) =>
    h.li
      .key(key)
      .children(
        styled(
          Button(h, { onPress: EditorMessage.ClickedEntity({ entity }) }).attr(
            'aria-current',
            isSelected ? 'true' : undefined,
          ),
          styles.entity,
          isSelected && styles.currentEntity,
        ).children(name),
      ),
);

/** The inspector: the selected box or wire, or what to do while nothing is selected; every box and every wire of the design, each of which selects it; and the design file as it stands. */
const inspector = EditorDef.fragment((h, model: EditorModel) => {
  const placed = model.design.boxes.map(placedOf);
  const selected = model.selected;
  return styled(h.aside.attr('aria-label', 'Inspector'), styles.panel).children(
    styled(h.h2, styles.heading).children('Inspector'),
    Option.getOrElse(
      Option.orElse(
        Option.flatMap(
          Option.fromNullishOr(selected?._tag === 'Box' ? selected : undefined),
          (selected) =>
            Option.map(
              Array.findFirst(placed, ({ box }) => box.id === selected.id),
              (found) => inspectedBox(h, nameOf(placed, found.box.id), found),
            ),
        ),
        () =>
          Option.flatMap(
            Option.fromNullishOr(selected?._tag === 'Wire' ? selected : undefined),
            (selected) =>
              Option.map(
                Array.findFirst(
                  model.design.wires,
                  (wire) => wire.to.box === selected.to.box && wire.to.port === selected.to.port,
                ),
                (wire) =>
                  inspectedWire(
                    h,
                    wireNameOf(placed, wire),
                    wire,
                    nameOf(placed, wire.from.box),
                    nameOf(placed, wire.to.box),
                  ),
              ),
          ),
      ),
      () =>
        styled(h.p, styles.description).children(
          'Choose a primitive in the palette, or drag it onto the canvas, to place a box. Select a box or a wire on the canvas or in the lists below to inspect it. Arrow keys move a selected box, and Delete removes what is selected.',
        ),
    ),
    styled(h.h3, styles.subheading).children(`Boxes (${placed.length})`),
    placed.length === 0
      ? styled(h.p, styles.description).children('No box is placed yet.')
      : styled(h.ul, styles.entities).children(
          placed.map(({ box }) =>
            entityItem(
              h,
              box.id,
              nameOf(placed, box.id),
              { _tag: 'Box', id: box.id },
              selected?._tag === 'Box' && selected.id === box.id,
            ),
          ),
        ),
    styled(h.h3, styles.subheading).children(`Wires (${model.design.wires.length})`),
    model.design.wires.length === 0
      ? styled(h.p, styles.description).children('No wire is drawn yet.')
      : styled(h.ul, styles.entities).children(
          model.design.wires.map((wire) =>
            entityItem(
              h,
              `${wire.to.box}:${wire.to.port}`,
              wireNameOf(placed, wire),
              { _tag: 'Wire', to: wire.to },
              selected?._tag === 'Wire' &&
                selected.to.box === wire.to.box &&
                selected.to.port === wire.to.port,
            ),
          ),
        ),
    styled(h.details, styles.file).children(
      h.summary('Design file'),
      Exit.match(Design.toJson(model.design), {
        // The text of the file with a button that copies it, which says how the copy went for as long as the design stays what was copied. The text is a region of its own that scrolls both ways and takes focus, so that the keyboard scrolls it too.
        onSuccess: (json) => [
          styled(h.div, styles.copy).children(
            styled(Button(h, { onPress: EditorMessage.ClickedCopy() }), styles.button).children(
              'Copy',
            ),
            h.span
              .attr('role', 'status')
              .children(
                model.copied?.json !== json
                  ? ''
                  : model.copied.succeeded
                    ? 'Copied.'
                    : 'Could not copy. Select the text instead.',
              ),
          ),
          styled(
            h.pre.attrs({ role: 'group', tabindex: '0', 'aria-label': 'Design file' }),
            styles.json,
          ).children(json),
        ],
        onFailure: (cause) => [styled(h.pre, styles.json).children(Cause.pretty(cause))],
      }),
    ),
  );
});

/** The editor as it is drawn: the palette, the canvas and the inspector, in the order they are read and reached by keyboard. */
export const view = EditorDef.view((h, model) =>
  styled(h.main, styles.editor).children(palette(h), stage(h, model), inspector(h, model)),
);
