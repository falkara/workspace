module

meta import Falkara.ExportTypeScript
public import GeneratorTest.Fixture.Coordinate

/-!
# Walker

The module defines the declarations with type parameters that the checks of the generator write: a
step, which reaches a state and leaves a trace, the move that gives a step from a state upon an
input, a walker that takes a move, and the state a walker reaches. The module defines as well a
course, a structure without type parameters whose field is a function and names the coordinate of
another module of the theory.

## Main Definitions

- `Step`: a step of a walk, the state it reaches and the trace it leaves.
- `Step.Move`: a function that gives the step from a state upon an input.
- `Walker`: a walker that takes a step upon every input.
- `Walker.next`: gives the state a walker reaches from a state upon an input.
- `Course`: a course that turns every coordinate into another.
-/

@[expose] public section

namespace Geometry

/-- A step of a walk, the state it reaches and the trace it leaves. -/
structure Step (State Trace : Type) where
  /-- The state the step reaches. -/
  state : State
  /-- The trace the step leaves. -/
  trace : Trace

attribute [export_typescript] Step

/-- A function that gives the step from a state upon an input. -/
abbrev Step.Move (State Input Trace : Type) : Type :=
  (currentState : State) → (input : Input) → Step State Trace

attribute [export_typescript] Step.Move

/-- A walker that takes a step upon every input. -/
structure Walker (State Input Trace : Type) where
  /-- The function that gives the step of the walker from a state upon an input. -/
  move : Step.Move State Input Trace

attribute [export_typescript] Walker

/-- Gives the state a walker reaches from a state upon an input. -/
def Walker.next {State Input Trace : Type} (walker : Walker State Input Trace) (state : State)
    (input : Input) : State :=
  (walker.move state input).state

attribute [export_typescript] Walker.next

/-- A course that turns every coordinate into another. -/
structure Course where
  /-- The function that gives the coordinate the course turns a coordinate into. -/
  turn : (coordinate : Coordinate) → Coordinate

attribute [export_typescript] Course

end Geometry
