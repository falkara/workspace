/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Translator.Core.Specification
public import Translator.Lean.Elaborate.Type
public import Translator.Lean.Reify.Declaration
public import Translator.Target.TypeScript.Syntax

import Translator.Export
import Translator.Lean.Elaborate.Declaration
import Translator.Lean.Elaborate.Theorem
import Translator.Lean.Reify.Theorem
import Translator.Lean.Reify.Vector
import Translator.Path
import Translator.Target.Effect.Contract
import Translator.Target.Effect.Schema
import Translator.Target.Effect.Test
import Translator.Target.Effect.Vector
import Translator.Target.TypeScript.Imports
import Translator.Target.TypeScript.Print

/-!
# Main

The module defines the program `translator`, which writes the declarations that the theory of a
package gives a counterpart in TypeScript into files of TypeScript, a file for every module of the
theory, as a composition of the phases of the translator: it reads a module of the theory into
trees, translates the trees into the core, lowers the core into the declarations of Effect and the
contract of the module, and prints them with the imports that they name.
The program takes the directory of the theory of the package, such as `Presentation` for
`Falkara/Presentation`, and the directory of the source of the package, and writes the
declarations of every module of the theory, such as
`Falkara/Presentation/Colorimetry/Tristimulus.lean`, into the file of the path that the module
`Path` gives in the directory of the source, such as `Colorimetry/Tristimulus.theory.ts`, named
without the namespace of the package, such as `Falkara.Presentation`, as the folders of the theory
order its files and its namespace orders its names, as Mathlib keeps them apart. A file imports from
Effect the modules its declarations name, `Brand`, `Schema`, and every module whose function a value
calls, such as `Rational.fromBigInt`, as values and every other module as a type, and every other
module of the theory whose declarations it names as a namespace after the last word of the module,
such as `import type * as Functor from '#src/Functor.theory';`, as a value where a schema names one
of its declarations and as a type otherwise. A file whose module defines a refinement imports the
condition of the refinement as a value from the module of checks that the package keeps beside the
module of the package, such as `Filename.check.ts`. A file whose module defines functions or
functors ends with a contract, which names the module of the package beside the file as a type. The
program writes the theorems of a module that the theory gives a counterpart in TypeScript into the
file of tests of the same name, such as `Colorimetry/Tristimulus.theory.test.ts`, as the translator
reads a theorem into a tree under its variables, translates it into a specification of the core,
and lowers the specification into a test of Effect. Before it writes a file, the program fails with
a reason for every comment that the attribute `counterpart` gives a declaration under a role whose
function the translator never derives from it, such as `constructor` on a function, and it fails at
a declaration that lacks the comment of a function the translator derives from it. The program then
checks the module of the package beside every file, such as `Colorimetry/Tristimulus.ts`, by the
module `Export`, and fails with a reason for every declaration that the module leaves out of its
re-exports and every implementation whose comment differs from the theory.

## Implementation Notes

The program writes a file for every module of the theory rather than for every module of the
package, so that the package keeps a module of its own beside every module of the theory, as Effect
keeps a module for every data type.

A file takes the suffix `.theory.ts`, which names what the file holds, the declarations of the
theory, which the module of the package re-exports, rather than how the file comes about; its
header and the file `.gitattributes` mark it as generated. The header names the translator and the
module of the theory that the file comes from.

The imports of a file follow from the names that its declarations name alone, so a file imports
exactly what it names.

The rules of the translator lie in a module of their own, `Falkara.Translation.Rules`, which no
module of the theory imports, so the program imports it beside the theory.
-/

public section

namespace Translator

open Translator.Lean

/-- Runs a computation of the translator in an environment, as a program runs it. -/
def runIn {α : Type} (environment : Lean.Environment) (computation : Lean.MetaM α) : IO α := do
  let (value, _) ← (computation.run' {} {}).toIO
    { fileName := "", fileMap := default } { env := environment }
  return value

/-- Gives the context of a translation into the core: the rules of the translator and the
declaration that labels the identity functor, where the theory gives one a counterpart. -/
def contextOf (packageNamespace : Lean.Name) : Lean.MetaM Elaborate.Context := do
  let rules ← rulesOf
  return {
    rules
    identity := ← (identityLabelOf? (← Lean.getEnv) rules).mapM
      (declarationReferenceOf packageNamespace) }

/-- Gives the declarations of the core that a declaration of the theory takes, where the theory
gives it a counterpart in TypeScript, or fails with the reason where the declaration has none. -/
def declarationsOf (packageNamespace name : Lean.Name) :
    Lean.MetaM (List (Core.Declaration Core.TypeTerm Core.Argument Core.Schema)) := do
  let trees ← reifyDeclaration packageNamespace name
  match trees.mapM (Declaration.toCore (← contextOf packageNamespace)) with
  | .ok declarations => return declarations
  | .error refusal => Lean.throwError refusal.render

/-- Gives the declaration of TypeScript that a declaration of the theory takes, where the theory
gives it a counterpart in TypeScript, named without the namespace of its module, or fails with the
reason where the declaration has none. -/
def declarationOf (packageNamespace name : Lean.Name) : Lean.MetaM String := do
  let declarations ← declarationsOf packageNamespace name
  let functorClass ← (← functorClassOf).mapM (declarationReferenceOf packageNamespace)
  return TypeScript.Statement.printBlock (declarations.flatMap (Effect.lowerDeclaration
    { theory := packageNamespace, mainModule := (← Lean.getEnv).mainModule, channels := false }
    functorClass))

/-- Gives the type of TypeScript that a type of the theory takes, as the translator reads it into a
tree, translates it into the core, and lowers it into Effect, or fails with the reason where the
type has none. -/
def typeOf (packageNamespace : Lean.Name) (type : Lean.Expr) : Lean.MetaM String := do
  let context ← contextOf packageNamespace
  let tree ← reify { rules := context.rules, packageNamespace, target := none } (fuelOf type) type
  match tree.toType context with
  | .ok elaborated =>
    return (Effect.lowerType
      { theory := packageNamespace, mainModule := (← Lean.getEnv).mainModule, channels := false }
      elaborated).print
  | .error refusal => Lean.throwError refusal.render

/-- Gives the schema of Effect that a type of data of the theory takes, as the translator reads the
type into a tree, translates it into a schema of the core, and lowers it into Effect, or fails with
the reason where the type has none. -/
def schemaOf (packageNamespace : Lean.Name) (type : Lean.Expr) : Lean.MetaM String := do
  let context ← contextOf packageNamespace
  let tree ← reify { rules := context.rules, packageNamespace, target := none } (fuelOf type) type
  match tree.toSchema context with
  | .ok schema =>
    return (Effect.lowerSchema
      { theory := packageNamespace, mainModule := (← Lean.getEnv).mainModule, channels := false }
      schema).print
  | .error refusal => Lean.throwError refusal.render

/-- Gives the roles of the functions that the translator derives from a declaration of a kind, in
the order of `ExportTypeScript.Derived.order`: the schema and the constructor of a structure of
data, the constructor of any other structure and of a bundled structure, the schema of a
refinement, the constructor and the axioms of a class of functors, and the instance of a functor, a
curried functor, and a type constructor. -/
def derivedOf : DeclarationKind → List Falkara.ExportTypeScript.Derived
  | .dataStructure => [.schema, .constructor]
  | .structure | .bundled => [.constructor]
  | .refinement .. => [.schema]
  | .functorClass => [.constructor, .axioms]
  | .functor | .curriedFunctor | .typeConstructor => [.instance]
  | .type | .function | .value => []

/-- Gives a refusal for every comment that the attribute `counterpart` gives a declaration of the
theory under a role whose function the translator never derives from the declaration, such as a
constructor of a function. -/
def surplusOf (name : Lean.Name) : Lean.MetaM (List Refusal) := do
  let environment ← Lean.getEnv
  -- A theorem takes a test and no declaration, so the translator derives no function from it.
  let derived ← if environment.find? name matches some (.thmInfo _) then pure [] else
    derivedOf <$> kindOf name
  return (Falkara.ExportTypeScript.Derived.order.filter fun role ↦ !derived.contains role &&
    (Falkara.ExportTypeScript.derivedCommentOf? environment name role).isSome).map
      (.surplusComment name)

/-- Gives the module of the core that a module of the theory of a package takes, with every
declaration that the theory gives a counterpart in TypeScript, or fails with the reason of the first
declaration without one. -/
def coreModuleOf (packageNamespace module : Lean.Name) :
    Lean.MetaM (Core.Module Core.TypeTerm Core.Argument Core.Schema) := do
  -- The module names the declarations of its own module alone and every other after the namespace
  -- of its module.
  Lean.withEnv ((← Lean.getEnv).setMainModule module) do
  let trees ← reifyModule packageNamespace module
  match Module.toCore (← contextOf packageNamespace) trees with
  | .ok core => return core
  | .error refusal => Lean.throwError refusal.render

/-- Gives the file of TypeScript that holds the declarations of a module of the core of the theory
of a package. -/
def printedFileOf (theory : Lean.Name)
    (core : Core.Module Core.TypeTerm Core.Argument Core.Schema) : String :=
  let statements := Effect.lowerModule
    { theory, mainModule := core.module, channels := false } (pathOf theory core.module) core
  TypeScript.Module.print {
    header := s!"Written by the translator from `{core.module}`, so every change by hand is lost \
      when the translator runs."
    imports := TypeScript.importsOf (statements.flatMap TypeScript.Statement.symbols)
    statements }

/-- Gives the file of TypeScript that holds the declarations of a module of the theory of a package
that the theory gives a counterpart in TypeScript, named without the namespace of the package. -/
def fileOf (theory packageNamespace module : Lean.Name) : Lean.MetaM String := do
  return printedFileOf theory (← coreModuleOf packageNamespace module)

/-- Gives the test of TypeScript that a theorem of the theory takes, where the theory gives it a
counterpart in TypeScript, given the namespaces of the theory and of the package, or fails with the
reason where the theorem has none. -/
def testOf (theory packageNamespace name : Lean.Name) : Lean.MetaM TypeScript.Statement := do
  let rules ← rulesOf
  reifyTheorem packageNamespace name fun tree ↦ do
    let specification ← tree.toSpecification
      { rules, streams := [], unavailable := Target.unavailableOf Effect.rule }
    Effect.lowerSpecification theory specification

/-- Gives the file of tests of TypeScript that holds the tests of the theorems of a module of the
theory of a package, which imports the modules of the package that the tests name in the order of
the modules of the theory. -/
def testFileOf (theory module : Lean.Name) (packageNamespace : Lean.Name)
    (theorems : List Lean.Name) : Lean.MetaM String := do
  let moduleNames := (← Lean.getEnv).header.moduleNames.toList
  let tests ← theorems.mapM (testOf theory packageNamespace)
  return TypeScript.Module.print (Effect.testModuleOf
    s!"Written by the translator from `{module}`, so every change by hand is lost when the \
      translator runs."
    (pathOf theory module)
    (fun path ↦ (moduleNames.findIdx? (pathOf theory · == path)).getD moduleNames.length)
    tests)

/-- Gives every vector of the rules of the translator in the core, in the order of the primitives,
or fails with the reason where a vector has no term or no value. -/
def vectorsOf : Lean.MetaM (List Core.Vector) := do
  let rules ← rulesOf
  let environment ← Lean.getEnv
  Falkara.Translation.Primitive.all.flatMapM fun primitive ↦
    (Falkara.Translation.vectorsOf environment primitive).mapM fun vector ↦ do
      let (tree, expected) ← reifyVector vector
      match tree.toTerm { rules, streams := [], unavailable := Target.unavailableOf Effect.rule }
          (tree.source.approxDepth.toNat + 256) with
      | .ok term => return { primitive, term, expected }
      | .error refusal => Lean.throwError refusal.render

/-- Gives the file of the tests of every vector of the rules of the translator, or fails with the
reason where a vector has no test. -/
def vectorFileOf : Lean.MetaM String := do
  match (← vectorsOf).mapM Effect.lowerVector with
  | .ok tests =>
    return TypeScript.Module.print (Effect.vectorModuleOf
      "Written by the translator from the vectors of its rules, so every change by hand is lost \
        when the translator runs." tests)
  | .error refusal => Lean.throwError refusal.render

end Translator

/-- Writes a file of TypeScript for every module of the theory of a package into the directory of
the source of the package, and checks the module of the package beside every file. -/
def main (arguments : List String) : IO Unit := do
  let [directoryOfTheory, directory] := arguments
    | throw (IO.userError (← (Translator.Refusal.render .arguments).toString))
  Lean.initSearchPath (← Lean.findSysroot)
  let theory := Lean.Name.mkStr `Falkara directoryOfTheory
  let modules := (← (System.FilePath.mk "Falkara" / directoryOfTheory).walkDir).toList.filterMap
    fun path ↦
      if path.extension == some "lean" then
        some ((path.withExtension "").components.foldl Lean.Name.mkStr .anonymous)
      else none
  -- The rules of the translator and their vectors lie in modules of their own, which the theory
  -- never imports.
  let environment ← Lean.importModules
    ((modules ++ [`Falkara.Translation.Rules, `Falkara.Translation.Vectors]).map
      ({ module := · })).toArray {}
  let sources := modules.map (Translator.Lean.Source.moduleOf environment)
  -- A comment under a role whose function the translator never derives fails the program before
  -- it writes a file, as no file takes the comment.
  let surplus ← Translator.runIn environment (sources.flatMapM fun source ↦
    (source.declarations ++ source.theorems).flatMapM Translator.surplusOf)
  unless surplus.isEmpty do
    throw (IO.userError ("\n\n".intercalate (← surplus.mapM (·.render.toString))))
  sources.forM fun source ↦ do
    let module := source.module
    let path := System.FilePath.mk directory / Translator.pathOf theory module
    if !source.declarations.isEmpty then
      if let some parent := path.parent then IO.FS.createDirAll parent
      let core ← Translator.runIn environment (Translator.coreModuleOf theory module)
      IO.FS.writeFile (path.addExtension "theory.ts") (Translator.printedFileOf theory core)
      if ← (path.addExtension "ts").pathExists then
        let mismatches := Translator.mismatchesOf (path.addExtension "ts").toString
          s!"#src/{Translator.pathOf theory module}.theory"
          (← IO.FS.readFile (path.addExtension "ts"))
          (core.declarations.flatMap Translator.reexportsOf)
          (core.declarations.flatMap (Translator.implementationsOf core.functorClass))
        unless mismatches.isEmpty do
          throw (IO.userError ("\n\n".intercalate (← mismatches.mapM (·.render.toString))))
    if !source.theorems.isEmpty then
      let text ← Translator.runIn environment
        (Translator.testFileOf theory module theory source.theorems)
      IO.FS.writeFile (path.addExtension "theory.test.ts") text
  -- Every package computes by the rules of Effect, so every package checks them by their vectors.
  IO.FS.writeFile (System.FilePath.mk directory / "Translation.test.ts")
    (← Translator.runIn environment Translator.vectorFileOf)
