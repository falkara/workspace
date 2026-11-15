import Generator.Declaration
import Generator.Redeclaration

/-!
# Main

The module defines the program `generator`, which writes the declarations of every module of Falkara Presentation that the theory marks `export_typescript` into a file of TypeScript of its own. The theory of a module of the package lies in a directory of `Source/Presentation`, such as `Source/Presentation/Colorimetry`, which `Main.lean` gathers, and the program writes its declarations into the file of the same name in the directory it is given, such as `Colorimetry.generated.ts`. The file imports from Effect the modules its declarations name, the modules `Brand` and `Schema` as values and every other module as a type, as the schemas and the constructors are the only values the file holds. The program then checks the module of the package of the same name, such as `Colorimetry.ts`, by the module `Redeclaration`, and fails with a reason for every redeclaration whose comment differs from the theory.

## Implementation Notes

The program writes the declarations of a module in the order of their modules and of their lines, so that a declaration follows the declarations its module imports, as the theory states them.
-/

namespace Generator

/-- Runs a computation of the generator in an environment, as a program runs it. -/
def runIn {α : Type} (environment : Lean.Environment) (computation : Lean.MetaM α) : IO α := do
  let (value, _) ← (computation.run' {} {}).toIO
    { fileName := "", fileMap := default } { env := environment }
  return value

/-- Gives the declarations marked `export_typescript` of every module of the theory in a namespace, in the order of their modules and of their lines. -/
def markedDeclarationsOf (moduleNamespace : Lean.Name) : Lean.MetaM (List Lean.Name) := do
  let environment ← Lean.getEnv
  let modules := (environment.header.moduleNames.zip environment.header.moduleData).toList.filter
    fun (module, _) => moduleNamespace.isPrefixOf module
  modules.flatMapM fun (_, data) => do
    let marked := data.constNames.toList.filter (ExportTypeScript.tagAttribute.hasTag environment)
    let lines ← marked.mapM fun name => do
      return (name, ((← Lean.findDeclarationRanges? name).map (·.range.pos.line)).getD 0)
    return (lines.mergeSort fun first second => first.snd ≤ second.snd).map Prod.fst

/-- Gives the file of TypeScript that holds the declarations marked `export_typescript` of every module of the theory in a namespace. -/
def fileOf (moduleNamespace : Lean.Name) : Lean.MetaM String := do
  let texts ← (← markedDeclarationsOf moduleNamespace).mapM (declarationOf moduleNamespace)
  let body := "\n".intercalate texts
  let imports := ["Brand", "Option", "Rational", "Schema"].filter fun module => (body.splitOn s!"{module}.").length > 1
  let header := s!"// Written by the generator of Falkara Theory from `{moduleNamespace}`, so every change by hand is lost when the generator runs.\n"
  -- The schemas and the constructors are the only values of the file, so every other module is imported as a type.
  let importLine := if imports.isEmpty then "" else if imports.any (["Brand", "Schema"].contains ·) then
      s!"\nimport \{ {", ".intercalate (imports.map fun module =>
        if ["Brand", "Schema"].contains module then module else s!"type {module}")} } from 'effect';\n"
    else s!"\nimport type \{ {", ".intercalate imports} } from 'effect';\n"
  return s!"{header}{importLine}\n{body}"

end Generator

/-- Writes the file of TypeScript of every module of Falkara Presentation into the directory it is given. -/
def main (arguments : List String) : IO Unit := do
  let [directory] := arguments
    | throw (IO.userError "The generator takes the directory to write the files of TypeScript into.")
  Lean.initSearchPath (← Lean.findSysroot)
  for entry in ← System.FilePath.readDir "Source/Presentation" do
    if ← (entry.path / "Main.lean").pathExists then
      let moduleNamespace := `Presentation ++ Lean.Name.mkSimple entry.fileName
      let environment ← Lean.importModules #[{ module := moduleNamespace ++ `Main }] {}
      let text ← Generator.runIn environment (Generator.fileOf moduleNamespace)
      IO.FS.writeFile (System.FilePath.mk directory / s!"{entry.fileName}.generated.ts") text
      let path := System.FilePath.mk directory / s!"{entry.fileName}.ts"
      if ← path.pathExists then
        let redeclarations ← Generator.runIn environment do
          (← Generator.markedDeclarationsOf moduleNamespace).flatMapM (Generator.redeclarationsOf moduleNamespace)
        let mismatches := Generator.mismatchesOf path.toString (← IO.FS.readFile path) redeclarations
        unless mismatches.isEmpty do
          throw (IO.userError ("\n\n".intercalate mismatches))
