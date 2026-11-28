module

public import TranslatorTest.Fixture.Bell
public import TranslatorTest.Fixture.Carillon
public import Mathlib.Data.Seq.Defs

import Falkara.Counterpart
import Mathlib.Data.Stream.Init

/-!
# Organ

The module defines the systems and the theorems that the checks of the translator write as tests
that draw a system: the curried functor of the tones, the product functor of Mathlib as it stands,
whose declaration names the fields of the product that it gives, an organ, which is a coalgebra of
the functions from a type of keys into the products with a type of tones, the tones that an organ
plays upon a stream of keys, its sounds, which keep the next state beside every tone, the organ
that transposes every tone, and a music box, which is a coalgebra of the products of a type of
tones with the functions from a type of keys. The theorems that the checks write state the tones
of an organ by its first step, by its sounds, and by the organ that transposes it, the peal and
the answer of a bell of the module `Bell`, the state that a key leads a music box to, and the
values and the streams that hold no system. The theorems that the checks refuse each state what a
test has no form for.
-/

@[expose] public section

namespace Geometry

open CategoryTheory

/-- The curried functor of the tones, which maps every type of tones to the functor that gives a
tone and the next state. -/
abbrev tonesFunctor := Limits.Types.binaryProductFunctor

attribute [counterpart
  typescript
    r"The curried functor of the tones, which maps every type of tones to the functor that gives a
    tone and the next state."
    (X → "Tone")
    (Prod → "Sound"
      r"A sound of an organ, a tone and the next state.")
    (fst → "tone"
      r"The tone that the organ sounds.")
    (snd → "next"
      r"The state that follows the state.")
    instance
      r"Gives the gear of the functor of the tones at a type of tones."] tonesFunctor

/-- An organ that sounds a tone upon every key and moves to its next state. -/
abbrev Organ (Key Tone : Type) :=
  Endofunctor.Coalgebra (GearTrain (tonesFunctor.obj Tone) (dialsFunctor.obj (Opposite.op Key)))

attribute [counterpart
  typescript
    r"An organ that sounds a tone upon every key and moves to its next state."
    constructor
      r"Creates an organ from the function that gives its tone and its next state upon a key."]
  Organ

/-- The tones that an organ plays from a state upon the keys one after another. -/
def Organ.play {Key Tone : Type} (organ : Organ Key Tone) (state : organ.V)
    (keys : Stream' Key) : Stream' Tone :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Key ⟶ Tone × organ.V := organ.str current
      ((step rest.head).1, (step rest.head).2, rest.tail))
    (state, keys)

attribute [counterpart
  typescript
    r"The tones that an organ plays from a state upon the keys one after another."] Organ.play

/-- The sounds of an organ from a state upon the keys one after another, every tone with the next
state. -/
def Organ.sounds {Key Tone : Type} (organ : Organ Key Tone) (state : organ.V)
    (keys : Stream' Key) : Stream' ((tonesFunctor.obj Tone).obj organ.V) :=
  Stream'.corec'
    (fun (current, rest) ↦
      let step : Key ⟶ Tone × organ.V := organ.str current
      (step rest.head, (step rest.head).2, rest.tail))
    (state, keys)

attribute [counterpart
  typescript
    r"The sounds of an organ from a state upon the keys one after another, every tone with the next
    state."] Organ.sounds

/-- The organ that transposes every tone of an organ by an interval, upon the state space of the
organ. -/
def Organ.transpose {Key Tone Transposed : Type} (organ : Organ Key Tone)
    (interval : (tone : Tone) → Transposed) : Organ Key Transposed where
  V := organ.V
  str := TypeCat.ofHom fun state ↦
    let step : Key ⟶ Tone × organ.V := organ.str state
    (TypeCat.ofHom fun key ↦ (interval (step key).1, (step key).2) :
      Key ⟶ Transposed × organ.V)

attribute [counterpart
  typescript
    r"The organ that transposes every tone of an organ by an interval, upon the state space of the
    organ."] Organ.transpose

/-- A music box that sounds a tone from every state and moves to its next state upon a key. -/
abbrev MusicBox (Key Tone : Type) :=
  Endofunctor.Coalgebra (GearTrain (dialsFunctor.obj (Opposite.op Key)) (tonesFunctor.obj Tone))

attribute [counterpart
  typescript
    r"A music box that sounds a tone from every state and moves to its next state upon a key."
    constructor
      r"Creates a music box from the function that gives its tone and its next state upon a key."]
  MusicBox

namespace Organ

/-- The tones of an organ at a state upon a stream of keys open with the tone that the organ sounds
upon the first key and go on with the tones at the next state upon the rest of the keys. -/
theorem play_eq {Key Tone : Type} (organ : Organ Key Tone) (state : organ.V)
    (keys : Stream' Key) :
    let step : Key ⟶ Tone × organ.V := organ.str state
    organ.play state keys =
      Stream'.cons (step keys.head).1 (organ.play (step keys.head).2 keys.tail) :=
  Stream'.corec'_eq _ _

attribute [counterpart
  typescript
    r"The tones of an organ open with the tone upon the first key and go on with the tones at the
    next state upon the rest of the keys."] play_eq

/-- The tones of an organ at a state upon a stream of keys are the tones of its sounds. -/
theorem play_eq_map_sounds {Key Tone : Type} (organ : Organ Key Tone) (state : organ.V)
    (keys : Stream' Key) : organ.play state keys = (organ.sounds state keys).map Prod.fst := by
  simp only [Organ.play, Organ.sounds, Stream'.corec', Stream'.corec_def]
  rfl

attribute [counterpart
  typescript
    r"The tones of an organ are the tones of its sounds."] play_eq_map_sounds

/-- The tones of the organ that transposes every tone of an organ are the transposed tones of the
organ. -/
theorem play_transpose {Key Tone Transposed : Type} (organ : Organ Key Tone)
    (interval : (tone : Tone) → Transposed) (state : organ.V) (keys : Stream' Key) :
    (organ.transpose interval).play state keys = (organ.play state keys).map interval := by
  refine Stream'.eq_of_bisim (fun first second ↦ ∃ current rest,
    first = (organ.transpose interval).play current rest ∧
      second = (organ.play current rest).map interval) ?_ ⟨state, keys, rfl, rfl⟩
  rintro _ _ ⟨current, rest, rfl, rfl⟩
  refine ⟨rfl, _, rest.tail, congrArg Stream'.tail (Organ.play_eq _ _ _), ?_⟩
  -- The state of the transposed organ is one of the organ, which a rewrite finds by unfolding.
  erw [Organ.play_eq organ current rest, Stream'.map_cons]
  rfl

attribute [counterpart
  typescript
    r"The tones of the organ that transposes every tone of an organ are the transposed tones of the
    organ."] play_transpose

/-- The sound of an organ upon a key is the pair of its tone and its next state, as the functor of
the tones names them. -/
theorem sound_eq {Key Tone : Type} (organ : Organ Key Tone) (state : organ.V) (key : Key) :
    let step : Key ⟶ Tone × organ.V := organ.str state
    @Eq ((tonesFunctor.obj Tone).obj organ.V) (step key) ((step key).1, (step key).2) :=
  rfl

attribute [counterpart
  typescript
    r"The sound of an organ upon a key is its tone beside its next state."] sound_eq

end Organ

namespace Bell

/-- The peal of a bell at a state opens with the chime that the bell rings from the state and goes
on with the peal at the next state. -/
theorem peal_eq {B : Type} (bell : Bell B) (state : bell.V) :
    bell.peal state = Stream'.cons (bell.str state).1 (bell.peal (bell.str state).2) :=
  Stream'.corec'_eq _ _

attribute [counterpart
  typescript
    r"The peal of a bell opens with the chime that the bell rings and goes on with the peal at the
    next state."] peal_eq

/-- The answer of a bell to the chimes it hears pairs every chime it hears with a chime of its
peal. -/
theorem answer_eq {B : Type} (bell : Bell B) (state : bell.V) (heard : Stream' B) :
    bell.answer state heard = Stream'.zip Prod.mk heard (bell.peal state) :=
  rfl

attribute [counterpart
  typescript
    r"The answer of a bell pairs every chime it hears with a chime of its peal."] answer_eq

/-- The first chimes of the answer of a bell are the chimes that the bell hears. -/
theorem map_fst_answer {B : Type} (bell : Bell B) (state : bell.V) (heard : Stream' B) :
    (bell.answer state heard).map Prod.fst = heard :=
  rfl

attribute [counterpart
  typescript
    r"The first chimes of the answer of a bell are the chimes that the bell hears."] map_fst_answer

/-- The first chime of the peal of a bell at a state is the chime that the bell rings from the
state, which a test has no form for, as a stream that the test does not draw gives its first
element by an effect. -/
theorem head_peal {B : Type} (bell : Bell B) (state : bell.V) :
    (bell.peal state).head = (bell.str state).1 :=
  rfl

/-- The stream that repeats the peal of a bell goes on after its first peal as it began, which a
test has no form for, as its elements are streams. -/
theorem tail_const_peal {B : Type} (bell : Bell B) (state : bell.V) :
    (Stream'.const (bell.peal state)).tail = Stream'.const (bell.peal state) :=
  rfl

end Bell

namespace MusicBox

/-- The state that a key leads a music box to from a state is the state that the transition of
the state gives upon the key. -/
theorem snd_str_apply {Key Tone : Type} (box : MusicBox Key Tone) (state : box.V) (key : Key) :
    let step : Tone × (Key ⟶ box.V) := box.str state
    (step.1, step.2 key).2 = step.2 key :=
  rfl

attribute [counterpart
  typescript
    r"The state that a key leads a music box to is the state that its transition gives upon the
    key."] snd_str_apply

end MusicBox

/-- The pair of the parts of the pair of a pause and a toll is the pair of the pause and the
toll. -/
theorem mk_fst_snd_pause_toll {B : Type} (pause : Option B) (toll : PUnit ⊕ B) :
    ((pause, toll).1, (pause, toll).2) = (pause, toll) :=
  rfl

attribute [counterpart
  typescript
    r"The pair of the parts of the pair of a pause and a toll is the pair of the pause and the
    toll."] mk_fst_snd_pause_toll

/-- The first rest before the rests after it gives the rests. -/
theorem cons_head_tail_rests (rests : Stream' PUnit) :
    Stream'.cons rests.head rests.tail = rests :=
  Stream'.eta rests

attribute [counterpart
  typescript
    r"The first rest before the rests after it gives the rests."] cons_head_tail_rests

/-- The first part of the pair of a state of a carillon with itself is the state, which a test has
no form for, as the carillon rings in a monad that is a variable. -/
theorem Carillon.fst_state {B : Type} {m : Type → Type} [Monad m] [LawfulMonad m]
    (carillon : Carillon B m) (state : carillon.V) : (state, state).1 = state :=
  rfl

/-- The chime that a choice gives from two chimes is the chime that it gives from the pair of
their parts, which a test has no form for, as the choice is a function from pairs. -/
theorem choice_mk_fst_snd {B : Type} (choice : (chimes : B × B) → B) (chimes : B × B) :
    choice (chimes.1, chimes.2) = choice chimes :=
  rfl

/-- The first chimes of a stream of chimes beside itself are the chimes of the stream, which a
test has no form for, as it zips two streams into pairs alone. -/
theorem zip_first {B : Type} (heard : Stream' B) :
    Stream'.zip (fun first _ ↦ first) heard heard = heard :=
  rfl

/-- The first chimes of the pairs of two streams of chimes are the chimes of the first, which a
test has no form for, as it draws one stream alone to compare a prefix as long. -/
theorem map_fst_zip {B : Type} (first second : Stream' B) :
    (Stream'.zip Prod.mk first second).map Prod.fst = first :=
  rfl

/-- The sequence of no chimes gives no first chime, which a test has no form for yet, as a stream
of Effect gives its first element by an effect. -/
theorem destruct_nil {B : Type} : (Stream'.Seq.nil : Stream'.Seq B).destruct = none :=
  rfl

end Geometry
