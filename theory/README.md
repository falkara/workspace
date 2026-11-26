# Falkara Theory

Falkara Theory states in Lean the mathematics that the packages of this repository compute, so that the kernel of Lean checks every definition before code follows it. For now it covers the colorimetry of Falkara Presentation, the CIE 1931 standard colorimetric observer and CIE standard illuminant D65, each held as exact rational numbers from the data tables of the CIE, the filename of Falkara CLI, a portable filename of POSIX that names a file or a directory in the same way on every system, and the systems of Falkara Simulation, each a coalgebra of an endofunctor as Mathlib states it.

## Data and Computation

The theory keeps its data apart from its computations:

1. A data table holds every row of its data set as the CIE publishes it, with the wavelength of each row as the whole number of nanometers that the data set gives, CIE standard illuminant D65 from 300 nm to 830 nm and the CIE 1931 standard colorimetric observer from 360 nm to 830 nm, so its checks compare it with the validation values of the CIE.
2. A computation takes a `Wavelength`, a whole number of nanometers from 360 nm to 830 nm, the range of the observer and of the standard method of ISO/CIE 11664-3, so every function of the wavelength gives a value at every wavelength it takes, and the rows of D65 below 360 nm are held and never computed with.

## Organization

The theory is a Lake package of four libraries, and every module takes the module system of Lean. The libraries `Falkara` and `Generator` each have a root module that imports every module of the library, which `lake exe mk_all --lib Falkara` and `lake exe mk_all --lib Generator` write. The checks declare the same names in several modules, so each library of the checks has no root module and takes every module under its directory.

| Library         | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Falkara`       | The theory under the namespace `Falkara`: the attribute `counterpart` in `Falkara/Counterpart`, which records the item of a work that a declaration states in the record of `Falkara/Citation` and the declaration that the generator writes as TypeScript in the record of `Falkara/ExportTypeScript`, which the generator reads, every work that the theory cites in `Falkara/References`, and a directory for the theory of each package, such as `Falkara/Cli`. |
| `Generator`     | The generator, which writes as TypeScript the declarations that the theory gives a counterpart in TypeScript, and its program `generator`.                                                                                                                                                                                                                                                                                                                          |
| `FalkaraTest`   | The checks of the data and of the attribute `counterpart`, each at the path of the module it checks, such as `FalkaraTest/Counterpart`, which `lake test` builds.                                                                                                                                                                                                                                                                                                   |
| `GeneratorTest` | The checks of the generator, each at the path of the module it checks, with the modules of a theory that the checks write under `GeneratorTest/Fixture`, which `lake build GeneratorTest` builds.                                                                                                                                                                                                                                                                   |

## Verification

Elan installs Lean at the version that `lean-toolchain` pins, the theory rests on Mathlib at the release of the same version, and five commands check the theory from this directory:

1. `lake exe cache get` downloads the built files of Mathlib, which take hours to build.
2. `lake build` builds the theory, its default target alone, and checks every proof and the standard set of the linters of Mathlib, and `lake build Generator generator` builds the generator and its program, as the tools of Mathlib lie outside its default targets as well.
3. `lake test` builds the checks of the data and of the attribute `counterpart`, and `lake build GeneratorTest` builds the checks of the generator, as the checks of the tools of Mathlib lie outside its test driver as well.
4. `lake lint` runs the linters of the environment of Batteries on every declaration of the theory, `lake exe runLinter Generator` runs them on the generator, as the tools of Mathlib lie outside its lint driver as well, and `find FalkaraTest GeneratorTest -name '*.lean' | sed 's/\.lean$//; s|/|.|g' | sort | xargs lake exe runLinter` runs them on the checks, which have no root module, so the command names every module of their libraries.
5. `lake shake Falkara Generator` finds every import that a module never uses or that another import implies, and `lake shake --fix Falkara Generator` removes it. An import that a module needs while it compiles alone, such as `public import Mathlib.Init` for the linters of Mathlib in a module of the generator that imports nothing else of Mathlib, carries the comment `-- shake: keep`, as `lake shake` sees no use of it.

A build reports the warnings of the linters as warnings, and `--wfail`, such as `lake build --wfail` and `lake test --wfail`, fails it on every warning that remains, as the continuous integration of the repository and of Mathlib builds.

## Generation

The generator writes the declarations that the theory gives a counterpart in TypeScript into the package of their theory, such as Falkara Presentation, a file for every module of the theory, such as `Colorimetry/Tristimulus.theory.ts` for `Falkara/Presentation/Colorimetry/Tristimulus.lean`, beside which the package keeps a module of its own, such as `Colorimetry/Tristimulus.ts`. The module of the package re-exports the declarations of the theory, such as the white, which the generator writes as the kernel of Lean reduces them, and is bounded by the types of the theory, which it must implement, and by its theorems, which the generator writes as tests of the module, such as `Colorimetry/Tristimulus.theory.test.ts`. It reads the built theory, so `lake build` precedes it:

1. `lake build` builds the theory the generator reads.
2. `lake exe generator Presentation ../libraries/presentation/src` and `lake exe generator Simulation ../libraries/simulation/src` write the files of TypeScript of Falkara Presentation and Falkara Simulation and fail where a module of the package, such as `Colorimetry/Tristimulus.ts`, leaves a declaration of the theory out of its re-exports or implements a function of the theory with another comment than the theory gives it.
3. `npm run check:fix` in the root of the repository formats the files by oxfmt, as the generator writes them unformatted.

## Licensing

Every file of the theory is licensed under the MIT License, except the files that hold data of the CIE, which are licensed under CC BY-SA 4.0, as [LICENSE](LICENSE) sets out.
