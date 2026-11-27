import * as stylex from '@stylexjs/stylex';

// StyleX on the elements of Effect UI. StyleX compiles the styles of an element into class names and, for the values only known as the view runs, inline custom properties; an element builder of Effect UI takes them through its `class`, which adds to the classes it has, and its `style`, which replaces the style it has. All the styles of an element therefore go through one call.

/** As much of an element builder of Effect UI as a style needs, which the builders of HTML and of SVG elements both have: each method gives the builder back with the attribute set. */
export interface Stylable<Element> {
  readonly class: (...tokens: ReadonlyArray<string | false | null | undefined>) => Element;
  readonly style: (style: Readonly<Record<string, string>>) => Element;
}

/** The styles an element is given, as `stylex.props` takes them. */
export type Style = stylex.StyleXArray<
  | null
  | undefined
  | boolean
  | stylex.CompiledStyles
  | Readonly<[stylex.CompiledStyles, stylex.InlineStyles]>
>;

/** An element builder given styles, later ones winning: their class names, and the inline custom properties of the values only known as the view runs, each written as the string CSS reads. */
export const styled = <Element extends Stylable<Element>>(
  builder: Stylable<Element>,
  ...styles: ReadonlyArray<Style>
): Element => {
  const props = stylex.props(...styles);
  const classed = builder.class(props.className);
  return props.style === undefined
    ? classed
    : classed.style(
        Object.fromEntries(
          Object.entries(props.style).map(([name, value]) => [name, String(value)]),
        ),
      );
};
