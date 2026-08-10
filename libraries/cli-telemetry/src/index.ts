/**
 * What a Falkara CLI can be asked to do about the recorded telemetry decision.
 *
 * A package of its own because not every binary can offer these commands. One
 * run through `npm create` is never on a user's path, so there is no name they
 * could type to reach them, and a binary in that position depends on this
 * package not at all. Held in `cli-core` instead, every binary would declare a
 * dependency on commands half of them cannot mount.
 */
export * as Telemetry from '#src/Surface.ts';
