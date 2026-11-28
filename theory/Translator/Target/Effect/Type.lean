/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Type
public import Translator.Target.TypeScript.Syntax

import Translator.Path
import Translator.Target.TypeScript.Name

/-!
# Type

The module defines the type of TypeScript that a type of the core takes in Effect:
`Rational.Rational` for a rational number, `string` for a string, `boolean` for a boolean, `void`
for the type of one value, `this['Target']` for the object of a type lambda, `Option.Option` for an
option, `ReadonlyArray` for an array, `Stream.Stream` for a stream and a sequence, a read-only tuple
for a product without a presentation and a record for one with it, `Result.Result` for a sum,
`Effect.Effect` for a computation, `HKT.Kind` for the object of a type constructor, the name of a
declaration with its arguments, and a function type, and the type lambda of Effect that a type
constructor takes: its name, the type lambda of the label of the identity functor,
`Option.OptionTypeLambda` for the options, and the name of a declaration with its arguments.

## Implementation Notes

A declaration takes its name in Pascal case, after the namespace of its module where another module
declares it, as a file imports every other module as a namespace, such as `Functor.Comp`.

A binary sum is a result of Effect, which succeeds with a value of the right summand, the one a
computation goes on with, and fails with a value of the left.

A stream of a function that takes a stream carries the failure `E` and the requirements `R` of the
streams the function takes, as `Stream.map` of Effect carries them, where the context asks for the
channels, and its elements carry none.
-/

public section

namespace Translator.Effect

/-- What a lowering of a type knows beyond the type: the theory of the package, after whose
namespace the modules take their paths, the module of the theory being written, whose declarations
take their names alone, and whether a stream carries the channels `E` and `R`. -/
structure Context where
  /-- The namespace of the theory of the package. -/
  theory : Lean.Name
  /-- The module of the theory being written. -/
  mainModule : Lean.Name
  /-- Whether a stream carries the channels `E` and `R`. -/
  channels : Bool

/-- Gives the name of TypeScript that a reference takes in a file of a module of the theory: its
words in Pascal case, as a symbol of its module where the module is another, which the file
imports as a namespace after the last word of the module. -/
def nameOf (context : Context) (reference : Core.Reference) : TypeScript.TypeName :=
  match reference.module with
  | .str _ last =>
    if reference.module == context.mainModule then
      .identifier (TypeScript.pascalCaseOf reference.words)
    else .symbol (.theory last (pathOf context.theory reference.module)
      (TypeScript.pascalCaseOf reference.words))
  | _ => .identifier (TypeScript.pascalCaseOf reference.words)

mutual

/-- Gives the type of TypeScript that a type of the core takes. -/
def lowerType (context : Context) : Core.TypeTerm → TypeScript.TypeExpression
  | .rational => .reference (.symbol (.effect "Rational" "Rational")) []
  | .string => .keyword .string
  | .boolean => .keyword .boolean
  | .unit => .keyword .void
  | .parameter name => .reference (.identifier name) []
  | .target => .indexed .this (.literal (.string "Target"))
  | .option element => .reference (.symbol (.effect "Option" "Option")) [lowerType context element]
  | .array element => .reference (.identifier "ReadonlyArray") [lowerType context element]
  | .stream element | .sequence element =>
    .reference (.symbol (.effect "Stream" "Stream"))
      (lowerType { context with channels := false } element ::
        if context.channels then [.reference (.identifier "E") [], .reference (.identifier "R") []]
        else [])
  | .product none fields => .tuple ((fields.map (lowerNamedType context)).map (·.2))
  | .product (some _) fields =>
    .object ((fields.map (lowerNamedType context)).map fun (name, type) ↦ .property none name type)
  | .sum left right =>
    .reference (.symbol (.effect "Result" "Result"))
      [lowerType context right, lowerType context left]
  | .effect success failure requirements =>
    .reference (.symbol (.effect "Effect" "Effect"))
      [lowerType context success, lowerType context failure, lowerType context requirements]
  | .apply constructor argument =>
    .reference (.symbol (.effect "HKT" "Kind"))
      [lowerConstructor context constructor, .keyword .never, .keyword .never, .keyword .never,
        lowerType context argument]
  | .named reference arguments _ =>
    .reference (nameOf context reference) (arguments.map (lowerArgument context))
  | .function typeParameters parameters result =>
    .function (typeParameters.map fun name ↦ .mk .inferred name none none)
      ((parameters.map (lowerNamedType context)).map fun (name, type) ↦
        .mk (.identifier name) (some type))
      (lowerType context result)

/-- Gives the type lambda of Effect that a type constructor of the core takes. -/
def lowerConstructor (context : Context) : Core.Constructor → TypeScript.TypeExpression
  | .parameter name => .reference (.identifier name) []
  | .identity label => .reference (nameOf context label) []
  | .option => .reference (.symbol (.effect "Option" "OptionTypeLambda")) []
  | .named reference arguments _ =>
    .reference (nameOf context reference) (arguments.map (lowerArgument context))

/-- Gives the type argument of TypeScript that an argument of the core takes. -/
def lowerArgument (context : Context) : Core.Argument → TypeScript.TypeExpression
  | .type type => lowerType context type
  | .constructor constructor => lowerConstructor context constructor

/-- Gives the name and the type of TypeScript that a field or a parameter of the core takes. -/
def lowerNamedType (context : Context) : Core.NamedType → String × TypeScript.TypeExpression
  | .mk name type => (name, lowerType context type)

end

end Translator.Effect
