# Limitations of Effect UI met in the editor

Every limitation of `@effect/ui`, `@effect/ui-kit` and `@effect/ui-devtools` met while building the editor, as it was met. Each entry says what was tried, what happened, the workaround, and where the source shows it. Source paths are those of the Effect-TS/ui repository at commit `e0b7cec`, the snapshot the editor installs.

Nothing here was run in a browser: the editor is verified by `vp check`, `vp test` and `vp build` alone, so every entry rests on the source, the types and the test harnesses.

## Packaging

### 1. Every API is experimental to the Effect language service

- **Tried:** importing anything from `@effect/ui`, `@effect/ui-kit` or `@effect/ui-devtools` under the workspace's Effect language service.
- **Happened:** every use is the error `TS377135 … is an experimental API. effect(experimentalApiUsage)`, 18 errors on the first check, as every export carries `@stability experimental`.
- **Workaround:** `allowedExperimentalApis` lists the packages in each `tsconfig.*.json` of the editor. `plugins` is an array, which `extends` replaces whole, so each config repeats the plugin entry of `tsconfig.base.json` with the unstable modules it needs.
- **Source:** `packages/ui/src/html/Html.ts` (66 `@stability experimental` tags), `packages/ui/src/Component.ts` (115), `packages/ui-kit/src/Button.ts:77`.

### 2. The packages are only on pkg.pr.new, all at version 0.0.0

- **Tried:** `vp install` with the three packages as `https://pkg.pr.new/Effect-TS/ui/<package>@e0b7cec`.
- **Happened:** npm 12 refused with `EALLOWREMOTE`, as the workspace's `.npmrc` did not allow remote tarballs. Every snapshot is version `0.0.0`, so the version says nothing about the commit, and the lockfile tells snapshots apart by URL alone.
- **Workaround:** `allow-remote=root` in the workspace `.npmrc`.
- **Source:** `packages/ui/package.json:4`, `packages/ui-kit/package.json:4`, `packages/ui-devtools/package.json:4`.

### 3. The kit asks for a newer Effect than the framework it builds on

- **Tried:** installing beside `effect` 4.1.5, which the workspace pinned.
- **Happened:** `@effect/ui` and `@effect/ui-devtools` accept `effect ^4.1.4`, `@effect/ui-kit` needs `^4.1.6`, so the kit alone forces the move.
- **Workaround:** the workspace moved to `effect` 4.1.6.
- **Source:** `packages/ui/package.json:110`, `packages/ui-devtools/package.json:87`, `packages/ui-kit/package.json:69`.

### 4. Nothing ties the kit to the snapshot of the framework it was built against

- **Tried:** reading what `@effect/ui-kit` requires of `@effect/ui`.
- **Happened:** published, its peer range is `"@effect/ui": "^0.0.0"`, which every snapshot satisfies, so a kit and a framework of different commits install without a warning.
- **Workaround:** the same commit is written by hand in all three URLs of `package.json`.
- **Source:** `packages/ui-kit/package.json:68` (`workspace:^`, published as `^0.0.0`).

## Events

### 5. A pointer event carries only viewport coordinates

- **Tried:** placing a dragged box under the pointer on a canvas that scrolls.
- **Happened:** `PointerPayload` has `x` and `y` from `clientX` and `clientY` and nothing relative to the element: no `offsetX`, no `movementX`, no bounding box. A handler never sees the DOM event.
- **Workaround:** the Model keeps where the pointer pressed and where the box lay, and every move places the box by the difference. Anything that needs an absolute place on the canvas, such as dropping a new box where the pointer is, would need `HtmlCommand.measure` first, a Command and so a round trip through `update`.
- **Source:** `packages/ui/src/html/Html.ts:287-297`, `packages/ui/src/html/internal/payload.ts:209-229`.

### 6. Only the innermost handler hears an event, and nothing else can be asked for

- **Tried:** a click on the canvas that deselects, with boxes drawn inside the canvas.
- **Happened:** an event goes to the innermost element with a handler for it and to no other, and `EventOptions` has `preventDefault` alone: no propagation control either way. By that rule a click on the body of a box, which had no click handler in the first design, goes to the canvas and deselects the box that focus has just selected.
- **Workaround:** the box has a click handler of its own (`ClickedBox`), needed only to keep the click from the canvas. The same rule means a box never hears a click on one of its port buttons.
- **Source:** `packages/ui/src/html/Html.ts:748-751`, `packages/ui/src/View.ts:147-149`; the kit meets the same rule at `packages/ui-kit/src/Field.ts:108-112`.

### 7. Capturing the pointer on an element takes the clicks of its children

- **Tried:** designing the drag with `capturePointer: true` on the whole box, to drag it from anywhere. Not run: the source ruled it out first.
- **Happened:** the documentation says a captured press sends its `click` to the capturing element instead of the child, which would take the clicks of the port buttons inside the box.
- **Workaround:** only the header of a box is the drag handle, and it holds nothing interactive.
- **Source:** `packages/ui/src/html/Html.ts:649-667`.

### 8. A drag cannot be followed on the document

- **Tried:** following a drag with a Subscription on the document while a box is dragged, the usual way to keep a drag when the pointer leaves the element.
- **Happened:** `HtmlSubscription.DocumentEvents` has `pointerup` and `pointercancel` and no `pointermove`.
- **Workaround:** pointer capture on the header, with the limit of entry 7.
- **Source:** `packages/ui/src/html/HtmlSubscription.ts:57-65`.

### 9. There is no wheel event

- **Tried:** deciding how the canvas pans and zooms.
- **Happened:** neither the element events nor the document events include `wheel`, so a view cannot zoom the canvas on the wheel or a pinch.
- **Workaround:** the canvas is a fixed area that scrolls natively in its panel, and it does not zoom.
- **Source:** `packages/ui/src/html/Html.ts:768-795`, `packages/ui/src/html/HtmlSubscription.ts:57-65`.

### 10. A key handler cannot tell which descendant the key was pressed on

- **Tried:** deleting a box on Delete only while the box itself has focus.
- **Happened:** `KeyPayload` says of the target only whether it is `editable`. Delete pressed on a port button inside the box reaches the same handler with the same payload.
- **Workaround:** none; Delete and the arrow keys act on the box from anywhere inside it.
- **Source:** `packages/ui/src/html/Html.ts:342-351`.

## Views and types

### 11. A fragment does not get the Model

- **Tried:** splitting the view into fragments with `EditorDef.fragment((h, model) => …)`.
- **Happened:** `h` carries the props and not the Model, and every argument after `h` is a free generic, so `model` is `unknown` to the checker until it is annotated.
- **Workaround:** each fragment annotates `model: EditorModel` and the view passes it.
- **Source:** `packages/ui/src/Component.ts:2648-2660`, `packages/ui/src/Component.ts:2955-2972`.

### 12. The view cannot read layout, so wires cannot follow measured ports

- **Tried:** drawing a wire from where an output port is to where an input port is.
- **Happened:** a view is a pure function of the Model, and the size or place of an element comes only from a Command (`HtmlCommand.measure`) or a mount, each a round trip through `update`, neither of which runs in a `Scene`.
- **Workaround:** the geometry of a box is fixed in CSS pixels in `src/Geometry.ts`; the view sizes the box from it and the wires are computed from the same numbers. Text in a box therefore cannot wrap or grow the box.
- **Source:** `packages/ui/src/html/HtmlCommand.ts:301`, `LLMS.md:799-800`.

### 13. The kit has nothing for free dragging on a surface

- **Tried:** finding a kit component for dragging a box on a canvas, or for a pannable surface.
- **Happened:** the kit drags in `SortableList` (reordering a list), `Slider`, `NumberField` and `Drawer` only.
- **Workaround:** the drag is written in the editor's own `update`.
- **Source:** `packages/ui-kit/README.md:30-76`.

## StyleX

### 14. A builder takes no class and style together, and `style` replaces

- **Tried:** giving an element what `stylex.props(…)` returns.
- **Happened:** there is no method that takes `{ className, style }`. `class` adds to the classes, while `style` replaces the whole style, so a second `style` call for a value only the view knows drops the custom properties StyleX wrote. `style` takes strings alone, and StyleX gives numbers too.
- **Workaround:** `src/Styled.ts`, one call through which all the styles of an element go, turning every value into a string. The `data-style-src` that StyleX adds in development is dropped.
- **Source:** `packages/ui/src/html/Html.ts:899-945` (`style`), `packages/ui/src/html/Html.ts:946-982` (`class`).

## Testing

### 15. A silenced Command must still be settled in a Story, with a result nothing reads

- **Tried:** `HtmlCommand.Focus.make({ ref }).pipe(Command.asNoop)` after a deletion, then sending the next message in a `Story`.
- **Happened:** `Story.send: earlier work isn't settled or acknowledged: HtmlCommand.focus({"ref":"canvas"}) [running] is pending`, and the same at the end of the test. The Command sends no message, yet every test that deletes a box must write `.resolve(HtmlCommand.Focus, { found: true })`.
- **Workaround:** the tests resolve it.
- **Source:** `packages/ui/src/internal/story.ts:2055`, `packages/ui/src/Command.ts:1532`.

### 16. A Scene has no pointer steps, and `fire` is untyped

- **Tried:** dragging a box in an `HtmlScene`.
- **Happened:** the steps are `click`, `type`, `change`, `keydown`, `submit`, `focus`, `blur` and `drop`. A press, a move and a release go through `fire(locator, event: string, payload?: unknown)`, where neither the name of the event nor its payload is checked against the events of the element.
- **Workaround:** `scene.fire(header, 'pointerdown', { button: 0, x: 100, y: 100 })`, written by hand.
- **Source:** `packages/ui/src/testing/Scene.ts:254`, `packages/ui/src/html/testing/HtmlScene.ts:195-251`.

## Documentation

### 17. The devtools README and the plugin disagree on the entry module

- **Tried:** setting up `DevToolsVite.plugin`.
- **Happened:** the README says to add the plugin "and keep `DevTools.layer()` in the app"; the plugin's own documentation says "No changes to the app's entry module are needed in development", and its `overlay` option, on by default, mounts the overlay itself.
- **Workaround:** the editor follows the source and mounts nothing in its entry module. Not verified, as no development server was run.
- **Source:** `packages/ui-devtools/README.md:67`, `packages/ui-devtools/src/node/DevToolsVite.ts:17`, `packages/ui-devtools/src/node/DevToolsVite.ts:63-68`.

## Size

### 18. The skeleton builds to 233.57 kB of JavaScript

- **Tried:** `vp build`.
- **Happened:** one chunk of 233.57 kB, 80.56 kB gzipped, for one component, three view functions of the kit (`Button`, `Input`, `Toggle`) and its `Field` component. The figure includes Effect and its `Schema`; what share is Effect UI's was not measured.
- **Workaround:** none sought.
- **Source:** the output of `vp build` in this directory.

## Prerendering and hydration

### 19. A click made before the editor hydrates is lost

- **Tried:** prerendering the editor into `index.html` and hydrating it with `HtmlHydrate.hydrate`.
- **Happened:** the prerendered palette shows real buttons before the JavaScript loads, and a click on one then places nothing: hydration keeps what was typed into a field and keeps no click or submit, whether made before the client runs or on an instance still waiting. Upstream decided against replay in the framework (pull request 293) and documents a pattern for the application instead: an inline script that cancels and records early clicks, taken off before hydration, and replayed after `root.adopted`.
- **Workaround:** none taken. The editor loads one local chunk, so the window is short; the replay script is the documented way to close it.
- **Source:** `packages/ui/src/html/HtmlHydrate.ts:755-760`, `ai-docs/src/10_ui/45_hydration.ts:36-58`.

### 20. The state of a prerendered document is read by hand

- **Tried:** reading the state `HtmlServer.document` writes into `<script type="application/json" id="state">`.
- **Happened:** nothing reads it back. The documentation and the examples write `JSON.parse(document.getElementById("state")!.textContent!)`, two non-null assertions and a parse that throws, and `Renderer.State` is an interface with no schema to decode it with.
- **Workaround:** `src/Entrypoint.ts` decodes the text with a schema of its own, a record of unknown values read from JSON, and mounts fresh when there is no state or it is no JSON.
- **Source:** `ai-docs/src/10_ui/45_hydration.ts:30`, `examples/launch/src/main.ts:12-14`, `packages/ui/src/Renderer.ts:351-359`.

### 21. Prerendering one static document still takes an HTTP entry

- **Tried:** `HtmlServerVite.plugin`, to write one document for a component that has no routes.
- **Happened:** the plugin takes a server entry whose default export is a Layer of `HttpRouter` routes and whose `prerender` lists paths; there is no option to name a component and its props. The entry brings `effect/http`, which Effect marks unstable, into the source of an application that serves nothing.
- **Workaround:** `src/Prerender.ts`, one `HttpRouter.add('GET', '/')` around `HtmlServer.renderToHtml`, with `effect/http` allowed in `tsconfig.app.json`.
- **Source:** `packages/ui/src/html/HtmlServerVite.ts:5-12`, `packages/ui/src/html/HtmlServerVite.ts:120-131`.

### 22. Hydrating instead of mounting adds 17 kB

- **Tried:** `vp build` after the browser entry took `HtmlHydrate.hydrate`, keeping `BrowserHost.mount` for a document without state.
- **Happened:** the chunk went from 233.57 kB to 250.92 kB, 80.56 kB to 86.68 kB gzipped.
- **Workaround:** none sought.
- **Source:** the output of `vp build` in this directory.

### 23. The hydration test helper needs a DOM the other harnesses do not

- **Tried:** `ssr(Editor, {})` from `@effect/ui/html/testing` in a test file like the others.
- **Happened:** a `Story`, a `Scene` and a `Play` run without a document, while `ssr` hydrates into a real one, so its file needs `// @vitest-environment happy-dom` and the application a DOM implementation among its dependencies.
- **Workaround:** `happy-dom` as a development dependency, and the hydration test in a file of its own, `src/Editor.hydration.test.ts`.
- **Source:** `ai-docs/src/10_ui/50_testing.ts:9`, `ai-docs/src/10_ui/50_testing.ts:554-557`.

## StyleX, after the first version

### 25. The kit reports state in data attributes, which StyleX does not select by

- **Tried:** styling a port by its state: a `Toggle` that is pressed, a `Button` that is disabled.
- **Happened:** the kit writes the state as `data-pressed`, `data-disabled` and ARIA attributes for a stylesheet to select by, and StyleX has no attribute selectors, so none of them reaches a style.
- **Workaround:** the view works each state out again from the Model and passes a style for it (`isDrawn && styles.drawn`), beside the props that make the kit write the attribute. What the handle of a port shows is carried from the port to its handle in StyleX variables (`src/Port.stylex.ts`).
- **Source:** `packages/ui-kit/src/Toggle.ts:22-25`, `packages/ui-kit/src/Button.ts:14-18`.

## Dragging a wire

### 26. The kit's press and toggle hide the click they come from

- **Tried:** telling the click that Enter makes on an output port from the click the browser sends as a drag from that port ends, which must start no wire.
- **Happened:** a click's payload says which kind of pointer made it, none for the keyboard, and the kit passes none of it on: `Toggle` calls `onToggle` with `{ pressed }` alone, and `Button` takes a ready message as `onPress`. A click handler beside `onToggle` or `onPress` throws at render.
- **Workaround:** the output port leaves `onToggle` out, so that `Toggle` writes the pressed state alone, and hears `click` itself with its `pointerType`. The Model keeps whether the last press was a drag, and a pointer's click after a drag only clears that.
- **Source:** `packages/ui-kit/src/Toggle.ts:143-146`, `packages/ui-kit/src/Toggle.ts:158-162`, `packages/ui-kit/src/Button.ts:158-159`.

### 27. Nothing says what a captured pointer is over

- **Tried:** connecting a dragged wire to the input port it is released over, and showing that port as the target while the pointer is over it.
- **Happened:** the output port holds the pointer for the drag, as entry 7 and entry 8 leave no other way to follow it, so no other element gets an event or a hover from it. The events have no `pointerenter` or `pointerover`, a payload names no element under the pointer, and a handler cannot ask the document for one.
- **Workaround:** the port under the pointer is worked out from the geometry of the boxes in the Model (`aimedOf` in `src/EditorDefinition.ts`), and is styled from the Model rather than by `:hover`. That needs the pointer on the canvas, which entry 5 withholds: as a press becomes a drag the canvas is measured with `HtmlCommand.measure`, one round trip through `update`, and a drag released before the measurement returns draws nothing. The canvas scrolling under a drag is not followed.
- **Source:** `packages/ui/src/html/Html.ts:768-795`, `packages/ui/src/html/Html.ts:649-667`, `packages/ui/src/html/HtmlCommand.ts:301-312`.

## The design file

### 28. An expectation on text collapses white space, in a `pre` too

- **Tried:** `.expect(file).toHaveText('{\n  "boxes": [],\n  "wires": []\n}')` on the `pre` that shows the design file indented.
- **Happened:** the expectation failed with `its text is "{ \"boxes\": [], \"wires\": [] }"`: the text an expectation compares has every run of white space made one space and its ends trimmed, whatever the element, so the indentation the test is about cannot be expected.
- **Workaround:** the test reads the element and its text itself, `Locator.textOf(scene.get(file))`, which keeps the white space, and compares that.
- **Source:** `packages/ui/src/internal/scene.ts:134`, `packages/ui/src/testing/Locator.ts:72-80`.

### 29. Nothing copies to the clipboard

- **Tried:** a copy button for the design file, from the framework or the kit.
- **Happened:** neither has one. The Commands of `HtmlCommand` focus, blur, scroll, measure, select, submit, open a picker and wait for a paint or an animation; the only mention of a clipboard is the text a `paste` event carries. The kit has no copy button.
- **Workaround:** `CopyDesign` in `src/Editor.ts`, a `Command.Service` over the `Clipboard` service of `@effect/platform-browser`, which the editor provides itself and a test replaces; the outcome is a message and the inspector says it. The package and the Command took the chunk from 255.18 kB to 266.54 kB, 87.88 kB to 91.90 kB gzipped.
- **Source:** `packages/ui/src/html/HtmlCommand.ts:102-634` (the Commands there are), `packages/ui/src/html/Html.ts:438` (`PastePayload`), `packages/ui-kit/README.md:30-76`.

## Devtools

### 24. The devtools server is not closed before Vite starts the next one

- **Tried:** editing `vite.config.ts` while the development server ran, which restarts it. Seen in the user's own server, not started here.
- **Happened:** once, `Effect UI DevTools could not start on http://127.0.0.1:4778: listen EADDRINUSE: address already in use 127.0.0.1:4778. Give DevToolsVite.plugin another port.` The restart six seconds later started it. The source agrees: `configureServer` builds the devtools server at once, and the only thing that closes the one before it is a listener on the `close` of Vite's HTTP server, which forks the interrupt of the fiber and waits for nothing. A restart builds the new plugin and runs its `configureServer` while the old HTTP server may still be open or its devtools server still closing, and the port is then taken. Nothing retries: the failure is logged as a warning, `bound` settles to false, and that server runs without the devtools' meta tag until the next restart.
- **Workaround:** none; a second restart. Another port would not help, as the clash is with the plugin's own earlier server.
- **Source:** `packages/ui-devtools/src/node/DevToolsVite.ts:393-414` (the build and the warning), `packages/ui-devtools/src/node/DevToolsVite.ts:416-418` (the unawaited close).

## Panning, zooming and selecting

### 30. There is still no wheel event, and by design

- **Tried:** zooming the canvas by the wheel or a pinch, after reading the source of `e0b7cec` again for entry 9.
- **Happened:** `Html.Events` has no `wheel`, `touchstart` or `touchmove`, and `HtmlSubscription.DocumentEvents` has none of them either. The browser host says why: its listeners are delegated to the document, where browsers make those three passive, so a handler could never cancel the page's own scroll or zoom. A trackpad pinch reaches a page only as a `wheel` with `ctrlKey`, so it is out of reach too.
- **Workaround:** the zoom buttons and the keys `+`, `=`, `-` and `0` step through the page zoom levels of Chromium about the centre of the panel; a pinch of two touches is built from pointer events, told apart by their `pointerId`, each captured on the canvas panel, which has `touch-action: none`. A mouse wheel and a trackpad neither pan nor zoom the canvas.
- **Source:** `packages/ui/src/html/BrowserHost.ts:53-55`, `packages/ui/src/html/Html.ts:768-795`, `packages/ui/src/html/HtmlSubscription.ts:57-65`.

### 31. A child keeps its click from an ancestor that captures the pointer only by a press handler that sends nothing

- **Tried:** panning by a press on the canvas panel, captured so that the pan follows the pointer wherever it goes (entry 8), with the boxes, the wires and the zoom buttons inside the panel.
- **Happened:** a press goes to the innermost element with a `pointerdown` handler, which was the panel's; it captured the pointer, and a captured press sends its `click` to the capturing element (entry 7), so the zoom buttons, the input ports and the wires lost their clicks, and a press on the body of a box panned the view.
- **Workaround:** each box, the zoom group and the path of each wire that the pointer clicks carry `.on('pointerdown', () => undefined)`: as the innermost handler it keeps the press from the panel, and as it sends nothing it captures nothing. Every such press is an ignored interaction that a Scene acknowledges with `expectIgnored()`.
- **Source:** `packages/ui/src/html/Html.ts:17-19`, `packages/ui/src/html/Html.ts:649-667`.

### 32. The size of the panel is known only by measuring it, every time

- **Tried:** zooming about the centre of the canvas panel, and bringing a box or a wire chosen in the inspector into view, which both need the size of the panel.
- **Happened:** no event or Subscription says the size of an element or of the window, as `HtmlSubscription.WindowEvents` has `focus` and `blur` alone and a view cannot read layout (entry 12), and a size kept in the Model would go stale as the window is resized.
- **Workaround:** every zoom by a button or a key, every choice in the inspector and the second finger of a pinch measure the panel with `HtmlCommand.measure`, one round trip through `update` each; a measurement that finds no panel zooms about its corner and brings nothing into view. Every Story and Scene step that zooms resolves the measurement.
- **Source:** `packages/ui/src/html/HtmlSubscription.ts:80-83`, `packages/ui/src/html/HtmlCommand.ts:294-312`.

### 33. All the keys the document hears go through one handler

- **Tried:** Escape while something can be given up, Delete and Backspace while something is selected, and the zoom keys always, as document Subscriptions of their own.
- **Happened:** an instance has one listener per document event and phase, keyed `@effect/ui/html/document:"keydown"`, and listing a second fails the instance as a duplicate key.
- **Workaround:** one `HtmlSubscription.shortcuts` table, whose rows for Escape and Delete the Model adds and drops. The editor therefore always has a document Subscription, where before it had none while nothing was selected, and the test of that became a Scene test that Escape is ignored.
- **Source:** `packages/ui/src/html/HtmlSubscription.ts:274-279`, `packages/ui/src/html/HtmlSubscription.ts:336-340`.

## Dragging from the palette

### 34. A Scene drops what the test writes, not what the drag source carries

- **Tried:** testing that a primitive dragged from the palette is placed where it is dropped.
- **Happened:** `HtmlScene.drop` takes the data of the drag as its payload and checks it against what the target accepts. No step starts a drag at a `draggable` element and carries its data, and the data `draggable` stores is kept as the element's `dragstart` options, which no expectation reads.
- **Workaround:** the test expects the five items of the palette to be `draggable="true"` and drops `{ 'application/x-falkara-primitive': 'MealyMachine.series' }` written by hand, so that the type the palette carries and the type the canvas accepts are tied by the constant they share in `src/EditorView.ts` alone. The drop itself needs no measurement, as its payload gives the pointer from the corner of the target.
- **Source:** `packages/ui/src/html/testing/HtmlScene.ts:238-251`, `packages/ui/src/html/Html.ts:1106-1129`.

## Color schemes

### 35. A choice kept in the browser reaches the Model one Command after hydration

- **Tried:** drawing the prerendered editor in the color scheme the person chose, which the browser keeps.
- **Happened:** the server cannot know the choice, hydration adopts the server's Model, and `init` runs again only for its Commands, so the Model learns the choice from a Command run as the instance adopts, after the document was drawn from the server's HTML. Nothing of the framework runs before the first paint.
- **Workaround:** an inline script in `index.html`, ahead of the stylesheet, sets `data-scheme` on the root from local storage; the switch keeps `chosen: null` until its `ReadScheme` returns, and only then sets `data-scheme` through `HtmlHead.htmlData`. The key is written in both places, and no test ties them (entry 37).
- **Source:** `packages/ui/src/html/HtmlHydrate.ts:741-745`, `packages/ui/src/Command.ts:1772-1774`.

### 36. An attribute of the root set before hydration comes back when its head entry goes

- **Tried:** setting `data-scheme` on the root from the head of the switch, over the value the inline script set.
- **Happened:** the head sync records an attribute's value as the shell's when an entry first sets it, and puts that value back when the last entry for it goes. The script's value counts as the shell's, so an entry dropped later, as it would be for the scheme of the system, would bring back the scheme the page was loaded with.
- **Workaround:** once the choice is read the head always has an entry, `system`, `light` or `dark`, and `src/Styles.css` gives `system` no rule of its own.
- **Source:** `packages/ui/src/html/internal/head.ts:108-118`, `packages/ui/src/html/internal/head.ts:258-277`, `packages/ui/src/html/HtmlHead.ts:433-448`.

### 37. No harness draws a view with its styles or its shell

- **Tried:** testing the key views of the editor in the light and the dark scheme.
- **Happened:** a Story and a Scene draw no CSS, and `ssr` writes the server's HTML of the component into a fresh document of its own, without the inline script and the stylesheet of `index.html`, so no test sees a color or the script.
- **Workaround:** the hydration test keeps a choice in the local storage of happy-dom, hydrates, and expects the scheme on the root and its button pressed, for light, dark and none. That every color has a value in both schemes that meets WCAG 2.2 Contrast (Enhanced) is checked by `Color.verify` as the build and a test work out `stylex.env`. The script was checked by reading the built `dist/index.html`.
- **Source:** `packages/ui/src/html/testing/Ssr.ts:269-284`.

### 38. A Command in `init` must be resolved by every Story and Scene of its component

- **Tried:** reading the kept scheme as the switch starts.
- **Happened:** the Command is pending from the first step; a Story or a Scene throws on the next message step until it is resolved, and fails at its end if it never is. In the editor itself that would have put a `resolve` at the start of every one of its tests.
- **Workaround:** the switch is a component of its own, which a Scene of the editor treats as a leaf, so only its own tests resolve `ReadScheme`; the one that clicks before the reading names it with `keepPending`.
- **Source:** `ai-docs/src/10_ui/50_testing.ts:57-63`, `packages/ui/src/testing/Scene.ts:14`.

### 39. `Story.head` takes the record, not the Story

- **Tried:** `Story.head(story)` to read the head of the switch in a Story.
- **Happened:** it throws `Story.head: the record didn't come from a Story or a Scene`, though the value came from `Story.make` and the call type-checks: the overload wants the record, `story.current`.
- **Workaround:** `Story.head(story.current)`.
- **Source:** `packages/ui/src/testing/Story.ts:832-856`, `packages/ui/src/testing/Steps.ts:291`.

## Size, after the canvas and the schemes

### 40. The eight changes took the chunk from 266.54 kB to 301.30 kB

- **Tried:** `vp build` after each change.
- **Happened:** 266.54 kB, 91.90 kB gzipped, became 274.84 kB with the grid, whose step the browser now takes from the Space module of `@falkara/presentation` (8.30 kB, none of it Effect UI's), 277.15 kB with panning, 280.40 kB with zooming, 280.96 kB with dragging from the palette, 285.70 kB with the inspector of every box and wire, and 301.30 kB, 102.72 kB gzipped, with the color schemes. The switch alone took 15.60 kB: a second component with a head, which brings in `HtmlHead`, two Command services and Effect's `KeyValueStore`; what share is Effect UI's was not measured.
- **Workaround:** none sought.
- **Source:** the output of `vp build` in this directory.
