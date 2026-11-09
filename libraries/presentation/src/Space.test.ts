import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, Rational, SchemaIssue } from 'effect';

import * as Space from '#src/Space';

describe('spacingUnit', () => {
  it('is 8 CSS pixels, the spacing unit of the USWDS 3 spacing scale', () => {
    expect(Space.spacingUnit).toEqual(Rational.fromBigInt(8n));
  });
});

describe('spacingUnitCounts', () => {
  it('are 1/2 to 3 by halves, 4 to 10 and 15, the counts of the small and medium tokens of the USWDS 3 spacing scale', () => {
    expect(Space.spacingUnitCounts).toEqual([
      Rational.makeUnsafe(1n, 2n),
      Rational.fromBigInt(1n),
      Rational.makeUnsafe(3n, 2n),
      Rational.fromBigInt(2n),
      Rational.makeUnsafe(5n, 2n),
      Rational.fromBigInt(3n),
      Rational.fromBigInt(4n),
      Rational.fromBigInt(5n),
      Rational.fromBigInt(6n),
      Rational.fromBigInt(7n),
      Rational.fromBigInt(8n),
      Rational.fromBigInt(9n),
      Rational.fromBigInt(10n),
      Rational.fromBigInt(15n),
    ]);
  });
});

describe('spacingUnitFactor', () => {
  it('is positive', () => {
    expect(Rational.isPositive(Space.spacingUnitFactor)).toBe(true);
  });

  it('is 1/2', () => {
    expect(Space.spacingUnitFactor).toEqual(Rational.makeUnsafe(1n, 2n));
  });
});

describe('scale', () => {
  it('runs from a quarter to seven and a half times body text', () => {
    const exit = Space.scale({ maximumBodyFontSize: Rational.fromBigInt(20n) });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => step.factor)).toEqual([
      Rational.makeUnsafe(1n, 4n),
      Rational.makeUnsafe(1n, 2n),
      Rational.makeUnsafe(3n, 4n),
      Rational.fromBigInt(1n),
      Rational.makeUnsafe(5n, 4n),
      Rational.makeUnsafe(3n, 2n),
      Rational.fromBigInt(2n),
      Rational.makeUnsafe(5n, 2n),
      Rational.fromBigInt(3n),
      Rational.makeUnsafe(7n, 2n),
      Rational.fromBigInt(4n),
      Rational.makeUnsafe(9n, 2n),
      Rational.fromBigInt(5n),
      Rational.makeUnsafe(15n, 2n),
    ]);
  });

  it('takes the USWDS 3 sizes at the minimum viewport width', () => {
    const exit = Space.scale({ maximumBodyFontSize: Rational.fromBigInt(20n) });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => Rational.toNumberUnsafe(step.minimumSize))).toEqual([
      4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 120,
    ]);
  });

  it('grows every step exactly as body text grows', () => {
    const exit = Space.scale({ maximumBodyFontSize: Rational.fromBigInt(20n) });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      expect(Rational.divideUnsafe(step.maximumSize, step.minimumSize)).toEqual(
        Rational.makeUnsafe(20n, 16n),
      );
    }
  });

  it('keeps every step on every screen when body text keeps the default font size', () => {
    const exit = Space.scale({ maximumBodyFontSize: Rational.fromBigInt(16n) });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).toHaveLength(14);
    for (const step of steps) {
      expect(step.maximumSize).toEqual(step.minimumSize);
    }
  });

  it('takes the options of a type scale as they are, refused by none of its ratios', () => {
    const intent = {
      minimumFactor: Rational.fromBigInt(1n),
      maximumFactor: Rational.makeUnsafe(1n, 2n),
      maximumBodyFontSize: Rational.fromBigInt(20n),
    };
    const exit = Space.scale(intent);

    expect(Exit.isSuccess(exit)).toBe(true);
  });

  it('rejects a body font size the type scale would reject, with the same reason', () => {
    const exit = Space.scale({ maximumBodyFontSize: Rational.fromBigInt(40n) });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest maximum among the Baseline core browsers',
      },
    ]);
  });
});
