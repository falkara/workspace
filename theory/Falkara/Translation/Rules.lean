/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

import Aesop.BuiltinRules
import Falkara.TranslationRule
import Mathlib.CategoryTheory.Types.Basic
import Mathlib.Data.Seq.Defs

/-!
# Rules

The module lists every rule by which a translator reads the constants of Lean that the theory builds
on: the formers of the types of the core, the structural parts of the categories and the functors
that the theory states its systems by, the structural parts of the terms of a theorem, and the
primitives of a target, each at the number of arguments that an application of its constant takes.

## Implementation Notes

The rules lie in one module, so the list of every constant of Lean that a translator gives a meaning
is audited in one place, and a translator names no constant of Lean but by its rule.

A list and an array take the same former, as a target writes both as an array.

The arithmetic of the rational numbers holds at `Rat` alone, as the operators of Lean are generic
over their types and a target implements the arithmetic of the rational numbers alone.

The function that a morphism of a concrete category gives is the morphism, as a morphism of the
category of types is a function in every target.
-/

-- The formers of the types of the core.
translation_rule Rat 0 type rational
translation_rule String 0 type string
translation_rule Bool 0 type boolean
translation_rule PUnit 0 type unit
translation_rule Option 1 type option
translation_rule Array 1 type array
translation_rule List 1 type array
translation_rule Stream' 1 type stream
translation_rule Stream'.Seq 1 type sequence
translation_rule Prod 2 type product
translation_rule Sum 2 type sum
translation_rule ReaderT 3 type reader
translation_rule Except 2 type except
translation_rule Id 1 type identity

-- The structural parts of the categories and the functors.
translation_rule CategoryTheory.Functor 4 structural functor
translation_rule CategoryTheory.Functor.obj 6 structural functorObject
translation_rule CategoryTheory.Functor.map 8 structural functorMap
translation_rule CategoryTheory.Functor.toPrefunctor 5 structural toPrefunctor
translation_rule Prefunctor.obj 6 structural prefunctorObject
translation_rule CategoryTheory.Category 1 structural category
translation_rule CategoryTheory.types 0 structural types
translation_rule CategoryTheory.ofTypeFunctor 3 structural typeFunctor
translation_rule CategoryTheory.Functor.id 2 structural identityFunctor
translation_rule CategoryTheory.CategoryStruct.id 3 structural identityMorphism
translation_rule CategoryTheory.CategoryStruct.comp 7 structural composition
translation_rule Quiver.Hom 4 structural hom
translation_rule TypeCat.Hom 2 structural typeHom
translation_rule Opposite 1 structural opposite
translation_rule Opposite.op 2 structural toOpposite
translation_rule Opposite.unop 2 structural fromOpposite

-- The structural parts of the terms of a theorem.
translation_rule Prod.mk 4 structural pair
translation_rule Prod.fst 3 structural first
translation_rule Prod.snd 3 structural second
translation_rule DFunLike.coe 6 structural coercion
translation_rule CategoryTheory.ConcreteCategory.hom 9 erase 8
translation_rule Stream'.head 2 structural head

-- The primitives of a target.
translation_rule OfNat.ofNat 3 at Rat primitive rationalLiteral
translation_rule Neg.neg 3 at Rat primitive rationalNegate
translation_rule HAdd.hAdd 6 at Rat primitive rationalAdd
translation_rule HSub.hSub 6 at Rat primitive rationalSubtract
translation_rule HMul.hMul 6 at Rat primitive rationalMultiply
translation_rule Option.some 2 primitive optionSome
translation_rule Option.none 1 primitive optionNone
translation_rule Stream'.map 4 primitive streamMap
translation_rule Stream'.Seq.map 4 primitive sequenceMap
translation_rule Stream'.zip 6 primitive streamZip
translation_rule Stream'.cons 3 primitive streamCons
translation_rule Stream'.tail 2 primitive streamTail
translation_rule Stream'.Seq.destruct 2 primitive sequenceDestruct
translation_rule Stream'.const 2 primitive streamConst
translation_rule Stream'.Seq.nil 1 primitive sequenceNil
translation_rule Stream'.Seq.cons 3 primitive sequenceCons
