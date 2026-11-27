# Falkara Workspace

A platform that lets virtually anyone build digital experiences without the slop, with an extra focus on correctness and developer experience.

## Proof and Bridge

The mathematics that a package exposes through Effect, such as the colorimetry of Falkara Presentation and the systems of Falkara Simulation, is stated first in [the theory](theory) in Lean. Lean proves that the mathematics holds, and a bridge checks that the package carries the same mathematics.

### What Lean Proves

Every module of the theory is one of two kinds, and only the second has something to prove:

| Module               | What the theory adds                                                                                                                                                                       | Example                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Adopted from Mathlib | The definition of Mathlib itself, so everything built on it can use the lemmas of Mathlib. Mathlib has proved it, and a structure without laws, such as a coalgebra, has nothing to prove. | `Coalgebra`, `Functor`                                                          |
| Built in the theory  | Theorems of its own, one for every claim that a user of the package relies on. Without a theorem, Lean checks its types alone.                                                             | `MealyMachine.series` with `behavior_series`, `Tristimulus.add` with `add_comm` |

### What the Bridge Checks

Lean proves the mathematics in its own model, such as the identity monad and infinite streams, not in the runtime of Effect. The generator of the theory therefore binds the package to the theory in three ways:

1. Values, such as the white of Falkara Presentation, are computed by Lean and written as they are.
2. Functions written by hand must have the types that the theory gives them, or the package does not compile.
3. Theorems become property tests of the functions written by hand, which compare streams on finite prefixes.

The generator writes the form of the mathematics, its names, types, and comments, and never its meaning, so a change to the meaning of the mathematics starts in the theory.

## License

This repository is licensed under [the MIT License](LICENSE), except the data of the CIE in `theory`, which is licensed under CC BY-SA 4.0, as [the license of the theory](theory/LICENSE) sets out.
