/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.References -- shake: keep
public import Mathlib.CategoryTheory.Endofunctor.Algebra
meta import Falkara.Citation -- shake: keep
meta import Falkara.ExportTypeScript -- shake: keep

/-!
# Coalgebra

The module defines the coalgebras of an endofunctor $F$ as Mathlib
[mathlibCommunity2020leanMathematicalLibrary] states them, each a carrier $X$ with a structure
morphism $c : X \to F(X)$. Every system of Falkara Simulation is a coalgebra of an endofunctor of
its own, such as a stream coalgebra of the module `Stream`.

## Main Definitions

- `Coalgebra`: a coalgebra of an endofunctor, a carrier with a structure morphism into the object
  to which the endofunctor maps the carrier.

## Implementation Notes

`Coalgebra` names `CategoryTheory.Endofunctor.Coalgebra` with every parameter that Mathlib gives
it, as the attribute `export_typescript` marks only a declaration of the module that states the
attribute.

The generator takes the category of the coalgebra as the category of types, as TypeScript has no
other category, so the endofunctor takes a type lambda of Effect, the carrier takes a type
parameter, and the structure morphism takes a function.
-/

@[expose] public section

namespace Falkara.Simulation

/-! ### Definitions -/

/-- A coalgebra of an endofunctor, a carrier with a structure morphism into the object to which the
endofunctor maps the carrier. -/
abbrev Coalgebra := @CategoryTheory.Endofunctor.Coalgebra

attribute [cite "CategoryTheory.Endofunctor.Coalgebra" mathlibCommunity2020leanMathematicalLibrary]
  Coalgebra

/-! ### Export -/

attribute [export_typescript] Coalgebra

end Falkara.Simulation
