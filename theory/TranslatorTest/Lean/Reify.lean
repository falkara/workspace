module

meta import Lean.Elab.Term
meta import Translator.Lean.Reify
import Falkara.Counterpart
import Falkara.Translation.Rules

/-!
# Reify

The module defines the checks of the trees that the reading gives the types of the theory: an
option of a rational number as constants without a counterpart, a product as the constant of its
type, a function type with its named parameter, and a declaration that the theory gives a
counterpart with its argument, which takes no default value.

## Implementation Notes

The checks compare the trees with their expected values by `#guard_msgs` on `#eval`, as `#guard`
emits no message on success, which the linter `linter.hashCommand` of Mathlib refuses.
-/

public section

/-- The structure with a type parameter that the checks read. -/
structure Shelf (Item : Type) where
  /-- The item on the shelf. -/
  item : Item

attribute [counterpart
  typescript
    r"The structure with a type parameter that the checks read."
    (item
      r"The item on the shelf.")
    constructor
      r"Creates a shelf from its item."] Shelf

/-- The function whose type the checks read, which tells whether a wavelength is positive. -/
def isVisible (wavelength : Rat) : Bool :=
  decide (0 < wavelength)

/--
info: Translator.Lean.Tree.constant
  `Option
  [Translator.Lean.Tree.constant `Rat [] (Lean.Expr.const `Rat [])]
  (Lean.Expr.app (Lean.Expr.const `Option [Lean.Level.zero]) (Lean.Expr.const `Rat []))
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM Translator.Lean.Tree from do
  let type ← Lean.instantiateMVars (← Lean.Elab.Term.elabType (← `(Option Rat)))
  Translator.Lean.reify
    { rules := ← Translator.Lean.rulesOf, packageNamespace := .anonymous, target := none }
    (Translator.Lean.fuelOf type) type

/--
info: Translator.Lean.Tree.constant
  `Prod
  [Translator.Lean.Tree.constant `Rat [] (Lean.Expr.const `Rat []),
   Translator.Lean.Tree.constant `String [] (Lean.Expr.const `String [])]
  (Lean.Expr.app
    (Lean.Expr.app (Lean.Expr.const `Prod [Lean.Level.zero, Lean.Level.zero]) (Lean.Expr.const `Rat []))
    (Lean.Expr.const `String []))
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM Translator.Lean.Tree from do
  let type ← Lean.instantiateMVars (← Lean.Elab.Term.elabType (← `(Rat × String)))
  Translator.Lean.reify
    { rules := ← Translator.Lean.rulesOf, packageNamespace := .anonymous, target := none }
    (Translator.Lean.fuelOf type) type

/--
info: Translator.Lean.Tree.function
  [Translator.Lean.FunctionParameter.mk
     `wavelength
     (Translator.Lean.Tree.constant `Rat [] (Lean.Expr.const `Rat []))
     (Lean.Expr.forallE `wavelength (Lean.Expr.const `Rat []) (Lean.Expr.const `Bool []) (Lean.BinderInfo.default))]
  (Translator.Lean.Tree.constant `Bool [] (Lean.Expr.const `Bool []))
  (Lean.Expr.forallE `wavelength (Lean.Expr.const `Rat []) (Lean.Expr.const `Bool []) (Lean.BinderInfo.default))
-/
#guard_msgs in
#eval show Lean.MetaM Translator.Lean.Tree from do
  let type := (← Lean.getConstInfo ``isVisible).type
  Translator.Lean.reify
    { rules := ← Translator.Lean.rulesOf, packageNamespace := .anonymous, target := none }
    (Translator.Lean.fuelOf type) type

/--
info: Translator.Lean.Tree.declared
  { declaration := `Shelf, module := `TranslatorTest.Lean.Reify, words := ["Shelf"], takesModuleName := false }
  false
  [Translator.Lean.DeclaredArgument.mk
     (Translator.Lean.Tree.constant `Rat [] (Lean.Expr.const `Rat []))
     false
     (Translator.Lean.Role.required)
     [true]]
  (Lean.Expr.app (Lean.Expr.const `Shelf []) (Lean.Expr.const `Rat []))
-/
#guard_msgs in
#eval show Lean.Elab.TermElabM Translator.Lean.Tree from do
  let type ← Lean.instantiateMVars (← Lean.Elab.Term.elabType (← `(Shelf Rat)))
  Translator.Lean.reify
    { rules := ← Translator.Lean.rulesOf, packageNamespace := .anonymous, target := none }
    (Translator.Lean.fuelOf type) type
