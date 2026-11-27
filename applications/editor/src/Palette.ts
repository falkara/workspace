import { Array, type Option, Schema } from 'effect';

/** A schema of a primitive of the theory as the editor offers it: what it is called, what it does, and what a box of it takes and gives. */
export const Primitive = Schema.Struct({
  /** The name of the primitive in the theory, which a box of the design file names it by. */
  name: Schema.String,
  /** What the palette and a box call the primitive. */
  title: Schema.String,
  /** What the primitive makes, in a sentence. */
  description: Schema.String,
  /** The names of the input ports, from the top, each of which takes one wire. */
  inputs: Schema.Array(Schema.String),
  /** The names of the output ports, from the top. */
  outputs: Schema.Array(Schema.String),
  /** The names of what the primitive takes besides its inputs, written by hand in the inspector. */
  parameters: Schema.Array(Schema.String),
});

/** A primitive of the theory as the editor offers it. */
export type Primitive = typeof Primitive.Type;

/**
 * The primitives the palette offers, in its order: the Mealy machines of Simulation and their compositions, as `theory/Falkara/Simulation` states them and `@falkara/simulation` exports them.
 *
 * Written by hand for now. This list is the place the theory is to generate: every primitive here is a declaration of the theory, its inputs and parameters the arguments of the declaration, and nothing else in the editor names a primitive.
 */
export const primitives: ReadonlyArray<Primitive> = [
  {
    name: 'MealyMachine.make',
    title: 'Mealy machine',
    description:
      'The machine of a function that gives from every state upon every input an output and the next state.',
    inputs: [],
    outputs: ['machine'],
    parameters: ['structure'],
  },
  {
    name: 'MealyMachine.mapInput',
    title: 'Map input',
    description: 'The machine that maps every input by a function before a machine takes it.',
    inputs: ['machine'],
    outputs: ['machine'],
    parameters: ['f'],
  },
  {
    name: 'MealyMachine.mapOutput',
    title: 'Map output',
    description: 'The machine that maps every output of a machine by a function.',
    inputs: ['machine'],
    outputs: ['machine'],
    parameters: ['f'],
  },
  {
    name: 'MealyMachine.series',
    title: 'Series',
    description: 'The machine that feeds every output of a machine into another as its input.',
    inputs: ['first', 'second'],
    outputs: ['machine'],
    parameters: [],
  },
  {
    name: 'MealyMachine.parallel',
    title: 'Parallel',
    description:
      'The machine that runs two machines side by side, each upon its part of every input.',
    inputs: ['first', 'second'],
    outputs: ['machine'],
    parameters: [],
  },
];

/** The primitive of a name, if the palette offers it. */
export const find = (name: string): Option.Option<Primitive> =>
  Array.findFirst(primitives, (primitive) => primitive.name === name);
