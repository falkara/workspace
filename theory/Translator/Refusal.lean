/-
Copyright (c) 2026 Filip Falcon. All rights reserved.
Released under MIT license as described in the file LICENSE.
Authors: Filip Falcon
-/
module

public import Falkara.ExportTypeScript
public import Lean.Message
public import Mathlib.Init -- shake: keep

/-!
# Refusal

The module defines the refusals of the translator, a failure for every declaration, type, value,
and theorem of the theory that has no counterpart in TypeScript, for every module of a package
that the check of its exports finds at fault, and for a call of the program with other arguments
than it takes, each with the message that it renders.

## Implementation Notes

A refusal is data, which renders its message only where it is reported, so a computation that
refuses names the reason by a constructor and the message of every reason stands in one place.

A refusal that names an expression of Lean renders it as a message of Lean, which prints the
expression in the context where the refusal is reported, so a local variable keeps its name and a
long expression breaks over lines as Lean breaks it.
-/

public section

namespace Translator

open Falkara

/-- A reason why the translator writes no TypeScript for the theory or a check fails. -/
inductive Refusal where
  /-- A work that a declaration cites has neither a page for every item nor a DOI. -/
  | noAddress (work : Lean.Name)
  /-- A declaration has no documentation comment, as the theory never gives it a counterpart. -/
  | noComment (name : Lean.Name)
  /-- A field of a structure has no documentation comment, as no clause of the attribute gives it
  one. -/
  | noFieldComment (structureName field : Lean.Name)
  /-- A declaration has no comment under the role of a function that the translator derives from
  it. -/
  | noDerivedComment (name : Lean.Name) (role : ExportTypeScript.Derived)
  /-- A declaration takes a comment under the role of a function that the translator never derives
  from it. -/
  | surplusComment (name : Lean.Name) (role : ExportTypeScript.Derived)
  /-- A declaration takes a category that is not the category of types. -/
  | foreignCategory (type : Lean.Expr)
  /-- An expression is no binder that a telescope opens. -/
  | noBinder (binder : Lean.Expr)
  /-- The type of a field of a structure depends on the structure. -/
  | dependentField (field : Lean.Name)
  /-- A name is no field of a structure. -/
  | noField (field : Lean.Name)
  /-- A type applies no structure. -/
  | typeAppliesNoStructure (type : Lean.Expr)
  /-- The value of a declaration applies no structure. -/
  | appliesNoStructure (name : Lean.Name)
  /-- The type of a field of a bundled structure depends on a field whose value is no type. -/
  | fieldDependsOnField (field : Lean.Name)
  /-- A type has no type in TypeScript. -/
  | noType (type : Lean.Expr)
  /-- A declaration has no declaration in TypeScript, as the theory never gives it a
  counterpart. -/
  | notExported (name : Lean.Name)
  /-- The identity monad has no type lambda, as the theory labels no identity functor. -/
  | noIdentityLabel (constructor : Lean.Expr)
  /-- A type constructor or a functor has no type lambda, as the theory never gives its declaration
  a counterpart. -/
  | unexportedTypeLambda (constructor : Lean.Expr) (name : Lean.Name)
  /-- A type constructor or a functor has no type lambda. -/
  | noTypeLambda (constructor : Lean.Expr)
  /-- The result of a function type depends on its parameter. -/
  | dependentResult (type : Lean.Expr) (parameter : Lean.Name)
  /-- A function type leaves a parameter unnamed. -/
  | unnamedParameter (type : Lean.Expr)
  /-- A function type takes a parameter that is not explicit. -/
  | implicitParameter (type : Lean.Expr) (parameter : Lean.Name)
  /-- An expression is no type of a functor. -/
  | noFunctorType (type : Lean.Expr)
  /-- The definition of a curried functor names no object. -/
  | noObject (functor : Lean.Expr)
  /-- A function type has no schema, as a schema describes data. -/
  | functionSchema (type : Lean.Expr)
  /-- A declaration is neither a structure whose every field takes a schema nor a refinement. -/
  | noDataSchema (name : Lean.Name)
  /-- A type has no schema. -/
  | noSchema (type : Lean.Expr)
  /-- An expression reduces to no natural number. -/
  | noNatural (expression reduced : Lean.Expr)
  /-- An expression reduces to no integer. -/
  | noInteger (expression reduced : Lean.Expr)
  /-- A value takes a structure that the theory never gives a counterpart. -/
  | unexportedStructureValue (name structureName : Lean.Name)
  /-- A value takes a structure that takes parameters. -/
  | parametricStructureValue (structureName : Lean.Name)
  /-- A value takes a type that has no value in TypeScript. -/
  | noValue (name : Lean.Name) (type : Lean.Expr)
  /-- A value takes a structure of another module, whose constructor the file never imports. -/
  | foreignStructureValue (name structureName : Lean.Name)
  /-- A value is no closed expression, as it holds a free variable or a metavariable. -/
  | openValue (name : Lean.Name) (expression : Lean.Expr)
  /-- The kernel of Lean fails to reduce an expression. -/
  | irreducible (expression : Lean.Expr)
  /-- The rules of the translator give no constant a structural part. -/
  | missingRule (part : String)
  /-- The template of the rule of a target names an argument that the application of its primitive
  does not give. -/
  | templateArity (primitive : String)
  /-- The rule of a target assumes a statement of its primitive that no vector checks. -/
  | unverifiedRule (primitive statement : String)
  /-- A morphism of an axiom of a functor has no expression. -/
  | noMorphism (morphism : Lean.Expr)
  /-- An axiom of a functor is no equality. -/
  | noEquality (statement : Lean.Expr)
  /-- An axiom of a functor equates no morphisms. -/
  | noMorphismEquality (statement : Lean.Expr)
  /-- A functor has no instance, as the theory gives no class of functors a counterpart. -/
  | noInstanceClass (name : Lean.Name)
  /-- A functor has no instance, as the theory gives the functor no value. -/
  | valuelessInstance (name : Lean.Name)
  /-- A type has no declaration, as the theory gives it no value. -/
  | valuelessType (name : Lean.Name)
  /-- A functor has no declaration, as the theory gives it no value. -/
  | valuelessFunctor (name : Lean.Name)
  /-- A type constructor has no declaration, as the theory gives it no value. -/
  | valuelessTypeConstructor (name : Lean.Name)
  /-- A bundled structure has no constructor, as the theory gives no class of functors a
  counterpart. -/
  | noConstructorClass (name : Lean.Name)
  /-- A declaration is no type constructor. -/
  | noTypeConstructor (name : Lean.Name)
  /-- A declaration is no curried functor. -/
  | noCurriedFunctor (name : Lean.Name)
  /-- A field of the structure of a curried functor takes no argument of the structure as its
  type. -/
  | unnamedFieldType (name structureName : Lean.Name)
  /-- A field of the structure of a curried functor has no documentation comment, as no clause of
  the attribute on the functor gives it one. -/
  | noClauseFieldComment (field structureName declaration : Lean.Name)
  /-- The structure of a curried functor has no documentation comment, as its clause of the
  attribute on the functor gives none. -/
  | noClauseComment (structureName declaration : Lean.Name)
  /-- A value takes type parameters. -/
  | parametricValue (name : Lean.Name)
  /-- A declaration lies in no module of the theory that a test can import. -/
  | noTestModule (name : Lean.Name)
  /-- A test applies an expression that is no morphism. -/
  | noApplicableMorphism (morphism shape : Lean.Expr)
  /-- A test takes apart an expression that is no pair. -/
  | noPair (pair shape : Lean.Expr)
  /-- An expression of a theorem has no expression in a test. -/
  | noTestExpression (expression : Lean.Expr)
  /-- A test zips two streams by a function that is no `Prod.mk`. -/
  | zipWithoutPairs (expression function : Lean.Expr)
  /-- A test takes the first element of a stream that it does not draw. -/
  | undrawnHead (expression : Lean.Expr)
  /-- A test applies a primitive that the target does not implement, for the reason that the rule
  of the target gives. -/
  | unavailablePrimitive (expression : Lean.Expr) (reason : String)
  /-- A test draws data that hold a function. -/
  | drawnFunctionInData (type : Lean.Expr)
  /-- A test draws a function from another type than a type variable. -/
  | drawnFunction (type : Lean.Expr)
  /-- A test draws a declaration that is no structure of data. -/
  | undrawnDeclaration (name : Lean.Name)
  /-- A test draws a system in another monad than the identity monad. -/
  | drawnMonadicSystem (type : Lean.Expr)
  /-- A test draws a type that has no schema. -/
  | undrawnType (type : Lean.Expr)
  /-- A hypothesis of a theorem is neither an equation nor an inequation. -/
  | noHypothesis (type : Lean.Expr)
  /-- A theorem names a variable that the test takes for a side of the conclusion. -/
  | sideVariable (name : Lean.Name) (binder : String)
  /-- A test draws a system whose structure has several fields that are no types. -/
  | drawnSystemFields (declaration : Lean.Name)
  /-- The conclusion of a theorem is no equation. -/
  | noEquation (equation : Lean.Expr)
  /-- The conclusion of a theorem equates streams of streams. -/
  | streamOfStreams (equation : Lean.Expr)
  /-- The conclusion of a theorem equates streams and the theorem takes several streams. -/
  | severalStreams (equation : Lean.Expr) (name : Lean.Name)
  /-- A module of the theory has no name that a test can import it under. -/
  | noImportName (module : Lean.Name)
  /-- A module of a package leaves a name out of its re-exports from the generated module. -/
  | missingReexport (path name specifier : String)
  /-- A module of a package leaves out the implementation of a function. -/
  | missingImplementation (path binding comment : String)
  /-- An implementation in a module of a package takes another comment than the theory gives. -/
  | implementationComment (path : String) (line : Nat) (text comment : String)
  /-- The program takes other arguments than the directory of a theory and of a source. -/
  | arguments
  /-- Reading an expression takes more steps than its fuel allows. -/
  | fuel (expression : Lean.Expr)

/-- Gives the message of a refusal. -/
def Refusal.render : Refusal → Lean.MessageData
  | .noAddress work => m!"`{work}` has neither a page for every item nor a DOI."
  | .noComment name => m!"`{name}` has no documentation comment in TypeScript, as the theory \
      never gives it a counterpart in TypeScript."
  | .noFieldComment structureName field => m!"The field `{field}` of `{structureName}` has no \
      documentation comment in TypeScript, as no clause of the attribute `counterpart` gives it \
      one."
  | .noDerivedComment name role => m!"`{name}` has no comment of its {role.word} in TypeScript, \
      as its attribute `counterpart` gives none under `{role.word}`."
  | .surplusComment name role => m!"`{name}` takes no comment under `{role.word}` in its \
      attribute `counterpart`, as the translator derives no {role.word} from the declaration."
  | .foreignCategory type => m!"`{type}` takes a category that is not the category of types, the \
      one category of TypeScript."
  | .noBinder binder => m!"`{binder}` is no binder."
  | .dependentField field => m!"`{field}` has no field in TypeScript, as its type depends on the \
      structure."
  | .noField field => m!"`{field}` is no field of a structure."
  | .typeAppliesNoStructure type => m!"`{type}` applies no structure."
  | .appliesNoStructure name => m!"`{name}` applies no structure."
  | .fieldDependsOnField field => m!"`{field}` has no field in TypeScript, as its type depends on \
      a field whose value is no type."
  | .noType type => m!"`{type}` has no type in TypeScript."
  | .notExported name => m!"`{name}` has no declaration in TypeScript, as the theory never gives \
      it a counterpart in TypeScript."
  | .noIdentityLabel constructor => m!"`{constructor}` has no type lambda in TypeScript, as the \
      theory labels no identity functor."
  | .unexportedTypeLambda constructor name => m!"`{constructor}` has no type lambda in \
      TypeScript, as the theory never gives `{name}` a counterpart in TypeScript."
  | .noTypeLambda constructor => m!"`{constructor}` has no type lambda in TypeScript."
  | .dependentResult type parameter => m!"`{type}` has no type in TypeScript, as its result \
      depends on its parameter `{parameter}`."
  | .unnamedParameter type => m!"`{type}` has no type in TypeScript, as TypeScript names every \
      parameter and the theory names none."
  | .implicitParameter type parameter => m!"`{type}` has no type in TypeScript, as its parameter \
      `{parameter}` is not explicit."
  | .noFunctorType type => m!"`{type}` is no type of a functor."
  | .noObject functor => m!"`{functor}` has no type in TypeScript, as its definition names no \
      object."
  | .functionSchema type => m!"`{type}` has no schema in TypeScript, as a schema describes data \
      and the type is a function."
  | .noDataSchema name => m!"`{name}` has no schema in TypeScript, as it is neither a structure \
      whose every field takes a schema nor a refinement."
  | .noSchema type => m!"`{type}` has no schema in TypeScript."
  | .noNatural expression reduced => m!"`{expression}` reduces to `{reduced}`, which is no \
      natural number."
  | .noInteger expression reduced => m!"`{expression}` reduces to `{reduced}`, which is no \
      integer."
  | .unexportedStructureValue name structureName => m!"`{name}` has no value in TypeScript, as \
      `{structureName}` is no structure that the theory gives a counterpart in TypeScript."
  | .parametricStructureValue structureName => m!"`{structureName}` has no value in TypeScript, \
      as it takes parameters."
  | .noValue name type => m!"`{name}` has no value in TypeScript, as `{type}` has none."
  | .foreignStructureValue name structureName => m!"`{name}` has no value in TypeScript, as \
      `{structureName}` lies in another module, whose constructor the file never imports."
  | .openValue name expression => m!"`{name}` has no value in TypeScript, as `{expression}` holds \
      a variable or a metavariable, which the kernel of Lean never reduces."
  | .irreducible expression => m!"`{expression}` has no value in TypeScript, as the kernel of Lean \
      fails to reduce it."
  | .missingRule part => m!"The rules of the translator give no constant the structural part \
      `{part}`, so the module `Falkara.Translation.Rules` is missing from the environment."
  | .templateArity primitive => m!"The rule of the target for `{primitive}` names an argument \
      that the application of the primitive does not give."
  | .unverifiedRule primitive statement => m!"The rule of the target for `{primitive}` assumes \
      that {statement}, and no vector checks it."
  | .noMorphism morphism => m!"`{morphism}` has no expression in TypeScript."
  | .noEquality statement => m!"`{statement}` has no predicate in TypeScript, as it is no \
      equality."
  | .noMorphismEquality statement => m!"`{statement}` has no predicate in TypeScript, as it \
      equates no morphisms."
  | .noInstanceClass name => m!"`{name}` has no instance in TypeScript, as the theory gives no \
      class of functors a counterpart in TypeScript."
  | .valuelessInstance name => m!"`{name}` has no instance in TypeScript, as the theory gives the \
      functor no value."
  | .valuelessType name => m!"`{name}` has no declaration in TypeScript, as the theory gives the \
      type no value."
  | .valuelessFunctor name => m!"`{name}` has no declaration in TypeScript, as the theory gives \
      the functor no value."
  | .valuelessTypeConstructor name => m!"`{name}` has no declaration in TypeScript, as the theory \
      gives the type constructor no value."
  | .noConstructorClass name => m!"`{name}` has no constructor in TypeScript, as the theory gives \
      no class of functors a counterpart in TypeScript."
  | .noTypeConstructor name => m!"`{name}` is no type constructor."
  | .noCurriedFunctor name => m!"`{name}` is no curried functor."
  | .unnamedFieldType name structureName => m!"`{name}` has no type in TypeScript, as a field of \
      `{structureName}` takes no argument of the structure as its type."
  | .noClauseFieldComment field structureName declaration => m!"The field `{field}` of \
      `{structureName}` has no documentation comment in TypeScript, as no clause of the attribute \
      `counterpart` on `{declaration}` gives it one."
  | .noClauseComment structureName declaration => m!"`{structureName}` has no documentation \
      comment in TypeScript, as its clause of the attribute `counterpart` on `{declaration}` gives \
      none."
  | .parametricValue name => m!"`{name}` has no value in TypeScript, as it takes type \
      parameters."
  | .noTestModule name => m!"`{name}` lies in no module of the theory that a test can import."
  | .noApplicableMorphism morphism shape => m!"`{morphism}` is no morphism that a test can apply, \
      as its type reads as `{shape}`."
  | .noPair pair shape => m!"`{pair}` is no pair that a test can take apart, as its type reads as \
      `{shape}`."
  | .noTestExpression expression => m!"`{expression}` has no expression in a test of TypeScript."
  | .zipWithoutPairs expression function => m!"`{expression}` has no expression in a test of \
      TypeScript, as a test zips two streams into pairs alone and `{function}` is no `Prod.mk`."
  | .undrawnHead expression => m!"`{expression}` has no expression in a test of TypeScript, as \
      the first element of a stream that the test does not draw takes an effect."
  | .unavailablePrimitive expression reason => m!"`{expression}` has no expression in a test of \
      TypeScript, as {reason}."
  | .drawnFunctionInData type => m!"`{type}` has no schema that a test can draw from, as it holds \
      a function where a test draws data alone."
  | .drawnFunction type => m!"`{type}` has no schema that a test can draw from, as a test draws a \
      function from a type variable alone."
  | .undrawnDeclaration name => m!"`{name}` has no schema that a test can draw from."
  | .drawnMonadicSystem type => m!"`{type}` has no schema that a test can draw from, as a test \
      draws a system in the identity monad alone."
  | .undrawnType type => m!"`{type}` has no schema that a test can draw from."
  | .noHypothesis type => m!"`{type}` is no hypothesis that a test can skip the values of."
  | .sideVariable name binder => m!"`{name}` names a variable `{binder}`, which the test takes for \
      a side of the conclusion."
  | .drawnSystemFields declaration => m!"`{declaration}` has no schema that a test can draw from, \
      as a test draws a system of one field that is no type alone."
  | .noEquation equation => m!"`{equation}` is no equation that a test can check."
  | .streamOfStreams equation => m!"`{equation}` is no equation that a test can check, as a test \
      compares a prefix of a stream and no stream of streams."
  | .severalStreams equation name => m!"`{equation}` is no equation that a test can check, as a \
      test compares a prefix as long as the one stream it draws and `{name}` takes several."
  | .noImportName module => m!"`{module}` has no name that a test can import it under."
  | .missingReexport path name specifier => m!"{path}: `{name}` is missing, which the module \
      re-exports from `{specifier}`."
  | .missingImplementation path binding comment => m!"{path}: `export const {binding}` is \
      missing, which the module takes with the comment of the theory right above it:\n{comment}"
  | .implementationComment path line text comment => m!"{path}:{line}: `{text}` takes the \
      comment of the theory right above it:\n{comment}"
  | .arguments => m!"The translator takes the directory of the theory of a package, such as \
      `Presentation`, and the directory of the source of the package to write the files of \
      TypeScript into."
  | .fuel expression => m!"`{expression}` has no translation, as reading it takes more steps than \
      its depth and the unfoldings of the translator allow."

end Translator
