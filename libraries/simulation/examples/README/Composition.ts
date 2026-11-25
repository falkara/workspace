import { pipe } from 'effect';

const player = MealyMachine.make({
  structure: (board: Board) => (cell: string) => {
    const next = generation(HashSet.add(board, cell));
    return { output: HashSet.size(next), next };
  },
});

const peak = MealyMachine.make({
  structure: (highest: number) => (count: number) => ({
    output: Math.max(highest, count),
    next: Math.max(highest, count),
  }),
});

const record = pipe(
  player,
  MealyMachine.series(peak),
  MealyMachine.mapOutput((highest) => `at most ${highest} cells`),
);

await Stream.make('1,1', '5,5').pipe(
  MealyMachine.steps(record, [HashSet.make('0,1', '2,1'), 0]),
  Stream.runCollect,
  Effect.runPromise,
);
// [
//   { output: 'at most 3 cells', next: [HashSet('1,0', '1,1', '1,2'), 3] },
//   { output: 'at most 3 cells', next: [HashSet('0,1', '1,1', '2,1'), 3] },
// ]

// The names that the page defines in the blocks before this one.
import { MealyMachine } from '@falkara/simulation';
import { Effect, HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
