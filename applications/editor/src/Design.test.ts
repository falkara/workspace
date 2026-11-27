import { describe, expect, it } from '@effect/vitest';
import { Exit } from 'effect';

import * as Design from '#src/Design';

/** A design of two boxes with a wire from the first into the second. */
const wired: Design.Design = {
  boxes: [
    {
      id: 'box-1',
      primitive: 'MealyMachine.make',
      position: { x: 32, y: 32 },
      parameters: { structure: 'counter' },
    },
    {
      id: 'box-2',
      primitive: 'MealyMachine.mapOutput',
      position: { x: 320, y: 64 },
      parameters: {},
    },
  ],
  wires: [{ from: { box: 'box-1', port: 'machine' }, to: { box: 'box-2', port: 'machine' } }],
};

describe('fromJson', () => {
  it('reads the design that toJson wrote', () => {
    const json = Design.toJson(wired);

    expect(
      Exit.match(json, { onFailure: Exit.failCause, onSuccess: Design.fromJson }),
    ).toStrictEqual(Exit.succeed(wired));
  });

  it('reads a design written by hand', () => {
    const design = Design.fromJson(
      '{"boxes":[{"id":"a","primitive":"MealyMachine.make","position":{"x":0,"y":0},"parameters":{}}],"wires":[]}',
    );

    expect(design).toStrictEqual(
      Exit.succeed({
        boxes: [
          { id: 'a', primitive: 'MealyMachine.make', position: { x: 0, y: 0 }, parameters: {} },
        ],
        wires: [],
      }),
    );
  });

  it('refuses a text that is not JSON', () => {
    expect(Exit.isFailure(Design.fromJson('{"boxes":'))).toBe(true);
  });

  it('refuses a box without a position', () => {
    expect(
      Exit.isFailure(
        Design.fromJson('{"boxes":[{"id":"a","primitive":"p","parameters":{}}],"wires":[]}'),
      ),
    ).toBe(true);
  });

  it('refuses two boxes of one id', () => {
    const design = Design.toJson({ boxes: [...wired.boxes, ...wired.boxes], wires: [] });

    expect(Exit.isFailure(design)).toBe(true);
  });

  it('refuses a wire to a box the design does not have', () => {
    const design = Design.toJson({
      boxes: wired.boxes,
      wires: [{ from: { box: 'box-1', port: 'machine' }, to: { box: 'box-3', port: 'machine' } }],
    });

    expect(Exit.isFailure(design)).toBe(true);
  });

  it('refuses two wires into one input port', () => {
    const design = Design.toJson({ boxes: wired.boxes, wires: [...wired.wires, ...wired.wires] });

    expect(Exit.isFailure(design)).toBe(true);
  });
});

describe('add', () => {
  it('places a box after the others', () => {
    const box = {
      id: 'box-3',
      primitive: 'MealyMachine.series',
      position: { x: 0, y: 0 },
      parameters: {},
    };

    expect(Design.add(box)(wired).boxes).toStrictEqual([...wired.boxes, box]);
  });
});

describe('move', () => {
  it('moves the box of the id and no other', () => {
    const moved = Design.move('box-2', { x: 8, y: 16 })(wired);

    expect(moved.boxes.map((box) => box.position)).toStrictEqual([
      { x: 32, y: 32 },
      { x: 8, y: 16 },
    ]);
  });
});

describe('remove', () => {
  it('removes the box with every wire that left or entered it', () => {
    expect(Design.remove('box-1')(wired)).toStrictEqual({
      boxes: wired.boxes.slice(1),
      wires: [],
    });
  });
});

describe('connect', () => {
  it('draws a wire in place of the one that entered the same input port', () => {
    const wire = { from: { box: 'box-1', port: 'other' }, to: { box: 'box-2', port: 'machine' } };

    expect(Design.connect(wire)(wired).wires).toStrictEqual([wire]);
  });

  it('keeps the wires into other input ports', () => {
    const wire = { from: { box: 'box-1', port: 'machine' }, to: { box: 'box-2', port: 'second' } };

    expect(Design.connect(wire)(wired).wires).toStrictEqual([...wired.wires, wire]);
  });
});

describe('disconnect', () => {
  it('removes the wire that enters the input port', () => {
    expect(Design.disconnect({ box: 'box-2', port: 'machine' })(wired).wires).toStrictEqual([]);
  });
});

describe('setParameter', () => {
  it('writes the parameter of the box of the id and keeps the others', () => {
    const written = Design.setParameter('box-1', 'structure', 'toggle')(wired);

    expect(written.boxes.map((box) => box.parameters)).toStrictEqual([{ structure: 'toggle' }, {}]);
  });
});
