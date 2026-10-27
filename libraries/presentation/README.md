# @falkara/presentation

Fluid typography for the web that stays accessible by construction. Every value follows from a few facts about WCAG and browsers, and the library refuses any type scale that a reader could not enlarge.

You choose the character of your type: how fast it grows and how large body text gets on wide screens. The library works out which sizes are safe and writes them as CSS `clamp()` values that grow with the viewport.

## Installation

```sh
npm install @falkara/presentation effect
```

The package ships TypeScript source, so it needs a bundler that compiles TypeScript, such as Vite. [Effect](https://effect.website) is used for exact fractions, schemas and results.

## Quick start

```ts
import { Result } from 'effect';
import { Fluid, Fraction, Typography } from '@falkara/presentation';

const scale = Typography.scale({
  minimumFactor: Fraction.make(6, 5), // each step is 6/5 of the one below on narrow screens
  maximumFactor: Fraction.make(5, 4), // and 5/4 on wide screens
  maximumBodyFontSize: 20, // body text grows from 16 px to 20 px
});

const fontSizes = Result.getOrThrow(scale).map((step) => ({
  position: step.position,
  fontSize: Fluid.clamp(step.minimumSize, step.maximumSize),
}));
```

`fontSizes` holds one entry per step, from small print to the largest heading:

| Position | 320 px viewport | 1280 px viewport | CSS value                                          |
| -------- | --------------- | ---------------- | -------------------------------------------------- |
| −1       | 13.33 px        | 16 px            | `clamp(0.8333rem, 0.7778rem + 0.2778vw, 1rem)`     |
| 0        | 16 px           | 20 px            | `clamp(1rem, 0.9167rem + 0.4167vw, 1.25rem)`       |
| 1        | 19.2 px         | 25 px            | `clamp(1.2rem, 1.0792rem + 0.6042vw, 1.5625rem)`   |
| …        |                 |                  |                                                    |
| 6        | 47.78 px        | 76.29 px         | `clamp(2.986rem, 2.3919rem + 2.9706vw, 4.7684rem)` |

Position 0 is body text, positive positions are headings and negative positions are smaller text. Use the values in any styling system: they are plain CSS strings.

## Concepts

### The viewport range

Every fluid value grows linearly from the minimum viewport width, 320 CSS pixels, to the maximum viewport width, 1280 CSS pixels, and holds its size outside that range. 320 is the width WCAG 2.2 requires content to work at; 1280 is the window WCAG pairs with it at 400 % zoom.

### Sizes in, rem out

You give sizes in CSS pixels, and the library writes them in `rem`, so that text follows the font size a reader sets in their browser. Values are rounded to 4 decimal places, the fewest that keep every length within the finest unit browsers lay out in.

### What the library guarantees

- **Text can be enlarged to 200 %**, as WCAG 2.2 requires, in every major browser. Page zoom also narrows the viewport, which shrinks fluid text and cancels part of the zoom. Safari zooms to 300 % at most, so no step may grow more than 8/5 from the narrowest to the widest viewport. Steps that would grow more are left out of the scale.
- **No text is smaller than 12 px**, the smallest size the major design systems use. Steps below it are left out.
- **No step shrinks on wider screens.** Small text never gets smaller as the viewport grows.

Because of the 8/5 limit, the faster body text grows, the fewer large headings fit. With 16 px body text on every screen, the same factors give steps 0 to 11 and headings up to 186 px; with 20 px on wide screens, steps −1 to 6 and headings up to 76 px.

## Choosing the options

| Option                | Meaning                                  | Allowed                                 |
| --------------------- | ---------------------------------------- | --------------------------------------- |
| `minimumFactor`       | Ratio between steps at 320 px            | A fraction greater than 1               |
| `maximumFactor`       | Ratio between steps at 1280 px           | A fraction greater than `minimumFactor` |
| `maximumBodyFontSize` | Body text size at 1280 px, in CSS pixels | From 16 to 25.6                         |

Common factors come from musical intervals: 6/5 (minor third), 5/4 (major third), 4/3 (perfect fourth). A larger difference between the two factors makes headings grow more than body text on wide screens.

`Typography.scale` returns a `Result`. Invalid options fail with a `SchemaError` that names the field:

```ts
Typography.scale({
  minimumFactor: Fraction.make(6, 5),
  maximumFactor: Fraction.make(5, 4),
  maximumBodyFontSize: 30,
});
// Failure: Expected a value less than or equal to 25.6
//   at ["maximumBodyFontSize"]
```

## API

| Module       | Exports                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `Viewport`   | `minimumViewportWidth`, `viewportWidthFactor`, `maximumViewportWidth`, `maximumPageZoomFactor`                      |
| `Typography` | `defaultFontSize`, `minimumFontSize`, `textScaleFactor`, `maximumTextGrowthFactor`, `ScaleOptions`, `Step`, `scale` |
| `Fluid`      | `clamp(minimumSize, maximumSize)`: a CSS `clamp()` that grows across the viewport range                             |
| `Length`     | `rem(size)`, `vw(size)`, `layoutUnit`, `decimalPlaces`                                                              |
| `Fraction`   | `make`, `fromNumber`, `one`, `multiply`, `divide`, `pow`, comparisons, `format`, `toNumber`                         |

`Fluid.clamp` also works for any other length that should grow with the viewport, such as spacing:

```ts
Fluid.clamp(16, 24); // 'clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)'
```

Every exported value documents what it is and where it comes from, so your editor shows the reasoning on hover.

## License

MIT
