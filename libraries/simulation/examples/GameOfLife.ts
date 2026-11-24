import { Array, HashMap, HashSet, Option } from 'effect';

/** A board of the Game of Life, which holds its living cells, each written as `column,row`. */
export type Board = HashSet.HashSet<string>;

/** The offsets in column and row from a cell to its eight neighbors. */
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

/** Gives the next generation of a board, in which a cell survives with two or three living neighbors and is born with three. */
export const generation = (board: Board): Board => {
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
