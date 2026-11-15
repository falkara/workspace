# Falkara Theory

Falkara Theory states in Lean the mathematics that the packages of this repository compute, so that the kernel of Lean checks every definition before code follows it. For now it covers the colorimetry of Falkara Presentation: the CIE 1931 standard colorimetric observer and CIE standard illuminant D65, each held as exact rational numbers from the data tables of the CIE.

## Organization

Every library of the theory lies under `Source`, and its checks lie under `Test` at the same path.

| Library        | Content                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Presentation` | The theory of Falkara Presentation, with a directory for each module of the package, such as `Presentation/Colorimetry`.       |
| `References`   | Every work that the theory cites, with the files of each data set and their SHA-256.                                           |
| `Citation`     | The attribute `cite`, which records the item of a work that a declaration states and refuses a work the theory never declares. |
| `Test`         | The checks of the data and of the attribute `cite`, which `lake test` builds.                                                  |

## Verification

Elan installs Lean at the version that `lean-toolchain` pins, and two commands check the theory from this directory:

1. `lake build Presentation Citation References` builds the theory and checks every proof.
2. `lake test` builds the checks of the data and of the attribute `cite`.

## Licensing

Every file of the theory is licensed under the MIT License of the repository, except the data of the CIE, which is licensed under CC BY-SA 4.0, as [LICENSE](LICENSE) sets out.
