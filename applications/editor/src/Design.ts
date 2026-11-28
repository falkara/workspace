import { Schema } from 'effect';

/** A schema of a place on the canvas, from its origin, which has no edge: a place left of or above the origin is negative. Measured in CSS pixels. */
export const Position = Schema.Struct({
  /** The distance right of the origin, negative to its left. */
  x: Schema.Finite,
  /** The distance below the origin, negative above it. */
  y: Schema.Finite,
});

/** A place on the canvas, from its origin. */
export type Position = typeof Position.Type;

/** A schema of a port of a box: the box by its id, and the port by the name the primitive of the box gives it. */
export const Port = Schema.Struct({
  /** The id of the box the port is on. */
  box: Schema.String,
  /** The name of the port among the inputs or the outputs of the primitive of the box. */
  port: Schema.String,
});

/** A port of a box. */
export type Port = typeof Port.Type;

/** A schema of a box: a primitive of the theory placed on the canvas. */
export const Box = Schema.Struct({
  /** The name the box goes by in the design, which no other box of the design shares. */
  id: Schema.String,
  /** The name of the primitive the box is, as the palette lists it. */
  primitive: Schema.String,
  /** Where the top left corner of the box lies on the canvas. */
  position: Position,
  /** What the primitive takes besides its inputs, each as it is written, by the name of the parameter. */
  parameters: Schema.Record(Schema.String, Schema.String),
});

/** A box: a primitive of the theory placed on the canvas. */
export type Box = typeof Box.Type;

/** A schema of a wire: the composition of two boxes, from an output port of one to an input port of the other. */
export const Wire = Schema.Struct({
  /** The output port the wire leaves. */
  from: Port,
  /** The input port the wire enters. */
  to: Port,
});

/** A wire, from an output port to an input port. */
export type Wire = typeof Wire.Type;

/** A schema of the design file: the boxes of an application and the wires between them, which Lean is to elaborate later. No two boxes share an id, every wire joins boxes of the design, and no input port takes more than one wire, so that a design read from a file is one the editor could have made. */
export const Design = Schema.Struct({
  /** The boxes, in the order they were placed. */
  boxes: Schema.Array(Box),
  /** The wires, in the order they were drawn. */
  wires: Schema.Array(Wire),
}).pipe(
  Schema.check(
    Schema.makeFilter(
      (design) =>
        new Set(design.boxes.map((box) => box.id)).size === design.boxes.length || {
          path: ['boxes'],
          issue: 'Expected every box to have an id of its own, as a wire names its boxes by id',
        },
    ),
    Schema.makeFilter(
      (design) =>
        design.wires.every(
          (wire) =>
            design.boxes.some((box) => box.id === wire.from.box) &&
            design.boxes.some((box) => box.id === wire.to.box),
        ) || {
          path: ['wires'],
          issue: 'Expected every wire to join two boxes of the design',
        },
    ),
    Schema.makeFilter(
      (design) =>
        new Set(design.wires.map((wire) => JSON.stringify([wire.to.box, wire.to.port]))).size ===
          design.wires.length || {
          path: ['wires'],
          issue: 'Expected at most one wire into every input port, as an input takes one value',
        },
    ),
  ),
);

/** The design file: the boxes of an application and the wires between them. */
export type Design = typeof Design.Type;

/** A schema of the design file as the JSON text it is kept in, written indented by two spaces, a value to a line, so that a person reads it and a change to it shows line by line. */
export const DesignJson = Schema.fromJsonString(Design, { space: 2 });

/** The design a JSON text holds; or a failure with the reason when the text is not JSON or not a design. */
export const fromJson = Schema.decodeExit(DesignJson);

/** The JSON text of a design; or a failure with the reason when the design breaks what the schema checks. */
export const toJson = Schema.encodeExit(DesignJson);

/** The design with nothing on the canvas, which every new design starts as. */
export const empty: Design = { boxes: [], wires: [] };

/** The design with a box placed on the canvas after the others. The id of the box is one no box of the design has. */
export const add =
  (box: Box) =>
  (design: Design): Design => ({ boxes: [...design.boxes, box], wires: design.wires });

/** The design with the box of an id moved to a position. */
export const move =
  (id: string, position: Position) =>
  (design: Design): Design => ({
    boxes: design.boxes.map((box) => (box.id === id ? { ...box, position } : box)),
    wires: design.wires,
  });

/** The design without the box of an id and without every wire that left or entered it, as a wire joins two boxes of the design. */
export const remove =
  (id: string) =>
  (design: Design): Design => ({
    boxes: design.boxes.filter((box) => box.id !== id),
    wires: design.wires.filter((wire) => wire.from.box !== id && wire.to.box !== id),
  });

/** The design with a wire drawn, in place of any wire that entered the same input port, as an input takes one value. */
export const connect =
  (wire: Wire) =>
  (design: Design): Design => ({
    boxes: design.boxes,
    wires: [
      ...design.wires.filter(
        (drawn) => drawn.to.box !== wire.to.box || drawn.to.port !== wire.to.port,
      ),
      wire,
    ],
  });

/** The design without the wire that enters an input port, which names the wire, as no input port takes two. */
export const disconnect =
  (to: Port) =>
  (design: Design): Design => ({
    boxes: design.boxes,
    wires: design.wires.filter((wire) => wire.to.box !== to.box || wire.to.port !== to.port),
  });

/** The design with a parameter of the box of an id written anew. */
export const setParameter =
  (id: string, name: string, value: string) =>
  (design: Design): Design => ({
    boxes: design.boxes.map((box) =>
      box.id === id ? { ...box, parameters: { ...box.parameters, [name]: value } } : box,
    ),
    wires: design.wires,
  });
