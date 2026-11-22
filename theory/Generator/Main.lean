/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Lean.Meta.Basic
import Generator.Comment
import Generator.Declaration
import Generator.Path
import Generator.Redeclaration
import Generator.Theorem
import Generator.Type

/-!
# Main

The module defines the program `generator`, which writes the declarations that the theory of a
package marks `export_typescript` into files of TypeScript, a file for every module of the theory.
The program takes the directory of the theory of the package, such as `Presentation` for
`Falkara/Presentation`, and the directory of the source of the package, and writes the
declarations of every module of the theory, such as
`Falkara/Presentation/Colorimetry/Tristimulus.lean`, into the file of the path that the module
`Path` gives in the directory of the source, such as `Colorimetry/Tristimulus.theory.ts`, named
without the namespace of the module, such as `Falkara.Presentation.Colorimetry`. A file imports
from Effect the modules its declarations name, `Brand`, `Schema`, and every module whose function a
value calls, such as `Rational.fromBigInt`, as values and every other module as a type, and from
the files of the other modules of the theory the declarations it names, as values where a schema
names them and as types otherwise. A file whose module defines a refinement imports the condition
of the refinement as a value from the module of checks that the package keeps beside the module of
the package, such as `Filename.check.ts`, which imports no schema. A file whose module defines
functions ends with a contract, an interface that names every function as the module of the
package beside the file exports it, such as `chromaticityOf`, and a type that fails to compile
where that module leaves a function out or gives it another type, as a signature of a module in ML
requires of the module. The program writes the theorems of a module marked `export_typescript` into
the file of tests of the same name, such as `Colorimetry/Tristimulus.theory.test.ts`, by the module
`Theorem`. The program then checks the module of the package beside every file, such as
`Colorimetry/Tristimulus.ts`, by the module `Redeclaration`, and fails with a reason for every
redeclaration whose comment differs from the theory.

## Main Definitions

- `runIn`: runs a computation of the generator in an environment, as a program runs it.
- `markedDeclarationsOf`: gives the declarations marked `export_typescript` of a module of the
  theory, its theorems or every other declaration, in the order of their lines.
- `fileOf`: gives the file of TypeScript that holds the declarations marked `export_typescript` of
  a module of the theory of a package, named without the namespace of the package.
- `main`: writes a file of TypeScript for every module of the theory of a package into the
  directory of the source of the package, and checks the module of the package beside every file.

## Implementation Notes

The program writes a file for every module of the theory rather than for every module of the
package, so that the package keeps a module of its own beside every module of the theory, as Effect
keeps a module for every data type.

A file takes the suffix `.theory.ts`, which names what the file holds, the declarations of the
theory, as the import `Theory` of the module of the package names them, rather than how the file
comes about; its header and the file `.gitattributes` mark it as generated.

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

/-- Gives the declarations marked `export_typescript` of a module of the theory, its theorems or
every other declaration, in the order of their lines. -/
def markedDeclarationsOf (module : Lean.Name) (theorems : Bool) :
    Lean.MetaM (List Lean.Name) := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdx? module | return []
  let some data := environment.header.moduleData[index.toNat]? | return []
  let marked := data.constNames.toList.filter fun name ↦
    ExportTypeScript.tagAttribute.hasTag environment name &&
      (environment.find? name matches some (.thmInfo _)) == theorems
  let lines ← marked.mapM fun name ↦ do
    return (name, ((← Lean.findDeclarationRanges? name).map (·.range.pos.line)).getD 0)
  return (lines.mergeSort fun first second ↦ first.snd ≤ second.snd).map Prod.fst

/-- Gives the file of TypeScript that holds the declarations marked `export_typescript` of a module
of the theory of a package, named without the namespace of the package. -/
def fileOf (theory packageNamespace module : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let declarations ← markedDeclarationsOf module false
  let (texts, records) ← (declarations.mapM (declarationOf packageNamespace)).run []
  let body := "\n".intercalate texts
  let header := s!"// Written by the generator of the theory from `{module}`, so every change by \
    hand is lost when the generator runs.\n"
  -- A schema, a constructor, and a function such as `Rational.fromBigInt` are the values of the
  -- file, so a module the file names otherwise, as `Rational.Rational`, is imported as a type.
  let imports := effectImportsOf records
  let importLine := if imports.isEmpty then "" else if imports.any (·.snd == .value) then
      s!"\nimport \{ {", ".intercalate (imports.map fun (module, usage) ↦
        if usage == .value then module else s!"type {module}")} } from 'effect';\n"
    else s!"\nimport type \{ {", ".intercalate (imports.map Prod.fst)} } from 'effect';\n"
  let kinds ← declarations.mapM fun name ↦ return (name, ← kindOf name)
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
  let checkLines := (conditions.filterMap fun condition ↦
    (environment.getModuleIdxFor? condition).bind fun index ↦
      environment.header.moduleNames[index.toNat]?).eraseDups.map
    fun checkModule ↦
      let names := conditions.filter fun condition ↦
        ((environment.getModuleIdxFor? condition).bind fun index ↦
          environment.header.moduleNames[index.toNat]?) == some checkModule
      let path := pathOf theory checkModule
      s!"import \{ {", ".intercalate (names.map fun condition ↦
        camelCaseOf (wordsOf packageNamespace condition))} } from '#src/{path}.check';\n"
  -- An interface names the types of its fields, and a type and a refinement the types of their
  -- values.
  let named := kinds.flatMap fun (name, kind) ↦
    match kind with
    | .dataStructure | .structure => fieldConstants name
    | _ => ((environment.find? name).map fun information ↦
      information.type.getUsedConstants.toList ++
        if kind matches .type | .bundled | .refinement .. then
          (information.value?.map (·.getUsedConstants.toList)).getD []
        else []).getD []
  let others := (namedBySchemas ++ named).eraseDups.filter fun name ↦
    ExportTypeScript.tagAttribute.hasTag environment name &&
      (environment.getModuleIdxFor? name).map (·.toNat) !=
        (environment.getModuleIdx? module).map (·.toNat)
  let otherModules := (others.filterMap fun name ↦
    (environment.getModuleIdxFor? name).bind fun index ↦
      environment.header.moduleNames[index.toNat]?).eraseDups
  let theoryLines := otherModules.map fun otherModule ↦
    let names := others.filter fun name ↦
      ((environment.getModuleIdxFor? name).bind fun index ↦
        environment.header.moduleNames[index.toNat]?) == some otherModule
    let typeNames := names.map fun name ↦
      (pascalCaseOf (wordsOf packageNamespace name), namedBySchemas.contains name)
    let path := pathOf theory otherModule
    if typeNames.any Prod.snd then
      s!"import \{ {", ".intercalate (typeNames.map fun (typeName, value) ↦
        if value then typeName else s!"type {typeName}")} } from '#src/{path}.theory';\n"
    else
      s!"import type \{ {", ".intercalate (typeNames.map Prod.fst)} } \
        from '#src/{path}.theory';\n"
  -- The contract names the module of the package as a type alone, so the two modules import each
  -- other only as types.
  let functions := kinds.filterMap fun
    | (name, .function) => some name
    | _ => none
  let modulePath := pathOf theory module
  let contractImport := if functions.isEmpty then [] else
    [s!"import type * as Module from '#src/{modulePath}';\n"]
  let members ← functions.mapM fun name ↦ do
    let words := wordsOf packageNamespace name
    return s!"{← commentOf name}readonly {camelCaseOf words}: {pascalCaseOf words};\n"
  let contract := if functions.isEmpty then "" else
    s!"\n/** The functions of the theory that the module `{modulePath}` of the package \
      implements. */\n" ++
      s!"interface Contract \{\n{String.join members}}\n\n" ++
      s!"/** The module `{modulePath}` of the package, which fails to compile where the module \
        leaves a function of the contract out or gives the function another type. */\n" ++
      "type _Implemented<Implementation extends Contract = typeof Module> = Implementation;\n"
  let theoryImports :=
    if theoryLines.isEmpty && checkLines.isEmpty && contractImport.isEmpty then "" else
      s!"\n{String.join (checkLines ++ theoryLines ++ contractImport)}"
  return s!"{header}{importLine}{theoryImports}\n{body}{contract}"

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
  for module in modules do
    let packageNamespace := module.getPrefix
    let path := System.FilePath.mk directory / Generator.pathOf theory module
    let declarations ← Generator.runIn environment (Generator.markedDeclarationsOf module false)
    if !declarations.isEmpty then
      if let some parent := path.parent then IO.FS.createDirAll parent
      let text ← Generator.runIn environment (Generator.fileOf theory packageNamespace module)
      IO.FS.writeFile (path.addExtension "theory.ts") text
      if ← (path.addExtension "ts").pathExists then
        let redeclarations ← Generator.runIn environment
          (declarations.flatMapM (Generator.redeclarationsOf packageNamespace))
        let mismatches := Generator.mismatchesOf (path.addExtension "ts").toString
          (← IO.FS.readFile (path.addExtension "ts")) redeclarations
        unless mismatches.isEmpty do
          throw (IO.userError ("\n\n".intercalate mismatches))
    let theorems ← Generator.runIn environment (Generator.markedDeclarationsOf module true)
    if !theorems.isEmpty then
      let text ← Generator.runIn environment
        (Generator.testFileOf theory module packageNamespace theorems)
      IO.FS.writeFile (path.addExtension "theory.test.ts") text
