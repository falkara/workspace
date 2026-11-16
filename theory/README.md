# Falkara Theory

Falkara Theory states in Lean the mathematics that the packages of this repository compute, so that the kernel of Lean checks every definition before code follows it. For now it covers the colorimetry of Falkara Presentation: the CIE 1931 standard colorimetric observer and CIE standard illuminant D65, each held as exact rational numbers from the data tables of the CIE.

## Organization

Every library of the theory lies under `Source`, and its checks lie under `Test` at the same path.

| Library            | Content                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `Citation`         | The attribute `cite`, which records the item of a work that a declaration states and refuses a work the theory never declares. |
| `ExportTypeScript` | The attribute `export_typescript`, which marks a declaration that the generator writes as TypeScript.                          |
| `Generator`        | The generator, which writes the declarations marked `export_typescript` as TypeScript.                                         |
| `Presentation`     | The theory of Falkara Presentation, with a directory for each module of the package, such as `Presentation/Colorimetry`.       |
| `References`       | Every work that the theory cites, with the files of each data set and their SHA-256.                                           |
| `Test`             | The checks of the data, of the attributes `cite` and `export_typescript`, and of the generator, which `lake test` builds.      |

## Verification

Elan installs Lean at the version that `lean-toolchain` pins, and two commands check the theory from this directory:

1. `lake build Citation ExportTypeScript Generator Presentation References` builds the theory and checks every proof.
2. `lake test` builds the checks of the data, of the attributes `cite` and `export_typescript`, and of the generator.

## Generation

The generator writes the declarations that the theory marks `export_typescript` into Falkara Presentation, a file for every module of the theory, such as `Colorimetry/Tristimulus.theory.ts` for `Presentation/Colorimetry/Tristimulus.lean`, beside which the package keeps a module of its own, such as `Colorimetry/Tristimulus.ts`. The module of the package redeclares the values of the theory, such as the white, which the generator writes as the kernel of Lean reduces them, and is bounded by the types of the theory, which it must implement, and by its theorems, which the generator writes as tests of the module, such as `Colorimetry/Tristimulus.theory.test.ts`. It reads the built theory, so `lake build` precedes it:

1. `lake build Presentation` builds the theory the generator reads.
2. `lake exe generator ../libraries/presentation/src` writes the files of TypeScript and fails where a module of the package, such as `Colorimetry/Tristimulus.ts`, redeclares a declaration of the theory with another comment than the theory gives it.

## Licensing

Every file of the theory is licensed under the MIT License of the repository, except the data of the CIE, which is licensed under CC BY-SA 4.0, as [LICENSE](LICENSE) sets out.
