/**
 * The services every Falkara binary runs on.
 *
 * No commands: this package answers questions about the environment a run
 * happens in — what the terminal permits, where state lives, what may be
 * reported and to whom — and knows nothing about what any of them are for.
 * Commands live in the packages named after the domain they serve, and depend
 * on this one.
 *
 * `Env` and `Text` are deliberately absent. Both are implementation detail of
 * the services above them, and exporting a module that nothing outside this
 * package consumes is how it acquires callers it was never designed for.
 */
export * as Ask from '#src/Ask.ts';
export * as Capabilities from '#src/Capabilities.ts';
export * as Consent from '#src/Consent.ts';
export * as Files from '#src/Files.ts';
export * as Guidance from '#src/Guidance.ts';
export * as Host from '#src/Host.ts';
export * as Kernel from '#src/Kernel.ts';
export * as Package from '#src/Package.ts';
export * as Paths from '#src/Paths.ts';
export * as Telemetry from '#src/Telemetry.ts';
export * as Ui from '#src/Ui.ts';
