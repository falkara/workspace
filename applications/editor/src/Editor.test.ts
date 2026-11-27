import { Clipboard } from '@effect/platform-browser';
import { HtmlCommand } from '@effect/ui/html';
import { HtmlLocator, HtmlScene } from '@effect/ui/html/testing';
import { Locator, Story } from '@effect/ui/testing';
import { describe, expect, it } from '@effect/vitest';
import { Effect, Layer, Option } from 'effect';

import { CopyDesign, Editor } from '#src/Editor';
import { EditorMessage, aimedOf, pointerOf, sourceOf } from '#src/EditorDefinition';
import * as Geometry from '#src/Geometry';

/** The status of the canvas, which counts the boxes and the wires or says what wire is being drawn; the inspector has a status of its own, for the copy of the design file. */
const canvasStatus = Locator.inside(
  HtmlLocator.role('region', { name: 'Canvas' }),
  Locator.attr('role', 'status'),
);

/** The box of the canvas as a measurement gives it, with its top left corner at a place in the viewport. */
const canvasAt = (x: number, y: number) => ({
  x,
  y,
  width: Geometry.canvasWidth,
  height: Geometry.canvasHeight,
  top: y,
  left: x,
  right: x + Geometry.canvasWidth,
  bottom: y + Geometry.canvasHeight,
});

describe('update', () => {
  it.effect(
    'places a box of the chosen primitive, numbered, set off from the last, and selected',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});

        story
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.series' }));

        expect(story.model.design.boxes).toStrictEqual([
          {
            id: 'box-1',
            primitive: 'MealyMachine.make',
            position: { x: Geometry.firstBoxOffset, y: Geometry.firstBoxOffset },
            parameters: { structure: '' },
          },
          {
            id: 'box-2',
            primitive: 'MealyMachine.series',
            position: {
              x: Geometry.firstBoxOffset + Geometry.nextBoxOffset,
              y: Geometry.firstBoxOffset + Geometry.nextBoxOffset,
            },
            parameters: {},
          },
        ]);
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-2' });
      }),
  );

  it.effect('places nothing for a primitive the palette does not offer', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.unknown' }))
        .send(
          EditorMessage.DroppedPrimitive({ primitive: 'MealyMachine.unknown', x: 300, y: 200 }),
        );

      expect(story.model.design.boxes).toStrictEqual([]);
    }),
  );

  it.effect(
    'places a dropped primitive with the middle of its header at the nearest place on the grid to the pointer, at every zoom',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});

        story.send(
          EditorMessage.DroppedPrimitive({ primitive: 'MealyMachine.series', x: 300, y: 196 }),
        );
        expect(story.model.design.boxes[0]).toStrictEqual({
          id: 'box-1',
          primitive: 'MealyMachine.series',
          position: Geometry.snap({
            x: 300 - Geometry.boxWidth / 2,
            y: 196 - Geometry.headerHeight / 2,
          }),
          parameters: {},
        });
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });

        // At twice the size, with the point of the canvas at 50, 50 in the corner of the panel.
        story
          .send(EditorMessage.PressedCanvas({ pointer: 1, x: 100, y: 100 }))
          .send(EditorMessage.PressedCanvas({ pointer: 2, x: 200, y: 100 }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(0, 0)))
          .send(EditorMessage.MovedCanvas({ pointer: 2, x: 300, y: 100 }))
          .send(EditorMessage.ReleasedCanvas({ pointer: 1 }))
          .send(EditorMessage.ReleasedCanvas({ pointer: 2 }))
          .send(EditorMessage.DroppedPrimitive({ primitive: 'MealyMachine.make', x: 600, y: 400 }));
        expect(story.model.design.boxes[1]?.position).toStrictEqual(
          Geometry.snap({
            x: 50 + 600 / 2 - Geometry.boxWidth / 2,
            y: 50 + 400 / 2 - Geometry.headerHeight / 2,
          }),
        );
      }),
  );

  it.effect('never gives the id of a deleted box to a new one', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedDelete())
        .resolve(HtmlCommand.Focus, { found: true })
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      expect(story.model.design.boxes.map((box) => box.id)).toStrictEqual(['box-2']);
    }),
  );

  it.effect(
    'selects a box by a click and by focus, and deselects it by a click on the canvas',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.series' }));

        story.send(EditorMessage.ClickedBox({ id: 'box-1' }));
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });

        story.send(EditorMessage.FocusedBox({ id: 'box-2' }));
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-2' });

        story.send(EditorMessage.ClickedCanvas());
        expect(story.model.selected).toBe(null);
      }),
  );

  it.effect(
    'moves a box by a step of the grid for an arrow key, and keeps it within the canvas',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

        story
          .send(EditorMessage.PressedBoxArrow({ id: 'box-1', key: 'ArrowRight' }))
          .send(EditorMessage.PressedBoxArrow({ id: 'box-1', key: 'ArrowDown' }));
        expect(story.model.design.boxes[0]?.position).toStrictEqual({
          x: Geometry.firstBoxOffset + Geometry.gridStep,
          y: Geometry.firstBoxOffset + Geometry.gridStep,
        });

        Array.from({ length: 8 }).forEach(() => {
          story
            .send(EditorMessage.PressedBoxArrow({ id: 'box-1', key: 'ArrowLeft' }))
            .send(EditorMessage.PressedBoxArrow({ id: 'box-1', key: 'ArrowUp' }));
        });
        expect(story.model.design.boxes[0]?.position).toStrictEqual({ x: 0, y: 0 });
      }),
  );

  it.effect(
    'drags a box as far as the pointer goes from where it pressed the header, to the nearest place on the grid',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

        story
          .send(EditorMessage.PressedHeader({ id: 'box-1', x: 500, y: 300 }))
          .send(
            EditorMessage.MovedPointer({
              x: 500 + Geometry.gridStep * 2.4,
              y: 300 - Geometry.gridStep * 0.6,
            }),
          )
          .send(EditorMessage.ReleasedPointer());

        expect(story.model.design.boxes[0]?.position).toStrictEqual({
          x: Geometry.firstBoxOffset + Geometry.gridStep * 2,
          y: Geometry.firstBoxOffset - Geometry.gridStep,
        });
        expect(story.model.dragging).toBe(null);
      }),
  );

  it.effect('puts a box back where it lay when the browser takes the drag over', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.PressedHeader({ id: 'box-1', x: 500, y: 300 }))
        .send(EditorMessage.MovedPointer({ x: 540, y: 290 }))
        .send(EditorMessage.CancelledPointer());

      expect(story.model.design.boxes[0]?.position).toStrictEqual({
        x: Geometry.firstBoxOffset,
        y: Geometry.firstBoxOffset,
      });
    }),
  );

  it.effect('ignores a pointer that moves while no box is dragged', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story.send(EditorMessage.MovedPointer({ x: 540, y: 290 }));

      expect(story.model.design.boxes[0]?.position).toStrictEqual({
        x: Geometry.firstBoxOffset,
        y: Geometry.firstBoxOffset,
      });
    }),
  );

  it.effect(
    'pans the view as far as the pointer goes from where it pressed the canvas, and keeps the selection through the click that ends the pan',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

        story
          .send(EditorMessage.PressedCanvas({ pointer: 1, x: 100, y: 100 }))
          .send(EditorMessage.MovedCanvas({ pointer: 1, x: 160, y: 140 }))
          .send(EditorMessage.ReleasedCanvas({ pointer: 1 }));
        expect(story.model.view).toStrictEqual({ x: 60, y: 40, zoom: 1 });
        expect(story.model.panning).toBe(null);

        story.send(EditorMessage.ClickedCanvas());
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });

        story.send(EditorMessage.ClickedCanvas());
        expect(story.model.selected).toBe(null);
      }),
  );

  it.effect('ignores a pointer that moves the canvas while no press on it lasts', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      story
        .send(EditorMessage.MovedCanvas({ pointer: 1, x: 160, y: 140 }))
        .send(EditorMessage.PressedCanvas({ pointer: 1, x: 100, y: 100 }))
        .send(EditorMessage.MovedCanvas({ pointer: 2, x: 160, y: 140 }));

      expect(story.model.view).toStrictEqual({ x: 0, y: 0, zoom: 1 });
    }),
  );

  it.effect('pans the view by a step for an arrow key, as a page scrolls', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      story
        .send(EditorMessage.PressedCanvasArrow({ key: 'ArrowRight' }))
        .send(EditorMessage.PressedCanvasArrow({ key: 'ArrowDown' }))
        .send(EditorMessage.PressedCanvasArrow({ key: 'ArrowDown' }));

      expect(story.model.view).toStrictEqual({
        x: -Geometry.panStep,
        y: -2 * Geometry.panStep,
        zoom: 1,
      });
    }),
  );

  it.effect('places a box near the top left corner of the view, wherever it is panned', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      story
        .send(EditorMessage.PressedCanvas({ pointer: 1, x: 500, y: 500 }))
        .send(
          EditorMessage.MovedCanvas({
            pointer: 1,
            x: 500 - Geometry.gridStep * 20,
            y: 500 - Geometry.gridStep * 10.5,
          }),
        )
        .send(EditorMessage.ReleasedCanvas({ pointer: 1 }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      expect(story.model.design.boxes[0]?.position).toStrictEqual(
        Geometry.snap({
          x: Geometry.gridStep * 20 + Geometry.firstBoxOffset,
          y: Geometry.gridStep * 10.5 + Geometry.firstBoxOffset,
        }),
      );
    }),
  );

  it.effect('draws a wire from an output port to an input port of another box', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }));

      story.send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }));
      expect(story.model.connecting).toStrictEqual({ box: 'box-1', port: 'machine' });

      story.send(EditorMessage.ClickedInput({ box: 'box-2', port: 'machine' }));
      expect(story.model.design.wires).toStrictEqual([
        { from: { box: 'box-1', port: 'machine' }, to: { box: 'box-2', port: 'machine' } },
      ]);
      expect(story.model.connecting).toBe(null);
    }),
  );

  it.effect('draws no wire into the box it leaves, nor without an output port chosen', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }));

      story.send(EditorMessage.ClickedInput({ box: 'box-1', port: 'machine' }));
      expect(story.model.design.wires).toStrictEqual([]);

      story
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
        .send(EditorMessage.ClickedInput({ box: 'box-1', port: 'machine' }));
      expect(story.model.design.wires).toStrictEqual([]);
      expect(story.model.connecting).toStrictEqual({ box: 'box-1', port: 'machine' });
    }),
  );

  it.effect('gives up the wire being drawn when its output port is clicked again', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }));

      expect(story.model.connecting).toBe(null);
    }),
  );

  it.effect('gives up the wire being drawn on Escape first, and deselects on the next', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }));

      story.send(EditorMessage.PressedEscape());
      expect(story.model.connecting).toBe(null);
      expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });

      story.send(EditorMessage.PressedEscape());
      expect(story.model.selected).toBe(null);
    }),
  );

  it.effect(
    'zooms in and out by the levels about the centre of the panel, and back to the size of the canvas',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});

        story
          .send(EditorMessage.ClickedZoom({ direction: 'in' }))
          .expectExact(HtmlCommand.Measure)
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)));
        expect(story.model.view.zoom).toBe(1.1);
        // The centre of the panel, half its size from its corner, lies over the same point of the canvas.
        expect((Geometry.canvasWidth / 2 - story.model.view.x) / story.model.view.zoom).toBeCloseTo(
          Geometry.canvasWidth / 2,
        );
        expect(
          (Geometry.canvasHeight / 2 - story.model.view.y) / story.model.view.zoom,
        ).toBeCloseTo(Geometry.canvasHeight / 2);

        story
          .send(EditorMessage.PressedZoom({ direction: 'out' }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .send(EditorMessage.PressedZoom({ direction: 'out' }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)));
        expect(story.model.view.zoom).toBe(0.9);

        story
          .send(EditorMessage.ClickedZoom({ direction: 'reset' }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)));
        expect(story.model.view.zoom).toBe(1);
        expect(story.model.view.x).toBeCloseTo(0);
        expect(story.model.view.y).toBeCloseTo(0);
      }),
  );

  it.effect('zooms no farther than the smallest and the largest level', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});

      Geometry.zoomLevels.forEach(() => {
        story
          .send(EditorMessage.ClickedZoom({ direction: 'in' }))
          .resolve(HtmlCommand.Measure, Option.none());
      });
      expect(story.model.view.zoom).toBe(Geometry.maximumZoom);

      Geometry.zoomLevels.forEach(() => {
        story
          .send(EditorMessage.ClickedZoom({ direction: 'out' }))
          .resolve(HtmlCommand.Measure, Option.none());
      });
      expect(story.model.view.zoom).toBe(Geometry.minimumZoom);
    }),
  );

  it.effect(
    'zooms by two pointers about their midpoint, and pans on with the one left, deselecting nothing',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

        story
          .send(EditorMessage.PressedCanvas({ pointer: 1, x: 100, y: 100 }))
          .send(EditorMessage.PressedCanvas({ pointer: 2, x: 200, y: 100 }))
          .expectExact(HtmlCommand.Measure)
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(0, 0)))
          .send(EditorMessage.MovedCanvas({ pointer: 2, x: 300, y: 100 }));
        // Twice as far apart, about the point of the canvas at 150, 100, now under their midpoint at 200, 100.
        expect(story.model.view).toStrictEqual({ x: -100, y: -100, zoom: 2 });

        story
          .send(EditorMessage.ReleasedCanvas({ pointer: 1 }))
          .send(EditorMessage.MovedCanvas({ pointer: 2, x: 310, y: 90 }))
          .send(EditorMessage.ReleasedCanvas({ pointer: 2 }))
          .send(EditorMessage.ClickedCanvas());
        expect(story.model.view).toStrictEqual({ x: -90, y: -110, zoom: 2 });
        expect(story.model.panning).toBe(null);
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });
      }),
  );

  it.effect('places, drags and wires boxes on the grid when the view is panned and zoomed', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      // The view at twice the size, with the point of the canvas at 50, 50 in the corner of the panel.
      story
        .send(EditorMessage.PressedCanvas({ pointer: 1, x: 100, y: 100 }))
        .send(EditorMessage.PressedCanvas({ pointer: 2, x: 200, y: 100 }))
        .resolve(HtmlCommand.Measure, Option.some(canvasAt(0, 0)))
        .send(EditorMessage.MovedCanvas({ pointer: 2, x: 300, y: 100 }))
        .send(EditorMessage.ReleasedCanvas({ pointer: 1 }))
        .send(EditorMessage.ReleasedCanvas({ pointer: 2 }));

      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }));
      expect(story.model.design.boxes.map((box) => box.position)).toStrictEqual([
        { x: 80, y: 80 },
        { x: 112, y: 112 },
      ]);

      // The pointer goes twice as far in the panel as the box on the canvas.
      story
        .send(EditorMessage.PressedHeader({ id: 'box-1', x: 500, y: 300 }))
        .send(
          EditorMessage.MovedPointer({
            x: 500 + Geometry.gridStep * 4,
            y: 300 + Geometry.gridStep * 2,
          }),
        )
        .send(EditorMessage.ReleasedPointer());
      expect(story.model.design.boxes[0]?.position).toStrictEqual({
        x: 80 + Geometry.gridStep * 2,
        y: 80 + Geometry.gridStep,
      });

      // The point of the canvas at 130, 160 lies over the input port of box-2, and in the viewport at 460, 320 for a panel at 300, 100.
      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 700, y: 400 }))
        .send(EditorMessage.MovedWire({ x: 460, y: 320 }))
        .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)));
      expect(pointerOf(story.model)).toStrictEqual(Option.some({ x: 130, y: 160 }));
      expect(aimedOf(story.model)).toStrictEqual(Option.some({ box: 'box-2', port: 'machine' }));

      story.send(EditorMessage.ReleasedWire({ x: 460, y: 320 }));
      expect(story.model.design.wires).toStrictEqual([
        { from: { box: 'box-1', port: 'machine' }, to: { box: 'box-2', port: 'machine' } },
      ]);
    }),
  );

  it.effect('deletes a box with its wires on Delete, and moves focus to the canvas', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
        .send(EditorMessage.ClickedInput({ box: 'box-2', port: 'machine' }));

      story
        .send(EditorMessage.PressedBoxDelete({ id: 'box-2' }))
        .expectExact(HtmlCommand.Focus)
        .resolve(HtmlCommand.Focus, { found: true });

      expect(story.model.design.boxes.map((box) => box.id)).toStrictEqual(['box-1']);
      expect(story.model.design.wires).toStrictEqual([]);
      expect(story.model.selected).toBe(null);
    }),
  );

  it.effect('writes a parameter of the selected box', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story.send(EditorMessage.UpdatedParameter({ name: 'structure', value: 'counter' }));

      expect(story.model.design.boxes[0]?.parameters).toStrictEqual({ structure: 'counter' });
    }),
  );

  it.effect('removes the wire named by the input port it enters', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
        .send(EditorMessage.ClickedInput({ box: 'box-2', port: 'machine' }));

      story
        .send(EditorMessage.ClickedRemoveWire({ box: 'box-2', port: 'machine' }))
        .expectExact(HtmlCommand.Focus)
        .resolve(HtmlCommand.Focus, { found: true });

      expect(story.model.design.wires).toStrictEqual([]);
      expect(story.model.selected).toBe(null);
    }),
  );

  it.effect(
    'selects the wire it draws and a wire that is clicked, and deletes the selected wire on Delete',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }))
          .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
          .send(EditorMessage.ClickedInput({ box: 'box-2', port: 'machine' }));
        expect(story.model.selected).toStrictEqual({
          _tag: 'Wire',
          to: { box: 'box-2', port: 'machine' },
        });

        story
          .send(EditorMessage.ClickedCanvas())
          .send(EditorMessage.ClickedWire({ to: { box: 'box-2', port: 'machine' } }));
        expect(story.model.selected).toStrictEqual({
          _tag: 'Wire',
          to: { box: 'box-2', port: 'machine' },
        });

        story
          .send(EditorMessage.PressedDelete())
          .expectExact(HtmlCommand.Focus)
          .resolve(HtmlCommand.Focus, { found: true });
        expect(story.model.design.wires).toStrictEqual([]);
        expect(story.model.design.boxes).toHaveLength(2);
        expect(story.model.selected).toBe(null);

        story.send(EditorMessage.PressedDelete()).expectNone();
      }),
  );

  it.effect('deletes the selected box on Delete pressed anywhere but on it', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.PressedDelete())
        .expectExact(HtmlCommand.Focus)
        .resolve(HtmlCommand.Focus, { found: true });

      expect(story.model.design.boxes).toStrictEqual([]);
      expect(story.model.selected).toBe(null);
    }),
  );

  it.effect('drops the selection of a wire whose box is deleted, at either end', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
        .send(EditorMessage.ClickedInput({ box: 'box-2', port: 'machine' }));

      story
        .send(EditorMessage.PressedBoxDelete({ id: 'box-1' }))
        .resolve(HtmlCommand.Focus, { found: true });

      expect(story.model.selected).toBe(null);
    }),
  );

  it.effect(
    'selects a box or a wire from the inspector, and brings it into the middle of the view only when it lies outside',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        const panel = {
          x: 0,
          y: 0,
          width: 400,
          height: 300,
          top: 0,
          left: 0,
          right: 400,
          bottom: 300,
        };
        story
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
          .send(
            EditorMessage.DroppedPrimitive({ primitive: 'MealyMachine.series', x: 2000, y: 1200 }),
          );
        const far = story.model.design.boxes[1]?.position ?? { x: 0, y: 0 };

        story
          .send(EditorMessage.ClickedEntity({ entity: { _tag: 'Box', id: 'box-1' } }))
          .expectExact(HtmlCommand.Measure)
          .resolve(HtmlCommand.Measure, Option.some(panel));
        expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });
        expect(story.model.view).toStrictEqual({ x: 0, y: 0, zoom: 1 });

        // The series box is a header and two rows of ports high.
        story
          .send(EditorMessage.ClickedEntity({ entity: { _tag: 'Box', id: 'box-2' } }))
          .resolve(HtmlCommand.Measure, Option.some(panel));
        expect(story.model.view).toStrictEqual({
          x: 200 - (far.x + Geometry.boxWidth / 2),
          y: 150 - (far.y + (Geometry.headerHeight + 2 * Geometry.portHeight) / 2),
          zoom: 1,
        });

        story
          .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: false }))
          .send(EditorMessage.ClickedInput({ box: 'box-2', port: 'first' }))
          .send(
            EditorMessage.ClickedEntity({
              entity: { _tag: 'Wire', to: { box: 'box-2', port: 'first' } },
            }),
          )
          .resolve(HtmlCommand.Measure, Option.none());
        expect(story.model.selected).toStrictEqual({
          _tag: 'Wire',
          to: { box: 'box-2', port: 'first' },
        });
      }),
  );

  it.effect('draws a wire by a drag from an output port released over an input port', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }))
        .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }));

      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
        .send(EditorMessage.MovedWire({ x: 360, y: 210 }))
        .expectExact(HtmlCommand.Measure)
        .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)));
      expect(sourceOf(story.model)).toStrictEqual({ box: 'box-1', port: 'machine' });
      expect(pointerOf(story.model)).toStrictEqual(Option.some({ x: 60, y: 110 }));
      expect(aimedOf(story.model)).toStrictEqual(Option.some({ box: 'box-2', port: 'machine' }));

      story.send(EditorMessage.ReleasedWire({ x: 360, y: 210 }));
      expect(story.model.design.wires).toStrictEqual([
        { from: { box: 'box-1', port: 'machine' }, to: { box: 'box-2', port: 'machine' } },
      ]);
      expect(story.model.drawing).toBe(null);
    }),
  );

  it.effect('starts no wire by the click the pointer sends as its drag ends', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
        .send(EditorMessage.MovedWire({ x: 700, y: 400 }))
        .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
        .send(EditorMessage.ReleasedWire({ x: 700, y: 400 }))
        .send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: true }));

      expect(story.model.design.wires).toStrictEqual([]);
      expect(story.model.connecting).toBe(null);
      expect(story.model.dragged).toBe(false);
    }),
  );

  it.effect('takes a press on an output port that goes nowhere for the click it is', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
        .send(EditorMessage.MovedWire({ x: 531, y: 189 }))
        .expectNone()
        .send(EditorMessage.ReleasedWire({ x: 531, y: 189 }));
      expect(sourceOf(story.model)).toBe(null);

      story.send(EditorMessage.ClickedOutput({ box: 'box-1', port: 'machine', pointer: true }));
      expect(story.model.connecting).toStrictEqual({ box: 'box-1', port: 'machine' });
    }),
  );

  it.effect(
    'draws no wire by a drag into the box it leaves, nor onto a box without the canvas measured',
    () =>
      Effect.gen(function* () {
        const story = yield* Story.make(Editor, {});
        story
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }))
          .send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.mapOutput' }));

        story
          .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
          .send(EditorMessage.MovedWire({ x: 340, y: 190 }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .send(EditorMessage.ReleasedWire({ x: 340, y: 190 }));
        expect(story.model.design.wires).toStrictEqual([]);

        story
          .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
          .send(EditorMessage.MovedWire({ x: 360, y: 210 }))
          .resolve(HtmlCommand.Measure, Option.none())
          .send(EditorMessage.ReleasedWire({ x: 360, y: 210 }));
        expect(story.model.design.wires).toStrictEqual([]);
      }),
  );

  it.effect('gives up a dragged wire on Escape and when the browser takes the press over', () =>
    Effect.gen(function* () {
      const story = yield* Story.make(Editor, {});
      story.send(EditorMessage.ClickedPrimitive({ primitive: 'MealyMachine.make' }));

      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
        .send(EditorMessage.MovedWire({ x: 700, y: 400 }))
        .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
        .send(EditorMessage.PressedEscape());
      expect(story.model.drawing).toBe(null);
      expect(story.model.selected).toStrictEqual({ _tag: 'Box', id: 'box-1' });

      story
        .send(EditorMessage.PressedOutput({ box: 'box-1', port: 'machine', x: 530, y: 188 }))
        .send(EditorMessage.CancelledWire());
      expect(story.model.drawing).toBe(null);
    }),
  );
});

describe('view', () => {
  it.effect(
    'draws a wire that follows the pointer dragged from an output port, and ends it on an input port',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        scene
          .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
          .click(HtmlLocator.role('button', { name: 'Map output' }));
        const output = HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' });

        scene
          .fire(output, 'pointerdown', { button: 0, x: 530, y: 188 })
          .fire(output, 'pointermove', { x: 600, y: 300 })
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .expect(Locator.tag('path'))
          .toHaveAttribute('d', /240 80 .* 300 200$/)
          .expect(canvasStatus)
          .toHaveText(/^Drawing a wire from machine of Mealy machine 1\./)
          .expect(HtmlLocator.role('button', { name: 'Input machine of Map output 2' }))
          .toHaveAttribute('aria-disabled', false)
          .fire(output, 'pointermove', { x: 360, y: 210 })
          .expect(Locator.tag('path'))
          .toHaveAttribute('d', /240 80 .* 64 112$/)
          .fire(output, 'pointerup', { x: 360, y: 210 })
          // The click the browser sends to the port that held the pointer as the press ends.
          .fire(output, 'click', { pointerType: 'mouse' })
          .expect(
            HtmlLocator.role('button', {
              name: 'Input machine of Map output 2, wired from machine of Mealy machine 1',
            }),
          )
          .toExist()
          .expect(canvasStatus)
          .toHaveText('Boxes: 2. Wires: 1.');
      }),
  );

  it.effect(
    'places a primitive dragged from the palette where it is dropped on the canvas, and takes no other drag',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        const position = Geometry.snap({
          x: 300 - Geometry.boxWidth / 2,
          y: 196 - Geometry.headerHeight / 2,
        });

        scene
          .expect(
            Locator.inside(
              HtmlLocator.role('complementary', { name: 'Palette' }),
              Locator.attr('draggable', 'true'),
            ),
          )
          .toHaveCount(5)
          .drop(HtmlLocator.role('region', { name: 'Canvas' }), {
            data: { 'application/x-falkara-primitive': 'MealyMachine.series' },
            x: 300,
            y: 196,
          })
          .expectDefaultPrevented()
          .expect(HtmlLocator.role('group', { name: 'Series 1' }))
          .toHaveAttribute('aria-current', 'true')
          .expect(Locator.text(`MealyMachine.series at ${position.x}, ${position.y}`))
          .toExist();
        expect(() =>
          scene.drop(HtmlLocator.role('region', { name: 'Canvas' }), {
            data: { 'text/plain': 'MealyMachine.series' },
          }),
        ).toThrow();
      }),
  );

  it.effect('places a box from the palette and shows it in the inspector', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});

      scene
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .expect(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
        .toHaveAttribute('aria-current', 'true')
        .expect(canvasStatus)
        .toHaveText('Boxes: 1. Wires: 0.')
        .expect(HtmlLocator.role('heading', { name: 'Mealy machine 1' }))
        .toExist();
    }),
  );

  it.effect('drags a box by its header, which hears the pointer move only from the press on', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));
      const header = Locator.inside(
        HtmlLocator.role('group', { name: 'Mealy machine 1' }),
        Locator.text('Mealy machine'),
      );

      // Before the press the move goes on to the canvas, which pans nothing while no press lasts.
      scene.fire(header, 'pointermove', { x: 1, y: 1 }).expectIgnored();

      scene
        .fire(header, 'pointerdown', { button: 0, x: 100, y: 100 })
        .fire(header, 'pointermove', { x: 148, y: 116 })
        .fire(header, 'pointerup')
        .expect(Locator.text('MealyMachine.make at 80, 48'))
        .toExist();
    }),
  );

  it.effect(
    'keeps a box selected on a click within it, and deselects it on a click on the canvas',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));

        scene
          .click(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
          .expect(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
          .toHaveAttribute('aria-current', 'true')
          .click(canvasStatus)
          .expect(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
          .toHaveAttribute('aria-current', false);
      }),
  );

  it.effect(
    'pans by a press on the canvas, not by a press on a box, and by the arrow keys on the canvas',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));
        const region = HtmlLocator.role('region', { name: 'Canvas' });

        scene
          .fire(HtmlLocator.role('group', { name: 'Mealy machine 1' }), 'pointerdown', {
            button: 0,
            pointerId: 1,
            x: 100,
            y: 100,
          })
          .expectIgnored()
          .fire(region, 'pointerdown', { button: 0, pointerId: 1, x: 100, y: 100 })
          .fire(region, 'pointermove', { pointerId: 1, x: 140, y: 100 })
          .fire(region, 'pointerup', { pointerId: 1 })
          .fire(region, 'click', { pointerType: 'mouse' })
          .expect(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
          .toHaveAttribute('aria-current', 'true')
          .keydown(region, 'ArrowLeft')
          .expectDefaultPrevented();
      }),
  );

  it.effect(
    'zooms by its buttons, and by keys anywhere but in a field, and hears Escape only while there is something to give up',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});

        scene
          .fireDocument('keydown', { key: 'Escape' })
          .expectIgnored()
          .click(HtmlLocator.role('button', { name: 'Zoom in' }))
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .expect(HtmlLocator.role('button', { name: 'Zoom 110%, reset to 100%' }))
          .toHaveText('110%')
          .fireDocument('keydown', { key: '-' })
          .expectDefaultPrevented()
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .expect(HtmlLocator.role('button', { name: 'Zoom 100%, reset to 100%' }))
          .toExist()
          .fireDocument('keydown', { key: '-', editable: true })
          .expectIgnored();
      }),
  );

  it.effect('moves a box by the arrow keys without scrolling the page', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));

      scene
        .keydown(HtmlLocator.role('group', { name: 'Mealy machine 1' }), 'ArrowRight')
        .expectDefaultPrevented()
        .expect(Locator.text('MealyMachine.make at 48, 32'))
        .toExist();
    }),
  );

  it.effect('leaves a key that does nothing to a box to the browser', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));

      scene
        .keydown(HtmlLocator.role('group', { name: 'Mealy machine 1' }), 'Tab')
        .expectIgnored()
        .expectDefaultPrevented(false);
    }),
  );

  it.effect('draws a wire between two boxes by their ports, and names it on the input port', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .click(HtmlLocator.role('button', { name: 'Map output' }));

      scene
        .click(HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' }))
        .expect(HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' }))
        .toHaveAttribute('aria-pressed', 'true')
        .expect(canvasStatus)
        .toHaveText(/^Drawing a wire from machine of Mealy machine 1\./)
        .click(HtmlLocator.role('button', { name: 'Input machine of Map output 2' }))
        .expect(
          HtmlLocator.role('button', {
            name: 'Input machine of Map output 2, wired from machine of Mealy machine 1',
          }),
        )
        .toExist()
        // The wire as it is seen, and the wider path under the pointer that selects it.
        .expect(Locator.tag('path'))
        .toHaveCount(2)
        .expect(canvasStatus)
        .toHaveText('Boxes: 2. Wires: 1.');
    }),
  );

  it.effect(
    'lists every box and every wire in the inspector by name, marking and showing the one selected',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        const inspector = HtmlLocator.role('complementary', { name: 'Inspector' });
        scene
          .expect(Locator.inside(inspector, Locator.text('No box is placed yet.')))
          .toExist()
          .click(HtmlLocator.role('button', { name: 'Series' }))
          .click(HtmlLocator.role('button', { name: 'Map input' }))
          .click(HtmlLocator.role('button', { name: 'Output machine of Series 1' }))
          .click(HtmlLocator.role('button', { name: 'Input machine of Map input 2' }));

        scene
          .expect(Locator.inside(inspector, HtmlLocator.role('button', { name: 'Series 1' })))
          .toHaveAttribute('aria-current', false)
          .expect(HtmlLocator.role('button', { name: 'Series 1 → Map input 2: machine' }))
          .toHaveAttribute('aria-current', 'true')
          .expect(HtmlLocator.role('heading', { name: 'Series 1 → Map input 2: machine' }))
          .toExist()
          .click(Locator.inside(inspector, HtmlLocator.role('button', { name: 'Series 1' })))
          .expectExact(HtmlCommand.Measure)
          .resolve(HtmlCommand.Measure, Option.some(canvasAt(300, 100)))
          .expect(Locator.inside(inspector, HtmlLocator.role('button', { name: 'Series 1' })))
          .toHaveAttribute('aria-current', 'true')
          .expect(HtmlLocator.role('group', { name: 'Series 1' }))
          .toHaveAttribute('aria-current', 'true')
          .expect(HtmlLocator.role('heading', { name: 'Series 1' }))
          .toExist();
      }),
  );

  it.effect('selects a wire by a click on it, and removes it from the inspector', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .click(HtmlLocator.role('button', { name: 'Map output' }))
        .click(HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' }))
        .click(HtmlLocator.role('button', { name: 'Input machine of Map output 2' }))
        .click(canvasStatus);
      const target = Locator.attr('pointer-events', 'stroke');

      scene
        .fire(target, 'pointerdown', { button: 0, pointerId: 1, x: 100, y: 100 })
        .expectIgnored()
        .click(target)
        .expect(HtmlLocator.role('heading', { name: 'Mealy machine 1 → Map output 2: machine' }))
        .toExist()
        .click(
          HtmlLocator.role('button', {
            name: 'Remove the wire Mealy machine 1 → Map output 2: machine',
          }),
        )
        .expectExact(HtmlCommand.Focus)
        .resolve(HtmlCommand.Focus, { found: true })
        .expect(Locator.tag('path'))
        .toHaveCount(0)
        .expect(Locator.text('No wire is drawn yet.'))
        .toExist();
    }),
  );

  it.effect('deletes the selected wire by Delete anywhere but in a field', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .click(HtmlLocator.role('button', { name: 'Map output' }))
        .click(HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' }))
        .click(HtmlLocator.role('button', { name: 'Input machine of Map output 2' }));

      scene
        .fireDocument('keydown', { key: 'Delete', editable: true })
        .expectIgnored()
        .fireDocument('keydown', { key: 'Delete' })
        .expectDefaultPrevented()
        .resolve(HtmlCommand.Focus, { found: true })
        .expect(canvasStatus)
        .toHaveText('Boxes: 2. Wires: 0.');
    }),
  );

  it.effect('keeps an input port focusable and inert while no wire is drawn', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Map output' }));

      scene
        .expect(HtmlLocator.role('button', { name: 'Input machine of Map output 1' }))
        .toHaveAttributes({ 'aria-disabled': 'true', disabled: false });
    }),
  );

  it.effect('shows every port by a handle beside its name, and names it by its label alone', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Series' }));

      scene
        .expect(
          Locator.inside(HtmlLocator.role('group', { name: 'Series 1' }), Locator.tag('span')),
        )
        .toHaveCount(6)
        .expect(HtmlLocator.role('button', { name: 'Input first of Series 1' }))
        .toHaveText('first')
        .expect(HtmlLocator.role('button', { name: 'Output machine of Series 1' }))
        .toHaveText('machine');
    }),
  );

  it.effect(
    'offers the input ports of the other boxes while a wire is drawn, not those of its own',
    () =>
      Effect.gen(function* () {
        const scene = yield* HtmlScene.make(Editor, {});
        scene
          .click(HtmlLocator.role('button', { name: 'Map output' }))
          .click(HtmlLocator.role('button', { name: 'Map input' }));

        scene
          .click(HtmlLocator.role('button', { name: 'Output machine of Map output 1' }))
          .expect(HtmlLocator.role('button', { name: 'Input machine of Map input 2' }))
          .toHaveAttribute('aria-disabled', false)
          .expect(HtmlLocator.role('button', { name: 'Input machine of Map output 1' }))
          .toHaveAttribute('aria-disabled', 'true');
      }),
  );

  it.effect('gives up the wire being drawn on Escape, wherever focus is', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .click(HtmlLocator.role('button', { name: 'Output machine of Mealy machine 1' }));

      scene
        .fireDocument('keydown', { key: 'Escape' })
        .expect(canvasStatus)
        .toHaveText('Boxes: 1. Wires: 0.');
    }),
  );

  it.effect('writes a parameter of the selected box from its field in the inspector', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));

      scene
        .type(HtmlLocator.role('textbox', { name: 'structure' }), 'counter')
        .expect(HtmlLocator.role('textbox', { name: 'structure' }))
        .toHaveValue('counter')
        .expect(Locator.tag('pre'))
        .toHaveText(/"parameters": \{ "structure": "counter" \}/);
    }),
  );

  it.effect('shows the design file indented by two spaces in a region the keyboard reaches', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});

      scene
        .expect(HtmlLocator.role('group', { name: 'Design file' }))
        .toHaveAttribute('tabindex', '0');
      // Read from the element itself, as the text an expectation compares has its white space collapsed.
      expect(Locator.textOf(scene.get(HtmlLocator.role('group', { name: 'Design file' })))).toBe(
        '{\n  "boxes": [],\n  "wires": []\n}',
      );
    }),
  );

  it.effect('copies the design file and says so until the design changes', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      const copied = Locator.inside(
        HtmlLocator.role('complementary', { name: 'Inspector' }),
        Locator.attr('role', 'status'),
      );

      scene
        .click(HtmlLocator.role('button', { name: 'Copy' }))
        .expectExact(CopyDesign)
        .resolve(
          CopyDesign,
          EditorMessage.SucceededCopyDesign({ json: '{\n  "boxes": [],\n  "wires": []\n}' }),
        )
        .expect(copied)
        .toHaveText('Copied.')
        .click(HtmlLocator.role('button', { name: 'Mealy machine' }))
        .expect(copied)
        .toHaveText('');
    }),
  );

  it.effect('says when the clipboard refused the design file', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});

      scene
        .click(HtmlLocator.role('button', { name: 'Copy' }))
        .resolve(
          CopyDesign,
          EditorMessage.FailedCopyDesign({ json: '{\n  "boxes": [],\n  "wires": []\n}' }),
        )
        .expect(
          Locator.inside(
            HtmlLocator.role('complementary', { name: 'Inspector' }),
            Locator.attr('role', 'status'),
          ),
        )
        .toHaveText('Could not copy. Select the text instead.');
    }),
  );

  it.effect('deletes the selected box from the inspector and moves focus to the canvas', () =>
    Effect.gen(function* () {
      const scene = yield* HtmlScene.make(Editor, {});
      scene.click(HtmlLocator.role('button', { name: 'Mealy machine' }));

      scene
        .click(HtmlLocator.role('button', { name: 'Delete Mealy machine 1' }))
        .expectExact(HtmlCommand.Focus)
        .resolve(HtmlCommand.Focus, { found: true })
        .expect(HtmlLocator.role('group', { name: 'Mealy machine 1' }))
        .toBeAbsent();
    }),
  );
});

describe('CopyDesign', () => {
  it.effect('writes the text to the clipboard and says the clipboard took it', () =>
    Effect.gen(function* () {
      const written: Array<string> = [];

      const message = yield* CopyDesign.make({ json: '{}' }).effect.pipe(
        Effect.provide(
          CopyDesign.layer.pipe(
            Layer.provide(
              Layer.succeed(
                Clipboard.Clipboard,
                Clipboard.make({
                  read: Effect.succeed([]),
                  readString: Effect.succeed(''),
                  write: () => Effect.void,
                  writeString: (text) => Effect.sync(() => void written.push(text)),
                }),
              ),
            ),
          ),
        ),
      );

      expect(message).toStrictEqual(EditorMessage.SucceededCopyDesign({ json: '{}' }));
      expect(written).toStrictEqual(['{}']);
    }),
  );

  it.effect('says the clipboard refused the text when it does', () =>
    Effect.gen(function* () {
      const message = yield* CopyDesign.make({ json: '{}' }).effect.pipe(
        Effect.provide(
          CopyDesign.layer.pipe(
            Layer.provide(
              Layer.succeed(
                Clipboard.Clipboard,
                Clipboard.make({
                  read: Effect.succeed([]),
                  readString: Effect.succeed(''),
                  write: () => Effect.void,
                  writeString: () =>
                    Effect.fail(
                      new Clipboard.ClipboardError({ message: 'refused', cause: undefined }),
                    ),
                }),
              ),
            ),
          ),
        ),
      );

      expect(message).toStrictEqual(EditorMessage.FailedCopyDesign({ json: '{}' }));
    }),
  );
});
