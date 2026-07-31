/**
 * What a Falkara CLI can be asked to do about the recorded telemetry decision.
 *
 * A package of its own rather than part of the kernel, because a command is not
 * a service: the kernel holds the decision and reads it, this holds the one
 * place a user changes it.
 */
export * as Consent from '#src/Surface.ts';
