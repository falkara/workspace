import { Random } from 'effect';

const system = StreamCoalgebra.makeEffect({
  structure: (board: Board) =>
    Effect.map(Random.nextIntBetween(0, 2), (column) => ({
      output: HashSet.size(board),
      next: generation(HashSet.add(board, `${column},0`)),
    })),
});

await StreamCoalgebra.behaviorEffect(system, blinker).pipe(
  Stream.take(3),
  Stream.runCollect,
  Random.withSeed('glider'),
  Effect.runPromise,
);
// [3, 7, 6]: the sizes of the first three boards, the same on every run with the seed.

// The names that the page defines in the blocks before this one.
import { StreamCoalgebra } from '@falkara/simulation';
import { Effect, HashSet, Stream } from 'effect';
type Board = HashSet.HashSet<string>;
declare const generation: (board: Board) => Board;
declare const blinker: Board;
