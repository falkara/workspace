import { describe, expect, it } from '@effect/vitest';
import { Option } from 'effect';

import * as Palette from '#src/Palette';

describe('primitives', () => {
  it('names every primitive once, as a box names its primitive by name', () => {
    const names = Palette.primitives.map((primitive) => primitive.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it('names every port of a side once, as a wire names its ports by name', () => {
    Palette.primitives.forEach((primitive) => {
      expect(new Set(primitive.inputs).size).toBe(primitive.inputs.length);
      expect(new Set(primitive.outputs).size).toBe(primitive.outputs.length);
    });
  });
});

describe('find', () => {
  it('finds a primitive the palette offers by its name', () => {
    expect(
      Option.map(Palette.find('MealyMachine.series'), (primitive) => primitive.inputs),
    ).toStrictEqual(Option.some(['first', 'second']));
  });

  it('finds nothing for a name the palette does not offer', () => {
    expect(Palette.find('MealyMachine.unknown')).toStrictEqual(Option.none());
  });
});
