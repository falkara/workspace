/**
 * Graphemes the terminal draws in two cells.
 *
 * Expressed as Unicode *properties* rather than as a table of codepoint ranges.
 * A hand-written table is a snapshot: it is wrong the moment Unicode assigns
 * another block, and being wrong is silent — the box simply stops closing. These
 * properties are maintained by the engine, so the answer improves with the
 * runtime instead of drifting from it.
 *
 * `Emoji_Presentation` rather than `Extended_Pictographic`, which is the wider
 * and more obvious property and the wrong one: `©`, `®`, `™` and `☀` are
 * pictographic but default to text presentation and occupy one cell.
 *
 * The regional indicators are listed because a flag is a *pair* of them, and
 * `Intl.Segmenter` hands the pair over as one grapheme beginning with a
 * codepoint that carries no emoji property of its own.
 *
 * What remains as ranges is the part Unicode exposes no property for: the East
 * Asian Wide and Fullwidth forms, and CJK punctuation.
 */
const wide =
  /^(?:\p{Emoji_Presentation}|\p{Script=Han}|\p{Script=Hangul}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Bopomofo}|\p{Script=Yi}|[\u{1F1E6}-\u{1F1FF}\u{3000}-\u{303E}\u{FE10}-\u{FE19}\u{FE30}-\u{FE6F}\u{FF01}-\u{FF60}\u{FFE0}-\u{FFE6}])/u;

/**
 * A pictographic grapheme carrying a variation selector that asks for emoji
 * presentation, such as `❤️` — `U+2764` followed by `U+FE0F`. The base character
 * is one cell on its own and two once the selector applies, so the selector has
 * to be looked for across the grapheme rather than at the start of it.
 */
const pictographic = /^\p{Extended_Pictographic}/u;
const emojiPresentationSelector = /\u{FE0F}/u;

/**
 * Graphemes that occupy none: a combining mark or a zero-width control, which
 * the terminal draws onto whatever came before it. Written as escapes because a
 * literal here would be invisible in source.
 */
const zeroWidth = /^[\p{M}\u{200B}-\u{200F}\u{FEFF}]/u;

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

const cellsFor = (grapheme: string): number => {
  if (zeroWidth.test(grapheme)) {
    return 0;
  }
  if (wide.test(grapheme)) {
    return 2;
  }
  return pictographic.test(grapheme) && emojiPresentationSelector.test(grapheme) ? 2 : 1;
};

/**
 * How many cells a string occupies when a terminal draws it.
 *
 * `String.length` counts UTF-16 code units, which is neither what the terminal
 * draws nor what the reader sees: an emoji is two units and two cells, while
 * `e` followed by a combining accent is two units and one cell. Anything laying
 * text out in a fixed-width box has to count what is drawn, or the box does not
 * close.
 *
 * Escape sequences are not accounted for, because they are not text: styling is
 * applied after layout precisely so that its bytes never reach this.
 */
export const displayWidth = (value: string): number => {
  let width = 0;
  for (const { segment } of graphemes.segment(value)) {
    width += cellsFor(segment);
  }
  return width;
};

/** Lays a string out inside a field of the given cell width. */
export const centre = (value: string, width: number): string => {
  const spare = Math.max(0, width - displayWidth(value));
  const left = Math.floor(spare / 2);
  return `${' '.repeat(left)}${value}${' '.repeat(spare - left)}`;
};
