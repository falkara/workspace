module

public import GeneratorTest.Fixture.Coordinate

import Falkara.Counterpart

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

attribute [counterpart
  typescript
    r"A step of a walk, the state it reaches and the trace it leaves."
    (state
      r"The state the step reaches.")
    (trace
      r"The trace the step leaves.")] Step

/-- A function that gives the step from a state upon an input. -/
abbrev Step.Move (State Input Trace : Type) : Type :=
  (currentState : State) → (input : Input) → Step State Trace

attribute [counterpart
  typescript
    r"A function that gives the step from a state upon an input."] Step.Move

/-- A walker that takes a step upon every input. -/
structure Walker (State Input Trace : Type) where
  /-- The function that gives the step of the walker from a state upon an input. -/
  move : Step.Move State Input Trace

attribute [counterpart
  typescript
    r"A walker that takes a step upon every input."
    (move
      r"The function that gives the step of the walker from a state upon an input.")] Walker

/-- Gives the state a walker reaches from a state upon an input. -/
def Walker.next {State Input Trace : Type} (walker : Walker State Input Trace) (state : State)
    (input : Input) : State :=
  (walker.move state input).state

attribute [counterpart
  typescript
    r"Gives the state a walker reaches from a state upon an input."] Walker.next

/-- A course that turns every coordinate into another. -/
structure Course where
  /-- The function that gives the coordinate the course turns a coordinate into. -/
  turn : (coordinate : Coordinate) → Coordinate

attribute [counterpart
  typescript
    r"A course that turns every coordinate into another."
    (turn
      r"The function that gives the coordinate the course turns a coordinate into.")] Course

end Geometry
