# Falkara Simulation

Falkara Simulation is an [Effect-based](https://effect.website/) TypeScript library for simulating state-based systems from streams to machines driven by input. Each system has a structure that takes a state one step further, and the library runs the system as a `Stream` of Effect.

Every system has the same form: a state space and a [structure](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra) that gives what follows from every state. Systems of the [Game of Life](https://doi.org/10.1038/scientificamerican1070-120) whose boards live forever, die out, or change by the moves of a player differ only in what their structures give. The rule of the game is written once, as a plain function from a board to its next generation, and each kind of system takes that one rule: as a stream of generations, as a game that ends once the board dies out, or as a machine that reads the moves of a player. We named that form once after the theory of [coalgebras](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra) and built every kind of system and every [behavior](https://doi.org/10.1017/CBO9781316823187) on that form rather than as a special case.

Types and behaviors follow a theory checked in [Lean](https://lean-lang.org/), so they say exactly what the theory says.

## Spotlight

The [Game of Life](https://doi.org/10.1038/scientificamerican1070-120) runs as a [stream coalgebra](https://doi.org/10.1017/CBO9781316823187). A board of living cells goes in, and a stream of every following generation comes out one at a time for as long as the stream is read.

```ts
import * as StreamCoalgebra from '@falkara/simulation/Coalgebra/StreamCoalgebra';
import { Array, Effect, HashMap, HashSet, Option, Stream } from 'effect';

// A board holds its living cells, each written as `column,row`.
type Board = HashSet.HashSet<string>;

// The offsets in column and row from a cell to its eight neighbors.
const neighborOffsets = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

// Gives the next generation of a board, in which a cell survives with two or three living neighbors and is born with three.
const generation = (board: Board): Board => {
  const neighborCounts = HashSet.reduce(board, HashMap.empty<string, number>(), (counts, cell) => {
    const [column = 0, row = 0] = cell.split(',').map(Number);
    return Array.reduce(neighborOffsets, counts, (current, [columnOffset, rowOffset]) =>
      HashMap.modifyAt(current, `${column + columnOffset},${row + rowOffset}`, (count) =>
        Option.some(Option.getOrElse(count, () => 0) + 1),
      ),
    );
  });
  return HashSet.fromIterable(
    HashMap.keys(
      HashMap.filter(
        neighborCounts,
        (count, cell) => count === 3 || (count === 2 && HashSet.has(board, cell)),
      ),
    ),
  );
};

// The stream coalgebra of the Game of Life, which gives from every board the board and its next generation.
const life = StreamCoalgebra.make({ structure: (board: Board) => [board, generation(board)] });

const blinker = HashSet.make('0,1', '1,1', '2,1');

Effect.runPromise(Stream.runCollect(Stream.take(StreamCoalgebra.behavior(life, blinker), 3)));
// [
//   HashSet('0,1', '1,1', '2,1'),   a row of three
//   HashSet('1,0', '1,1', '1,2'),   a column of three
//   HashSet('0,1', '1,1', '2,1'),   a row again
// ]
```

The stream never ends, so the code that reads the stream decides how far to go, here three generations.

Every example on this page runs as a test in [`examples`](examples), one file for each module, beside more examples, such as a glider that moves across the board. The rule of the Game of Life lives there in [`GameOfLife.ts`](examples/GameOfLife.ts).

## Behavior

Every kind of system says what its [structure](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra) gives, and each comes with its [behavior](https://doi.org/10.1017/CBO9781316823187) (Jacobs, Definition 2.3.1), which applies the structure from state to state and returns a `Stream` of Effect. A behavior also takes a system written in place and infers its states from the state it starts from, so the Game of Life above runs without `make` and without naming the board:

```ts
StreamCoalgebra.behavior({ structure: (board) => [board, generation(board)] }, blinker);
```

- A **[stream coalgebra](https://doi.org/10.1017/CBO9781316823187)** (Jacobs, Corollary 2.3.6.1) gives from every state an output and the next state. Its behavior never ends. The Game of Life above is one.
- A **[sequence coalgebra](https://doi.org/10.1017/CBO9781316823187)** (Jacobs, Section 2.2.1) gives from every state either nothing or an output and the next state. Its behavior ends where the coalgebra gives nothing. A board that dies out ends its game:

  ```ts
  import * as SequenceCoalgebra from '@falkara/simulation/Coalgebra/SequenceCoalgebra';
  import { HashSet, Option } from 'effect';

  const game = SequenceCoalgebra.make({
    structure: (board: Board) =>
      HashSet.isEmpty(board) ? Option.none() : Option.some([board, generation(board)]),
  });

  SequenceCoalgebra.behavior(game, HashSet.make('0,0', '1,0'));
  // The stream holds the board of two cells and ends, as both cells die.
  ```

- A **[Mealy machine](https://doi.org/10.1017/CBO9781316823187)** (Jacobs, Exercise 2.3.2) waits in every state for an input and then gives an output and the next state, so its output depends on the input as well. A player who brings one cell to life before every generation sees how many cells live after the generation:

  ```ts
  import * as MealyMachine from '@falkara/simulation/Coalgebra/MealyMachine';

  const play = MealyMachine.make({
    structure: (board: Board) => (cell: string) => {
      const next = generation(HashSet.add(board, cell));
      return [HashSet.size(next), next];
    },
  });

  Stream.make('1,1', '5,5').pipe(MealyMachine.behavior(play, HashSet.make('0,1', '2,1')));
  // The stream holds 3 after the row of three cells turns into a column and 3 after the lone cell at `5,5` dies.
  ```

- A **[deterministic automaton](https://doi.org/10.1017/CBO9781316823187)** (Jacobs, Section 2.2.3) gives from every state an output and the next state upon every input, so its output depends on the state alone. A deterministic automaton is also called a Moore machine. An automaton that counts the living cells of the board before every move first gives the count of the board as it was. Upon every move it brings the cell of the player to life and moves on to the next generation:

  ```ts
  import * as DeterministicAutomaton from '@falkara/simulation/Coalgebra/DeterministicAutomaton';

  const census = DeterministicAutomaton.make({
    structure: (board: Board) => [
      HashSet.size(board),
      (cell: string) => generation(HashSet.add(board, cell)),
    ],
  });

  Stream.make('1,1').pipe(DeterministicAutomaton.behavior(census, HashSet.make('0,1', '2,1')));
  // The stream holds 2 before the move and 3 after the move.
  ```

A Mealy machine and a deterministic automaton read their inputs from any `Stream` of Effect and carry its errors and requirements on to their outputs, so inputs may come from a socket, a timer, or a user. The stream of inputs pipes into the behavior, as above, or comes as its last argument, as `MealyMachine.behavior(play, board, moves)`.

## Coalgebra

A kind of system that the library does not name is a coalgebra all the same. A [coalgebra](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Endofunctor.Coalgebra) is a state space together with a coalgebra structure `structure` that takes every state to a value of an [endofunctor](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor), such as an `Option` of the next state or a pair of an output and the next state. A system that takes a board to its next generation until the board dies out is a coalgebra of `Option` that gives no output:

```ts
import * as Coalgebra from '@falkara/simulation/Coalgebra';
import { HashSet, Option } from 'effect';

const survival = Coalgebra.make<Option.OptionTypeLambda, Board>({
  structure: (board) => (HashSet.isEmpty(board) ? Option.none() : Option.some(generation(board))),
});
```

An endofunctor is a type lambda of Effect whose object is its `Target`, and the library fixes every other slot of the lambda at `never`, as an endofunctor maps a single type. A type lambda of Effect that keeps a further type in another slot, such as `Result.ResultTypeLambda`, which keeps the failure in `Out1`, therefore gives a coalgebra that never fails. An endofunctor with a failure takes the failure as a type parameter of its own type lambda instead, as `BinaryProductFunctor` takes its factor. A board that fails once it grows too crowded is a coalgebra of such an endofunctor:

```ts
import { type HKT, Result } from 'effect';

interface Failing<Failure> extends HKT.TypeLambda {
  readonly type: Result.Result<this['Target'], Failure>;
}

const crowding = Coalgebra.make<Failing<'Overcrowded'>, Board>({
  structure: (board) =>
    HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
});
```

Every kind above is a coalgebra of an endofunctor that the module `Functor` and its folder build: a pair with an output (`BinaryProductFunctor`), a function of an input (`Coyoneda`), a constant (`Functor.Const`), and two endofunctors one after the other (`Functor.Comp`). Each endofunctor comes with its [`Functor`](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor) instance, such as `BinaryProductFunctor.functor` and `Functor.comp`, and `Functor.axioms` gives the [axioms](https://leanprover-community.github.io/mathlib4_docs/find/#doc/CategoryTheory.Functor) of every instance as predicates to test an instance of a new endofunctor, as [`Functor.test.ts`](examples/Functor.test.ts) does for steps that count the cells they bring to life. The `map` of an instance changes what a value of the endofunctor holds and keeps the form of the value, so a pair stays a pair.

## Theory

The library is written from a theory in Lean. Each type, each constructor, and each contract of a [behavior](https://doi.org/10.1017/CBO9781316823187) is generated from a definition of the theory, and the functions that the library writes by hand have to match their contracts or the library fails to compile.

The definitions build on the Lean library [Mathlib](https://leanprover-community.github.io/mathlib4_docs/) and take the names that Jacobs gives them in [Introduction to Coalgebra](https://doi.org/10.1017/CBO9781316823187) (2017): coalgebra, stream coalgebra, sequence coalgebra, Mealy machine, deterministic automaton, and behavior. Each comment in the code cites the definition that its terms come from.

## License

Falkara Simulation is licensed under [MIT](LICENSE).
