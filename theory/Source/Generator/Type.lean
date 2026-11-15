import ExportTypeScript
import Lean.Meta.Basic

/-!
# Type

The module defines the type of TypeScript that a type of the theory takes: `Rational.Rational` for a rational number, `Option.Option` for an option, `ReadonlyArray` for an array or a list, a function type for a function type of the theory, and the name of a declaration marked `export_typescript` for the type that the declaration defines. Every other type has no type of TypeScript, and the generator refuses it.

## Implementation Notes

The types of TypeScript name the modules `Rational` and `Option` of Effect, as the packages of the repository compute with Effect.

A function type takes every parameter by its name in the theory, as TypeScript names every parameter of a function type, so the generator refuses a parameter that the theory leaves unnamed, such as the parameter of `Rat → Rat`.
-/

namespace Generator

mutual

/-- Gives the type of TypeScript that a type of the theory takes, or fails with the reason where the type has none. -/
partial def typeOf (type : Lean.Expr) : Lean.MetaM String := do
  match type with
  | .forallE .. => functionOf [] type
  | .const ``Rat _ => return "Rational.Rational"
  | .app (.const ``Option _) element => return s!"Option.Option<{← typeOf element}>"
  | .app (.const ``Array _) element => return s!"ReadonlyArray<{← typeOf element}>"
  | .app (.const ``List _) element => return s!"ReadonlyArray<{← typeOf element}>"
  | .const name _ =>
    unless ExportTypeScript.tagAttribute.hasTag (← Lean.getEnv) name do
      Lean.throwError m!"`{name}` has no declaration in TypeScript, as the theory never marks it `export_typescript`."
    match name with
    | .str _ last => return last
    | _ => Lean.throwError m!"`{name}` ends in no word that names a type in TypeScript."
  | _ => Lean.throwError m!"`{type}` has no type in TypeScript."

/-- Gives the function type of TypeScript that a function type of the theory takes, with the parameters already written before the rest of the type. -/
partial def functionOf (parameters : List String) (type : Lean.Expr) : Lean.MetaM String := do
  match type with
  | .forallE name domain body .default =>
    if body.hasLooseBVars then
      Lean.throwError m!"`{type}` has no type in TypeScript, as its result depends on its parameter `{name}`."
    if name.isAnonymous || name.hasMacroScopes then
      Lean.throwError m!"`{type}` has no type in TypeScript, as TypeScript names every parameter and the theory names none."
    functionOf (parameters ++ [s!"{name}: {← typeOf domain}"]) body
  | .forallE name .. =>
    Lean.throwError m!"`{type}` has no type in TypeScript, as its parameter `{name}` is not explicit."
  | _ => return s!"({", ".intercalate parameters}) => {← typeOf type}"

end

end Generator
