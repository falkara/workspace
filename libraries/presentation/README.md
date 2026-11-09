# Falkara Presentation

Falkara Presentation is an [Effect-based](https://effect.website/) TypeScript library for interface design. It derives each value from established standards and refuses any that would break them to keep the design consistent as it scales.

It has always nagged at us that most interfaces resize in jumps at breakpoints while every screen between them makes do. We tied every value to shared ratios so each one grows smoothly in step with the rest. Every screen up to a desktop gets values of its own, even the ones nobody designed for.

Decisions shift from numbers to intent. Everything that follows from that intent is worked out once and carries its reason with it, so none of it rests on anyone's taste. No value that would leave a reader behind ever reaches a screen. What remains is the part worth arguing about: how the interface should feel.

## Spotlight

Nothing shows the idea better than a fluid type scale. Three choices go in and out comes either a whole scale or a precise no for anything past the standards.

```ts
import { Effect, Rational } from 'effect';
import * as Fluid from '@falkara/presentation/Fluid';
import * as Typography from '@falkara/presentation/Typography';

// Intent: how sharply headings rise on narrow and wide screens, and how large body text gets.
const intent = {
  minimumFactor: Rational.makeUnsafe(6n, 5n),
  maximumFactor: Rational.makeUnsafe(5n, 4n),
  maximumBodyFontSize: Rational.fromBigInt(20n), // CSS pixels
};

Effect.gen(function* () {
  const steps = yield* Typography.scale(intent);
  return yield* Effect.forEach(steps, (step) => Fluid.clamp(step.minimumSize, step.maximumSize));
});
// Success: [
//   'clamp(0.83333rem, 0.77778rem + 0.27778vw, 1rem)',       position −1
//   'clamp(1rem, 0.91667rem + 0.41667vw, 1.25rem)',          position 0, body text
//   …
//   'clamp(2.98598rem, 2.39185rem + 2.97065vw, 4.76837rem)', position 6
// ]

Typography.scale({ ...intent, maximumBodyFontSize: Rational.fromBigInt(30n) });
// Failure: SchemaError(Expected a body font size of at most 25.6 px, so that text can be enlarged
//   to 200 %, as WCAG 2.2 Resize Text requires, within the 300 % page zoom of Safari, the lowest
//   maximum among the Baseline core browsers
//   at ["maximumBodyFontSize"])
```

Without Effect the same call returns a plain value that reads right away.

```ts
import { Exit, Option } from 'effect';

const scale = Typography.scale(intent);

if (Exit.isSuccess(scale)) {
  scale.value; // the steps
} else {
  Option.getOrUndefined(Exit.findErrorOption(scale))?.message; // every reason, one per line
}
```

Every schema the modules export, such as `Typography.ScaleOptions`, works with validators outside Effect too once it passes through `Schema.toStandardSchemaV1`.

## Modules

- **Typography** turns three choices into a fluid type scale where every step stays resizable.
- **Space** grows every gap with body text from that same intent.
- **Color** measures each pair against the size of the text it carries and finds the closest legible shade of a brand color.
- **Layout** holds lines to lengths that follow the font.

Viewport, Length and Fluid hold the facts the rest stands on, worked out exactly in the `Rational` numbers of Effect.

## Groundwork

We build only on what the industry already agrees on and let a handful of them settle every decision that is not a matter of taste.

![Utopia stands on USWDS, which stands on WCAG, which stands on the Web Platform.](../../.github/assets/groundwork.svg)

### Web Platform

Facts and opinions come built in. Only facts that hold for every reader in every browser are kept and opinions give way to derived values.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../.github/assets/baseline-widely-available-dark.svg">
  <img alt="Baseline Widely Available" src="../../.github/assets/baseline-widely-available.svg" height="32">
</picture>

### WCAG

Promises to readers are on record. Values keep every promise within their reach and that goes well past what the European Accessibility Act in the EU and Section 508 of the Rehabilitation Act in the United States demand.

Values meet the success criteria of WCAG 2.2 up to Level AAA that they decide: Contrast (Enhanced) for text, Resize Text, Reflow, Text Spacing and Visual Presentation. Criteria they feed without deciding, such as the contrast of interface components and focus indicators or the size of targets, rest with the interface that uses them.

### USWDS

Conventions earn trust by surviving real use. Values borrow them only where the guidelines fall silent and only from [the design system](https://designsystem.digital.gov/about/) the United States government builds its websites with, which supports dozens of its agencies and nearly 200 of their sites.

### Utopia

Good models make hard things simple. Values follow Utopia for fluid type and space and hold it to every limit from the layers below.

## License

Falkara Presentation is licensed under [MIT](LICENSE).

Baseline logos by Google, licensed under [CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/).
