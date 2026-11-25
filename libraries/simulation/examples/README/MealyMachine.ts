import * as MealyMachine from '@falkara/simulation/Coalgebra/MealyMachine';

const system = MealyMachine.make({
  structure: (board: Board) => (cell: string) => {
    const next = generation(HashSet.add(board, cell));
    return [HashSet.size(next), next];
  },
});

await Stream.make('1,1', '5,5').pipe(
  MealyMachine.behavior(system, HashSet.make('0,1', '2,1')),
  Stream.runCollect,
  Effect.runPromise,
);
// [3, 3]: 3 after the row of three cells turns into a column and 3 after the lone cell at `5,5` dies.

// The names that the page defines in the blocks before this one.
import { Effect, HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
