module

meta import Translator.Target.Effect.Declaration
meta import Translator.Target.TypeScript.Print

/-!
# Declaration

The module defines the checks of the declarations of Effect that the declarations of the core
take: a structure of data as a branded schema, its type, and its constructor, a refinement as the
schema of its base with the filter of a condition from the module of checks, a type alias with the
variance of its type parameter, a value of a structure of its module, and a functor as a type lambda
whose instance takes no declaration of its own.

## Implementation Notes

The checks compare the printed declarations with the text that the translator writes by
`#guard_msgs` on `#eval`, as `#guard` emits no message on success, which the linter
`linter.hashCommand` of Mathlib refuses.
-/

open Translator Translator.Effect

/--
info: /** A schema of a coordinate. */
export const Coordinate = Schema.Struct({
/** The value of the coordinate. */
value: Schema.Rational,
}).pipe(Schema.brand('Coordinate'));

/** A coordinate. */
export type Coordinate = typeof Coordinate.Type;

/** Brands a coordinate. */
export const make = Brand.nominal<Coordinate>();

/** A schema of a filename. */
export const Filename = Schema.String.pipe(Schema.check(Schema.makeFilter(isFilename)), Schema.brand('Filename'));

/** A filename. */
export type Filename = typeof Filename.Type;

/** A shelf of items. */
export type Shelf<out Item> = Option.Option<Item>;

/** The coordinate at the origin. */
export const origin: Coordinate = make({ value: Rational.makeUnsafe(1n, 2n) });

/** The functor of the shelves. */
export interface ShelfFunctor extends HKT.TypeLambda {
readonly type: Option.Option<this['Target']>;
}
-/
#guard_msgs in
#eval
  let context : Context :=
    { theory := `Fixture, mainModule := `Fixture.Coordinate, channels := false }
  let coordinate : Core.Reference :=
    { declaration := `Coordinate, module := `Fixture.Coordinate, words := ["Coordinate"]
      takesModuleName := true }
  let documentation := fun (text : String) ↦ ({ text, addresses := [] } : Core.Documentation)
  IO.print (TypeScript.Statement.printBlock
    ([Core.Declaration.data coordinate (documentation "A coordinate.")
        (documentation "A schema of a coordinate.") (documentation "Brands a coordinate.")
        [{ name := "value", documentation := documentation "The value of the coordinate."
           type := .rational }],
      .refinement
        { declaration := `Filename, module := `Fixture.Coordinate, words := ["Filename"] }
        (documentation "A filename.") (documentation "A schema of a filename.") .string
        { declaration := `isFilename, module := `Fixture.Filename, words := ["IsFilename"] },
      .alias { declaration := `Shelf, module := `Fixture.Coordinate, words := ["Shelf"] }
        (documentation "A shelf of items.") [{ name := "Item", kind := .type, default := none }]
        (.option (.parameter "Item")),
      .value { declaration := `origin, module := `Fixture.Coordinate, words := ["Origin"] }
        (documentation "The coordinate at the origin.") (.named coordinate [] [])
        (.structure coordinate [("value", .rational 1 2)]),
      .lambda
        { declaration := `shelfFunctor, module := `Fixture.Coordinate, words := ["ShelfFunctor"] }
        (documentation "The functor of the shelves.") [] (.option .target),
      .instance
        { declaration := `shelfFunctor, module := `Fixture.Coordinate, words := ["ShelfFunctor"] }
        (documentation "The instance of the functor of the shelves.") []].flatMap
      (lowerDeclaration context none)))
