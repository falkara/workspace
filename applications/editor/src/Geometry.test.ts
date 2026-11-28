import { describe, expect, it } from '@effect/vitest';
import * as Space from '@falkara/presentation/Space';
import * as Typography from '@falkara/presentation/Typography';
import { Array, Exit, Option, Rational } from 'effect';

import * as Geometry from '#src/Geometry';

describe('gridStep', () => {
  it('is the step of the space scale whose factor of body text is one, at the body text of the editor', () => {
    const step = Exit.map(
      Space.scale({ maximumBodyFontSize: Typography.defaultFontSize }),
      (steps) =>
        Option.map(
          Array.findFirst(steps, (step) => Rational.equals(step.factor, Rational.fromBigInt(1n))),
          (step) => [step.minimumSize, step.maximumSize],
        ),
    );

    expect(step).toStrictEqual(
      Exit.succeed(
        Option.some([
          Rational.fromNumberUnsafe(Geometry.gridStep),
          Rational.fromNumberUnsafe(Geometry.gridStep),
        ]),
      ),
    );
  });

  it('measures every length of a box and of placing one in whole steps', () => {
    expect(
      [
        Geometry.boxWidth,
        Geometry.headerHeight,
        Geometry.portHeight,
        Geometry.firstBoxOffset,
        Geometry.nextBoxOffset,
      ].map((length) => length % Geometry.gridStep),
    ).toStrictEqual([0, 0, 0, 0, 0]);
  });

  it('is twice the closest spacing of the dots, so that every dot drawn lies on the grid', () => {
    expect(Geometry.gridStep / Geometry.minimumDotSpacing).toBe(2);
  });

  it('puts both ends of every wire on lines of the grid for a box on the grid', () => {
    const position = { x: Geometry.gridStep * 3, y: Geometry.gridStep * 5 };

    expect(
      [0, 1, 2].flatMap((index) => {
        const input = Geometry.inputAnchor(position, index);
        const output = Geometry.outputAnchor(position, index);
        return [input.x, input.y, output.x, output.y].map((length) => length % Geometry.gridStep);
      }),
    ).toStrictEqual(Array.makeBy(12, () => 0));
  });
});

describe('snap', () => {
  it('brings a position to the nearest place on the grid', () => {
    expect(Geometry.snap({ x: Geometry.gridStep * 2.4, y: Geometry.gridStep * 2.6 })).toStrictEqual(
      { x: Geometry.gridStep * 2, y: Geometry.gridStep * 3 },
    );
  });

  it('keeps a position that lies on the grid', () => {
    expect(Geometry.snap({ x: Geometry.gridStep, y: 0 })).toStrictEqual({
      x: Geometry.gridStep,
      y: 0,
    });
  });

  it('brings a position left of or above the origin to the grid too, as the canvas has no edge', () => {
    expect(
      Geometry.snap({ x: Geometry.gridStep * -40.4, y: Geometry.gridStep * -0.2 }),
    ).toStrictEqual({ x: Geometry.gridStep * -40, y: 0 });
    expect(Object.is(Geometry.snap({ x: -1, y: -1 }).x, 0)).toBe(true);
  });
});

describe('zoomLevels', () => {
  it('rise from the smallest zoom to the largest, through the size of the canvas itself', () => {
    expect(Geometry.zoomLevels[0]).toBe(Geometry.minimumZoom);
    expect(Geometry.zoomLevels.at(-1)).toBe(Geometry.maximumZoom);
    expect(Geometry.zoomLevels).toContain(1);
    expect(
      Geometry.zoomLevels.every(
        (level, index) => index === 0 || level > (Geometry.zoomLevels[index - 1] ?? 0),
      ),
    ).toBe(true);
  });
});

describe('inputAnchor', () => {
  it('lies in the middle of the row of the port on the left edge of the box', () => {
    expect(Geometry.inputAnchor({ x: 100, y: 200 }, 1)).toStrictEqual({
      x: 100,
      y: 200 + Geometry.headerHeight + 1.5 * Geometry.portHeight,
    });
  });
});

describe('outputAnchor', () => {
  it('lies in the middle of the row of the port on the right edge of the box', () => {
    expect(Geometry.outputAnchor({ x: 100, y: 200 }, 0)).toStrictEqual({
      x: 100 + Geometry.boxWidth,
      y: 200 + Geometry.headerHeight + 0.5 * Geometry.portHeight,
    });
  });
});

describe('isOverInput', () => {
  it('holds over the row of the port, from the outer edge of its handle to the middle of the box', () => {
    const row = 200 + Geometry.headerHeight + Geometry.portHeight;

    expect(
      Geometry.isOverInput({ x: 100 - Geometry.handleSize / 2, y: row }, { x: 100, y: 200 }, 1),
    ).toBe(true);
    expect(
      Geometry.isOverInput(
        { x: 100 + Geometry.boxWidth / 2, y: row + Geometry.portHeight - 1 },
        { x: 100, y: 200 },
        1,
      ),
    ).toBe(true);
  });

  it('holds over neither the row above nor the row below, nor the side of the output ports', () => {
    const row = 200 + Geometry.headerHeight + Geometry.portHeight;

    expect(Geometry.isOverInput({ x: 120, y: row - 1 }, { x: 100, y: 200 }, 1)).toBe(false);
    expect(
      Geometry.isOverInput({ x: 120, y: row + Geometry.portHeight }, { x: 100, y: 200 }, 1),
    ).toBe(false);
    expect(
      Geometry.isOverInput({ x: 101 + Geometry.boxWidth / 2, y: row }, { x: 100, y: 200 }, 1),
    ).toBe(false);
  });
});

describe('wirePath', () => {
  it('leaves to the right and enters from the left, bent by half the distance', () => {
    expect(Geometry.wirePath({ x: 0, y: 0 }, { x: 200, y: 100 })).toBe(
      'M 0 0 C 100 0, 100 100, 200 100',
    );
  });

  it('stays a curve between anchors one above the other', () => {
    expect(Geometry.wirePath({ x: 0, y: 0 }, { x: 0, y: 100 })).toBe(
      `M 0 0 C ${Geometry.portHeight} 0, ${-Geometry.portHeight} 100, 0 100`,
    );
  });
});
