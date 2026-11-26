/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic

import Generator.Comment
import Generator.Declaration
import Generator.Export
import Generator.Path
import Generator.Theorem
import Generator.Type

/-!
# Main

The module defines the program `generator`, which writes the declarations that the theory of a
package gives a counterpart in TypeScript into files of TypeScript, a file for every module of the
theory.
The program takes the directory of the theory of the package, such as `Presentation` for
`Falkara/Presentation`, and the directory of the source of the package, and writes the
declarations of every module of the theory, such as
`Falkara/Presentation/Colorimetry/Tristimulus.lean`, into the file of the path that the module
`Path` gives in the directory of the source, such as `Colorimetry/Tristimulus.theory.ts`, named
without the namespace of the package, such as `Falkara.Presentation`, as the folders of the theory
order its files and its namespace orders its names, as Mathlib keeps them apart. A file imports
from Effect the modules its declarations name, `Brand`, `Schema`, and every module whose function a
value calls, such as `Rational.fromBigInt`, as values and every other module as a type, and every
other module of the theory whose declarations it names as a namespace after the last word of the
module, such as `import type * as Functor from '#src/Functor.theory';`, as a value where a schema
names one of its declarations and as a type otherwise, as Effect imports its modules, so that a
declaration of another module takes the name of its module, such as `Functor.Functor`. A file whose
module defines a refinement imports the condition
of the refinement as a value from the module of checks that the package keeps beside the module of
the package, such as `Filename.check.ts`, which imports no schema. A file whose module defines
functions or functors ends with a contract, an interface that names every function as the module of
the package beside the file exports it, such as `behavior`, and the instance of the class of
functors that every functor takes, such as `functor`, and a type that fails to compile
where that module leaves a function out or gives it another type, as a signature of a module in ML
requires of the module. The program writes the theorems of a module that the theory gives a
counterpart in TypeScript into the file of tests of the same name, such as
`Colorimetry/Tristimulus.theory.test.ts`, by the module `Theorem`. The program then checks the
module of the package beside every file, such as `Colorimetry/Tristimulus.ts`, by the module
`Export`, and fails with a reason for every declaration that the module leaves out of its
re-exports and every implementation whose comment differs from the theory.

## Implementation Notes

The program writes a file for every module of the theory rather than for every module of the
package, so that the package keeps a module of its own beside every module of the theory, as Effect
keeps a module for every data type.

A file takes the suffix `.theory.ts`, which names what the file holds, the declarations of the
theory, which the module of the package re-exports, rather than how the file comes about; its
header and the file `.gitattributes` mark it as generated.

The program writes the declarations of a module in the order of their lines, as the theory states
them.

The contract and its check stay unexported, as they concern the module of the package alone, and
the check takes a name that opens with `_`, as Oxlint takes such a name for a declaration that is
meant to stay unused.
-/

public section

namespace Generator

open Falkara

/-- Runs a computation of the generator in an environment, as a program runs it. -/
def runIn {α : Type} (environment : Lean.Environment) (computation : Lean.MetaM α) : IO α := do
  let (value, _) ← (computation.run' {} {}).toIO
    { fileName := "", fileMap := default } { env := environment }
  return value

/-- Gives the declarations of a module of the theory that the theory gives a counterpart in
TypeScript, its theorems or every other declaration, in the order of their lines. -/
def markedDeclarationsOf (module : Lean.Name) (theorems : Bool) :
    Lean.MetaM (List Lean.Name) := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdx? module | return []
  let some data := environment.header.moduleData[index.toNat]? | return []
  let marked := data.constNames.toList.filter fun name ↦
    ExportTypeScript.isExported environment name &&
      (environment.find? name matches some (.thmInfo _)) == theorems
  let lines ← marked.mapM fun name ↦ do
    return (name, ((← Lean.findDeclarationRanges? name).map (·.range.pos.line)).getD 0)
  return (lines.mergeSort fun first second ↦ first.snd ≤ second.snd).map Prod.fst

/-- Gives the file of TypeScript that holds the declarations of a module of the theory of a package
that the theory gives a counterpart in TypeScript, named without the namespace of the package. -/
def fileOf (theory packageNamespace module : Lean.Name) : Lean.MetaM String := do
  -- The file names the declarations of its own module alone and every other after the namespace of
  -- its module.
  Lean.withEnv ((← Lean.getEnv).setMainModule module) do
  let environment ← Lean.getEnv
  let declarations ← markedDeclarationsOf module false
  let kinds ← declarations.mapM fun name ↦ return (name, ← kindOf name)
  -- A functor and a type constructor, whose functor maps its values, take an instance of the class
  -- of functors, a function that the module of the package implements, as the action of a functor
  -- on morphisms has no value that the generator can write.
  let instances := kinds.filterMap fun
    | (name, .functor) | (name, .curriedFunctor) | (name, .typeConstructor) => some name
    | _ => none
  let ((texts, instanceMembers), records) ← (do
      let texts ← declarations.mapM (declarationOf packageNamespace)
      let members ← instances.mapM fun name ↦ do
        return s!"{← instanceCommentOf packageNamespace name}readonly \
          {← instanceNameOf packageNamespace name}: \
          {← instanceTypeOf packageNamespace name};\n"
      return (texts, members) : TypeScriptM (List String × List String)).run []
  let functorClass ← if instances.isEmpty then pure none else functorClassOf
  let body := "\n".intercalate texts
  let header := s!"// Written by the generator of the theory from `{module}`, so every change by \
    hand is lost when the generator runs.\n"
  -- A schema, a constructor, and a function such as `Rational.fromBigInt` are the values of the
  -- file, so a module the file names otherwise, as `Rational.Rational`, is imported as a type.
  let imports := effectImportsOf records
  let importLine := if imports.isEmpty then "" else if imports.any (·.snd == .value) then
      s!"import \{ {", ".intercalate (imports.map fun (module, usage) ↦
        if usage == .value then module else s!"type {module}")} } from 'effect';\n"
    else s!"import type \{ {", ".intercalate (imports.map Prod.fst)} } from 'effect';\n"
  let fieldConstants := fun (name : Lean.Name) ↦
    (Lean.getStructureFields environment name).toList.flatMap fun field ↦
      ((environment.find? (name ++ field)).map (·.type.getUsedConstants.toList)).getD []
  -- A schema names the schemas of its fields as values, and every other declaration names a
  -- declaration as a type.
  let namedBySchemas := kinds.flatMap fun
    | (name, .dataStructure) => fieldConstants name
    | (_, .refinement base _) => base.getUsedConstants.toList
    | _ => []
  -- A refinement calls its condition in its filter, so the file imports the condition as a value
  -- from the module of checks, which imports no schema, and the module of the package and the file
  -- still import each other only as types.
  let conditions := kinds.filterMap fun
    | (_, .refinement _ condition) => some condition
    | _ => none
  let checkLines ← (conditions.filterMap fun condition ↦
    (environment.getModuleIdxFor? condition).bind fun index ↦
      environment.header.moduleNames[index.toNat]?).eraseDups.mapM
    fun checkModule ↦ do
      let names := conditions.filter fun condition ↦
        ((environment.getModuleIdxFor? condition).bind fun index ↦
          environment.header.moduleNames[index.toNat]?) == some checkModule
      let path := pathOf theory checkModule
      let conditionNames ← names.mapM (valueNameOf packageNamespace)
      return s!"import \{ {", ".intercalate conditionNames} } from '#src/{path}.check';\n"
  -- A bundled structure that extends the label of its structure names the label and the functors of
  -- its value, and any other bundled structure names the types of its fields as TypeScript reads
  -- them, so a declaration that its value names and its fields reduce away is named nowhere.
  let bundledConstants ← kinds.flatMapM fun
    | (name, .bundled) => do
      parametersOf (← Lean.getConstInfo name) fun _ _ value? ↦ do
        let some value := value? | return []
        bundledFieldsOf value fun parameters fields ↦ do
          if (← (extendedOf? packageNamespace name value parameters).run' []).isSome then
            if let some label ← labelOf? name value.getAppFn.constName then
              return label :: value.getUsedConstants.toList
          return fields.flatMap fun (_, fieldType) ↦ fieldType.getUsedConstants.toList
    | _ => return []
  -- An interface names the types of its fields, and a type and a refinement the types of their
  -- values.
  let named := bundledConstants ++ kinds.flatMap fun (name, kind) ↦
    match kind with
    | .dataStructure | .structure => fieldConstants name
    | _ => ((environment.find? name).map fun information ↦
      information.type.getUsedConstants.toList ++
        if kind matches .type | .functor | .curriedFunctor | .functorClass | .typeConstructor |
            .refinement .. then
          (information.value?.map (·.getUsedConstants.toList)).getD []
        else []).getD []
  -- The identity monad `Id` takes the type lambda of the identity functor, which its label gives.
  let identity := if named.contains ``Id then (identityLabelOf? environment).toList else []
  -- The contract names the class of functors in the type of every instance.
  let others := (namedBySchemas ++ named ++ identity ++ functorClass.toList).eraseDups.filter
    fun name ↦
    ExportTypeScript.isExported environment name &&
      (environment.getModuleIdxFor? name).map (·.toNat) !=
        (environment.getModuleIdx? module).map (·.toNat)
  let otherModules := (others.filterMap fun name ↦
    (environment.getModuleIdxFor? name).bind fun index ↦
      environment.header.moduleNames[index.toNat]?).eraseDups
  -- A file imports every other module of the theory as a namespace named after the last word of
  -- the module, as a value where a schema names one of its declarations and as a type otherwise.
  let theoryLines := otherModules.filterMap fun otherModule ↦ do
    let .str _ namespaceName := otherModule | none
    let path := pathOf theory otherModule
    let value := others.any fun name ↦ namedBySchemas.contains name &&
      ((environment.getModuleIdxFor? name).bind fun index ↦
        environment.header.moduleNames[index.toNat]?) == some otherModule
    some s!"import {if value then "" else "type "}* as {namespaceName} from \
      '#src/{path}.theory';\n"
  -- The contract names the module of the package as a type alone, so the two modules import each
  -- other only as types.
  let functions := kinds.filterMap fun
    | (name, .function) => some name
    | _ => none
  let modulePath := pathOf theory module
  let contractImport := if functions.isEmpty && instances.isEmpty then [] else
    [s!"import type * as Module from '#src/{modulePath}';\n"]
  let functionMembers ← functions.mapM fun name ↦ do
    return s!"{← commentOf name}readonly {← valueNameOf packageNamespace name}: \
      {← typeNameOf packageNamespace name};\n"
  let members := functionMembers ++ instanceMembers
  let contract := if members.isEmpty then "" else
    s!"\n/** A contract of the functions of the theory that the module `{modulePath}` of the \
      package implements. */\n" ++
      s!"interface Contract \{\n{String.join members}}\n\n" ++
      s!"/** A check of the module `{modulePath}` of the package, which fails to compile where the \
        module leaves a function of the contract out or gives the function another type. */\n" ++
      "type _Implemented<Implementation extends Contract = typeof Module> = Implementation;\n"
  -- The header stands right above the first section, and a blank line parts every section from the
  -- next. The imports of the package take the order of their paths, as oxfmt sorts them, so that
  -- the header stays above the import it opens with.
  let packageLines := (checkLines ++ theoryLines ++ contractImport).mergeSort fun first second ↦
    (first.splitOn " from ").getLastD "" ≤ (second.splitOn " from ").getLastD ""
  let sections := [importLine, String.join packageLines, s!"{body}{contract}"].filter (!·.isEmpty)
  return s!"{header}{"\n".intercalate sections}"

end Generator

/-- Writes a file of TypeScript for every module of the theory of a package into the directory of
the source of the package, and checks the module of the package beside every file. -/
def main (arguments : List String) : IO Unit := do
  let [directoryOfTheory, directory] := arguments
    | throw (IO.userError "The generator takes the directory of the theory of a package, such as \
        `Presentation`, and the directory of the source of the package to write the files of \
        TypeScript into.")
  Lean.initSearchPath (← Lean.findSysroot)
  let theory := Lean.Name.mkStr `Falkara directoryOfTheory
  let modules := (← (System.FilePath.mk "Falkara" / directoryOfTheory).walkDir).toList.filterMap
    fun path ↦
      if path.extension == some "lean" then
        some ((path.withExtension "").components.foldl Lean.Name.mkStr .anonymous)
      else none
  let environment ← Lean.importModules (modules.map ({ module := · })).toArray {}
  modules.forM fun module ↦ do
    let path := System.FilePath.mk directory / Generator.pathOf theory module
    let declarations ← Generator.runIn environment (Generator.markedDeclarationsOf module false)
    if !declarations.isEmpty then
      if let some parent := path.parent then IO.FS.createDirAll parent
      let text ← Generator.runIn environment (Generator.fileOf theory theory module)
      IO.FS.writeFile (path.addExtension "theory.ts") text
      if ← (path.addExtension "ts").pathExists then
        let reexports ← Generator.runIn environment
          (declarations.flatMapM (Generator.reexportsOf theory))
        let implementations ← Generator.runIn environment
          (declarations.flatMapM (Generator.implementationsOf theory))
        let mismatches := Generator.mismatchesOf (path.addExtension "ts").toString
          s!"#src/{Generator.pathOf theory module}.theory"
          (← IO.FS.readFile (path.addExtension "ts")) reexports implementations
        unless mismatches.isEmpty do
          throw (IO.userError ("\n\n".intercalate mismatches))
    let theorems ← Generator.runIn environment (Generator.markedDeclarationsOf module true)
    if !theorems.isEmpty then
      let text ← Generator.runIn environment
        (Generator.testFileOf theory module theory theorems)
      IO.FS.writeFile (path.addExtension "theory.test.ts") text
