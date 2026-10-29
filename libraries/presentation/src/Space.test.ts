import { describe, expect, it } from '@effect/vitest';
import { Exit, Option, SchemaIssue } from 'effect';

import * as Fraction from '#src/Fraction';
import * as Space from '#src/Space';

describe('spacingUnit', () => {
  it('is the spacing unit of the USWDS spacing scale', () => {
    expect(Space.spacingUnit).toBe(8);
  });
});

describe('spacingUnitCounts', () => {
  it('are the counts the USWDS spacing scale spaces content with', () => {
    expect(Space.spacingUnitCounts.map(Fraction.format)).toEqual([
      '1/2',
      '1',
      '3/2',
      '2',
      '5/2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '15',
    ]);
  });
});

describe('spacingUnitFactor', () => {
  it('is 1/2', () => {
    expect(Space.spacingUnitFactor).toEqual({ numerator: 1n, denominator: 2n });
  });
});

describe('scale', () => {
  it('runs from a quarter to seven and a half times body text', () => {
    const exit = Space.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => Fraction.format(step.factor))).toEqual([
      '1/4',
      '1/2',
      '3/4',
      '1',
      '5/4',
      '3/2',
      '2',
      '5/2',
      '3',
      '7/2',
      '4',
      '9/2',
      '5',
      '15/2',
    ]);
  });

  it('takes the USWDS sizes at the minimum viewport width', () => {
    const exit = Space.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps.map((step) => Fraction.toNumber(step.minimumSize))).toEqual([
      4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 120,
    ]);
  });

  it('grows every step exactly as body text grows', () => {
    const exit = Space.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 20n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).not.toHaveLength(0);
    for (const step of steps) {
      expect(Fraction.divide(step.maximumSize, step.minimumSize)).toEqual(Fraction.make(20n, 16n));
    }
  });

  it('keeps every step on every screen when body text keeps the default font size', () => {
    const exit = Space.scale({
      minimumFactor: { numerator: 6n, denominator: 5n },
      maximumFactor: { numerator: 5n, denominator: 4n },
      maximumBodyFontSize: { numerator: 16n, denominator: 1n },
    });
    const steps = Exit.isSuccess(exit) ? exit.value : [];

    expect(steps).toHaveLength(14);
    for (const step of steps) {
      expect(step.maximumSize).toEqual(step.minimumSize);
    }
  });

  it('reports every invalid option at once', () => {
    const exit = Space.scale({
      minimumFactor: { numerator: 1n, denominator: 1n },
      maximumFactor: { numerator: 1n, denominator: 2n },
      maximumBodyFontSize: { numerator: 40n, denominator: 1n },
    });

    expect(
      SchemaIssue.makeFormatterStandardSchemaV1()(
        Option.getOrThrow(Exit.findErrorOption(exit)).issue,
      ).issues,
    ).toEqual([
      {
        path: ['minimumFactor'],
        message:
          'Expected a minimum factor greater than 1, so that every step is larger than the one below',
      },
      {
        path: ['maximumFactor'],
        message:
          'Expected a maximum factor greater than 1, so that every step is larger than the one below',
      },
      {
        path: ['maximumBodyFontSize'],
        message:
          'Expected a body font size of at most 25.6 px, so that text can be enlarged to 200 % within the 300 % page zoom of Safari, as WCAG 2.2 Resize Text requires',
      },
    ]);
  });
});
