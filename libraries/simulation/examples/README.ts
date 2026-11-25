// The code of README.md, its blocks one after another, which `vp check` type-checks and README.test.ts keeps the same as the page.

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

await StreamCoalgebra.behavior(life, blinker).pipe(
  Stream.take(3),
  Stream.runCollect,
  Effect.runPromise,
);
// [
//   HashSet('0,1', '1,1', '2,1'),   a row of three
//   HashSet('1,0', '1,1', '1,2'),   a column of three
//   HashSet('0,1', '1,1', '2,1'),   a row again
// ]

await StreamCoalgebra.behavior({ structure: (board) => [board, generation(board)] }, blinker).pipe(
  Stream.take(3),
  Stream.runCollect,
  Effect.runPromise,
);
// The same three generations.

import * as SequenceCoalgebra from '@falkara/simulation/Coalgebra/SequenceCoalgebra';

const game = SequenceCoalgebra.make({
  structure: (board: Board) =>
    HashSet.isEmpty(board) ? Option.none() : Option.some([board, generation(board)]),
});

await SequenceCoalgebra.behavior(game, HashSet.make('0,0', '1,0')).pipe(
  Stream.runCollect,
  Effect.runPromise,
);
// [HashSet('0,0', '1,0')]: the board of two cells, and then the end, as both cells die.

import * as MealyMachine from '@falkara/simulation/Coalgebra/MealyMachine';

const play = MealyMachine.make({
  structure: (board: Board) => (cell: string) => {
    const next = generation(HashSet.add(board, cell));
    return [HashSet.size(next), next];
  },
});

await Stream.make('1,1', '5,5').pipe(
  MealyMachine.behavior(play, HashSet.make('0,1', '2,1')),
  Stream.runCollect,
  Effect.runPromise,
);
// [3, 3]: 3 after the row of three cells turns into a column and 3 after the lone cell at `5,5` dies.

import * as DeterministicAutomaton from '@falkara/simulation/Coalgebra/DeterministicAutomaton';

const census = DeterministicAutomaton.make({
  structure: (board: Board) => [
    HashSet.size(board),
    (cell: string) => generation(HashSet.add(board, cell)),
  ],
});

await Stream.make('1,1').pipe(
  DeterministicAutomaton.behavior(census, HashSet.make('0,1', '2,1')),
  Stream.runCollect,
  Effect.runPromise,
);
// [2, 3]: 2 before the move and 3 after it.

import * as Coalgebra from '@falkara/simulation/Coalgebra';

const survival = Coalgebra.make<Option.OptionTypeLambda, Board>({
  structure: (board) => (HashSet.isEmpty(board) ? Option.none() : Option.some(generation(board))),
});

survival.structure(blinker);
// Option.some(HashSet('1,0', '1,1', '1,2')), the column of three that follows the row.

import { type HKT, Result } from 'effect';

interface Failing<Failure> extends HKT.TypeLambda {
  readonly type: Result.Result<this['Target'], Failure>;
}

const crowding = Coalgebra.make<Failing<'Overcrowded'>, Board>({
  structure: (board) =>
    HashSet.size(board) > 100 ? Result.fail('Overcrowded') : Result.succeed(generation(board)),
});

crowding.structure(blinker);
// Result.succeed(HashSet('1,0', '1,1', '1,2')), as three cells are far from a crowd.
