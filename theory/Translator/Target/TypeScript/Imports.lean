/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Target.TypeScript.Syntax

/-!
# Imports

The module defines the imports of a file of TypeScript, as a fold over its syntax: every symbol of
the syntax names its module, as a type alone where it stands in a type and as a value where it
stands in an expression, and the file imports every module that its symbols name, as a value where
one of them names the module as a value. A file imports the modules of Effect by name in one
group, and the modules of the package in another, sorted by their paths: every module of the
theory as a namespace after the last word of the module, such as
`import type * as Functor from '#src/Functor.theory';`, every module of checks by the names of its
conditions, and the module of the package beside the file as the namespace `Module`.

## Implementation Notes

The modules follow from the symbols of the syntax rather than from the written text, so a comment
or a string whose text holds the name of a module imports no module, and no name stands in a file
that leaves its module unimported.

The imports of the package take the order of their paths, as oxfmt sorts them, so that the header
of the file stays above the import it opens with.

The module of the package is imported as a type alone, as the contract names it in a type alone,
so the module of the package and the file import each other only as types.
-/

public section

namespace Translator.TypeScript

/-- A way that a file names a module of Effect. -/
inductive Usage where
  /-- A name of a value of the module, such as `Rational.fromBigInt`. -/
  | value
  /-- A name of a type of the module alone, such as `Rational.Rational`. -/
  | type
  deriving Repr, DecidableEq

/-- Gives the symbol that a name of a type holds, as a type alone, where it holds one. -/
def TypeName.symbols : TypeName → List (Symbol × Usage)
  | .symbol imported => [(imported, .type)]
  | .identifier _ | .qualified .. => []

mutual

/-- Gives the symbols of a type in order, each as a type alone. -/
def TypeExpression.symbols : TypeExpression → List (Symbol × Usage)
  | .keyword _ | .literal _ | .this => []
  | .reference name arguments => name.symbols ++ arguments.flatMap TypeExpression.symbols
  | .indexed whole index => whole.symbols ++ index.symbols
  | .tuple elements | .union elements => elements.flatMap TypeExpression.symbols
  | .object members => members.flatMap Member.symbols
  | .function typeParameters parameters result =>
    typeParameters.flatMap TypeParameter.symbols ++ parameters.flatMap Parameter.symbols ++
      result.symbols
  | .query name => name.symbols

/-- Gives the symbols of a member of an interface or of a type of objects in order. -/
def Member.symbols : Member → List (Symbol × Usage)
  | .property _ _ type => type.symbols
  | .call typeParameters parameters result =>
    typeParameters.flatMap TypeParameter.symbols ++ parameters.flatMap Parameter.symbols ++
      result.symbols

/-- Gives the symbols of the type that a parameter annotates. -/
def Parameter.symbols : Parameter → List (Symbol × Usage)
  | .mk _ none => []
  | .mk _ (some type) => type.symbols

/-- Gives the symbols of the constraint and the default type of a type parameter in order. -/
def TypeParameter.symbols : TypeParameter → List (Symbol × Usage)
  | .mk _ _ constraint default =>
    (match constraint with
      | some constraint => constraint.symbols
      | none => []) ++
    match default with
      | some default => default.symbols
      | none => []

end

mutual

/-- Gives the symbols of an expression in order, each of its own as a value and each of its types
as a type alone. -/
def Expression.symbols : Expression → List (Symbol × Usage)
  | .identifier _ | .literal _ => []
  | .symbol imported => [(imported, .value)]
  | .member whole _ | .not whole | .parenthesized whole => whole.symbols
  | .element whole index => whole.symbols ++ index.symbols
  | .call callee arguments => callee.symbols ++ arguments.flatMap Expression.symbols
  | .instantiation generic typeArguments =>
    generic.symbols ++ typeArguments.flatMap TypeExpression.symbols
  | .arrow typeParameters parameters _ result body =>
    typeParameters.flatMap TypeParameter.symbols ++ parameters.flatMap Parameter.symbols ++
      (match result with
        | some result => result.symbols
        | none => []) ++
      body.symbols
  | .object properties => properties.flatMap Property.symbols
  | .array elements => elements.flatMap Expression.symbols

/-- Gives the symbols of the value of a property. -/
def Property.symbols : Property → List (Symbol × Usage)
  | .mk _ _ value => value.symbols

/-- Gives the symbols of the body of an arrow function in order. -/
def Body.symbols : Body → List (Symbol × Usage)
  | .expression inner => inner.symbols
  | .block statements => statements.flatMap Statement.symbols

/-- Gives the symbols of a statement in order. -/
def Statement.symbols : Statement → List (Symbol × Usage)
  | .constant _ _ _ type value =>
    (match type with
      | some type => type.symbols
      | none => []) ++
    value.symbols
  | .typeAlias _ _ _ typeParameters type =>
    typeParameters.flatMap TypeParameter.symbols ++ type.symbols
  | .interface _ _ _ typeParameters extended members =>
    typeParameters.flatMap TypeParameter.symbols ++
      (match extended with
        | some extended => extended.symbols
        | none => []) ++
      members.flatMap Member.symbols
  | .expression _ inner | .returnIf inner => inner.symbols

end

/-- Gives the symbols of a module in order. -/
def Module.symbols (module : Module) : List (Symbol × Usage) :=
  module.statements.flatMap Statement.symbols

/-- Gives the modules of Effect that a file imports from the symbols it names, sorted by name, each
as a value where one of the symbols names the module as a value. -/
def effectImportsOf (symbols : List (Symbol × Usage)) : List (String × Usage) :=
  let modules := symbols.filterMap fun
    | (.effect qualifier _, usage) => some (qualifier, usage)
    | _ => none
  (modules.map Prod.fst).eraseDups.mergeSort (fun first second ↦ decide (first ≤ second)) |>.map
    fun module ↦ (module, if modules.contains (module, .value) then .value else .type)

/-- Gives the imports of a file from the symbols it names, in two groups: the import of the modules
of Effect, by name and as types alone where no symbol names them as values, and the imports of the
modules of the package, sorted by their paths: every module of the theory as a namespace, as a type
alone where no symbol names it as a value, every module of checks by the names of its conditions,
and the module of the package as the namespace `Module`, as a type alone. -/
def importsOf (symbols : List (Symbol × Usage)) : List (List Import) :=
  let effect := effectImportsOf symbols
  let effectImport : List Import := if effect.isEmpty then [] else
    if effect.any (·.2 == .value) then
      [.named false (effect.map fun (module, usage) ↦ ⟨usage == .type, module⟩) "effect"]
    else [.named true (effect.map fun (module, _) ↦ ⟨false, module⟩) "effect"]
  let theories := (symbols.filterMap fun
    | (.theory qualifier path _, usage) => some (qualifier, path, usage)
    | _ => none)
  let theoryImports := (theories.map fun (qualifier, path, _) ↦ (qualifier, path)).eraseDups.map
    fun (qualifier, path) ↦ (s!"#src/{path}.theory",
      Import.namespaced (!theories.contains (qualifier, path, .value)) qualifier
        s!"#src/{path}.theory")
  let checks := symbols.filterMap fun
    | (.check path member, _) => some (path, member)
    | _ => none
  let checkImports := (checks.map Prod.fst).eraseDups.map fun path ↦
    (s!"#src/{path}.check", Import.named false
      ((checks.filter (·.1 == path)).map (fun (_, member) ↦ ⟨false, member⟩)).eraseDups
      s!"#src/{path}.check")
  let moduleImports := (symbols.filterMap fun
    | (.module path, _) => some path
    | _ => none).eraseDups.map fun path ↦
      (s!"#src/{path}", Import.namespaced true "Module" s!"#src/{path}")
  let packageImports := (theoryImports ++ checkImports ++ moduleImports).mergeSort
    fun first second ↦ decide (first.1 ≤ second.1)
  [effectImport, packageImports.map Prod.snd]

/-- Gives the imports of a file of tests from the symbols it names, in two groups: the functions of
the tests of `@effect/vitest` and the modules of Effect, by name and as values, as a test calls
them, and every module of the package as a namespace, as a value, in the order that a rank gives
their paths. -/
def testImportsOf (rank : String → Nat) (symbols : List (Symbol × Usage)) : List (List Import) :=
  let effect := (effectImportsOf symbols).map Prod.fst
  let effectImport : List Import := if effect.isEmpty then [] else
    [.named false (effect.map fun module ↦ ⟨false, module⟩) "effect"]
  let packages := (symbols.filterMap fun
    | (.package qualifier path _, _) => some (qualifier, path)
    | _ => none).eraseDups.mergeSort fun first second ↦ rank first.2 ≤ rank second.2
  [.named false [⟨false, "describe"⟩, ⟨false, "expect"⟩, ⟨false, "it"⟩] "@effect/vitest" ::
      effectImport,
    packages.map fun (qualifier, path) ↦ .namespaced false qualifier s!"#src/{path}"]

end Translator.TypeScript
