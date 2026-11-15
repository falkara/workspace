import Generator.Declaration
import Generator.Redeclaration

/-!
# Main

The module defines the program `generator`, which writes the declarations that the theory of Falkara Presentation marks `export_typescript` into files of TypeScript, a file for every module of the theory. The theory of a module of the package lies in a directory of `Source/Presentation`, such as `Source/Presentation/Colorimetry`, which `Main.lean` gathers, and the program writes the declarations of every module in the directory, such as `Tristimulus.lean`, into the file of the same name in the directory of the same name in the directory it is given, such as `Colorimetry/Tristimulus.generated.ts`. A file imports from Effect the modules its declarations name, `Brand` and `Schema` as values and every other module as a type, and from the files of the other modules of the theory the declarations it names, as values where a schema names them and as types otherwise. A file whose module defines functions ends with a contract, an interface that names every function as the module of the package beside the file exports it, such as `chromaticityOf`, and a type that fails to compile where that module leaves a function out or gives it another type, as a signature of a module in ML requires of the module. The program then checks the module of the package beside every file, such as `Colorimetry/Tristimulus.ts`, by the module `Redeclaration`, and fails with a reason for every redeclaration whose comment differs from the theory.

## Implementation Notes

The program writes a file for every module of the theory rather than for every module of the package, so that the package keeps a module of its own beside every module of the theory, as Effect keeps a module for every data type.

The program writes the declarations of a module in the order of their lines, as the theory states them.

The contract and its check stay unexported, as they concern the module of the package alone, and the check takes a name that opens with `_`, as Oxlint takes such a name for a declaration that is meant to stay unused.
-/

namespace Generator

/-- Runs a computation of the generator in an environment, as a program runs it. -/
def runIn {α : Type} (environment : Lean.Environment) (computation : Lean.MetaM α) : IO α := do
  let (value, _) ← (computation.run' {} {}).toIO
    { fileName := "", fileMap := default } { env := environment }
  return value

/-- Gives the declarations marked `export_typescript` of a module of the theory, in the order of their lines. -/
def markedDeclarationsOf (module : Lean.Name) : Lean.MetaM (List Lean.Name) := do
  let environment ← Lean.getEnv
  let some index := environment.getModuleIdx? module | return []
  let some data := environment.header.moduleData[index.toNat]? | return []
  let marked := data.constNames.toList.filter (ExportTypeScript.tagAttribute.hasTag environment)
  let lines ← marked.mapM fun name => do
    return (name, ((← Lean.findDeclarationRanges? name).map (·.range.pos.line)).getD 0)
  return (lines.mergeSort fun first second => first.snd ≤ second.snd).map Prod.fst

/-- Gives the file of TypeScript that holds the declarations marked `export_typescript` of a module of the theory, named without the namespace of the package. -/
def fileOf (packageNamespace module : Lean.Name) : Lean.MetaM String := do
  let environment ← Lean.getEnv
  let declarations ← markedDeclarationsOf module
  let body := "\n".intercalate (← declarations.mapM (declarationOf packageNamespace))
  let imports := ["Brand", "Option", "Rational", "Schema"].filter fun module => (body.splitOn s!"{module}.").length > 1
  let header := s!"// Written by the generator of Falkara Theory from `{module}`, so every change by hand is lost when the generator runs.\n"
  -- The schemas and the constructors are the only values of the file, so every other module is imported as a type.
  let importLine := if imports.isEmpty then "" else if imports.any (["Brand", "Schema"].contains ·) then
      s!"\nimport \{ {", ".intercalate (imports.map fun module =>
        if ["Brand", "Schema"].contains module then module else s!"type {module}")} } from 'effect';\n"
    else s!"\nimport type \{ {", ".intercalate imports} } from 'effect';\n"
  -- A schema names the schemas of its fields as values, and every other declaration names a declaration as a type.
  let namedBySchemas := declarations.flatMap fun name =>
    if Lean.isStructure environment name then
      (Lean.getStructureFields environment name).toList.flatMap fun field =>
        ((environment.find? (name ++ field)).map (·.type.getUsedConstants.toList)).getD []
    else []
  let named := declarations.flatMap fun name => ((environment.find? name).map (·.type.getUsedConstants.toList)).getD []
  let others := (namedBySchemas ++ named).eraseDups.filter fun name =>
    ExportTypeScript.tagAttribute.hasTag environment name &&
      (environment.getModuleIdxFor? name).map (·.toNat) != (environment.getModuleIdx? module).map (·.toNat)
  let otherModules := (others.filterMap fun name =>
    (environment.getModuleIdxFor? name).bind fun index => environment.header.moduleNames[index.toNat]?).eraseDups
  let theoryLines := otherModules.map fun otherModule =>
    let names := others.filter fun name =>
      ((environment.getModuleIdxFor? name).bind fun index => environment.header.moduleNames[index.toNat]?) == some otherModule
    let typeNames := names.map fun name =>
      (String.join ((name.replacePrefix packageNamespace .anonymous).components.map fun component => component.toString.capitalize),
        namedBySchemas.contains name)
    let path := (otherModule.replacePrefix `Presentation .anonymous).toString.replace "." "/"
    if typeNames.any Prod.snd then
      s!"import \{ {", ".intercalate (typeNames.map fun (typeName, value) => if value then typeName else s!"type {typeName}")} } from '#src/{path}.generated';\n"
    else s!"import type \{ {", ".intercalate (typeNames.map Prod.fst)} } from '#src/{path}.generated';\n"
  -- The contract names the module of the package as a type alone, so the two modules import each other only as types.
  let functions := declarations.filter fun name => !Lean.isStructure environment name
  let modulePath := (module.replacePrefix `Presentation .anonymous).toString.replace "." "/"
  let contractImport := if functions.isEmpty then [] else [s!"import type * as Module from '#src/{modulePath}';\n"]
  let members ← functions.mapM fun name => do
    let typeName := String.join ((name.replacePrefix packageNamespace .anonymous).components.map
      fun component => component.toString.capitalize)
    return s!"{← commentOf name "  "}  readonly {typeName.decapitalize}: {typeName};\n"
  let contract := if functions.isEmpty then "" else
    s!"\n/** The functions of the theory that the module `{modulePath}` of the package implements. */\n" ++
      s!"interface Contract \{\n{String.join members}}\n\n" ++
      s!"/** The module `{modulePath}` of the package, which fails to compile where the module leaves a function of the contract out or gives the function another type. */\n" ++
      "type _Implemented<Implementation extends Contract = typeof Module> = Implementation;\n"
  let theoryImports := if theoryLines.isEmpty && contractImport.isEmpty then "" else
    s!"\n{String.join (theoryLines ++ contractImport)}"
  return s!"{header}{importLine}{theoryImports}\n{body}{contract}"

end Generator

/-- Writes a file of TypeScript for every module of the theory of Falkara Presentation into the directory it is given, and checks the module of the package beside every file. -/
def main (arguments : List String) : IO Unit := do
  let [directory] := arguments
    | throw (IO.userError "The generator takes the directory to write the files of TypeScript into.")
  Lean.initSearchPath (← Lean.findSysroot)
  for entry in ← System.FilePath.readDir "Source/Presentation" do
    if ← (entry.path / "Main.lean").pathExists then
      let packageNamespace := `Presentation ++ Lean.Name.mkSimple entry.fileName
      let environment ← Lean.importModules #[{ module := packageNamespace ++ `Main }] {}
      for module in environment.header.moduleNames do
        if let .str _ last := module then
          let declarations ← Generator.runIn environment (Generator.markedDeclarationsOf module)
          if packageNamespace.isPrefixOf module && !declarations.isEmpty then
            let packageDirectory := System.FilePath.mk directory / entry.fileName
            IO.FS.createDirAll packageDirectory
            let text ← Generator.runIn environment (Generator.fileOf packageNamespace module)
            IO.FS.writeFile (packageDirectory / s!"{last}.generated.ts") text
            let path := packageDirectory / s!"{last}.ts"
            if ← path.pathExists then
              let redeclarations ← Generator.runIn environment
                (declarations.flatMapM (Generator.redeclarationsOf packageNamespace))
              let mismatches := Generator.mismatchesOf path.toString (← IO.FS.readFile path) redeclarations
              unless mismatches.isEmpty do
                throw (IO.userError ("\n\n".intercalate mismatches))
