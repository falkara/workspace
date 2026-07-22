/**
 * The workspace commands and the services they run on.
 *
 * Commands are exported as builders rather than assembled CLIs: the name a
 * command answers to depends on where it is mounted, and only the entry point
 * knows that.
 */
export * as Create from './Create.ts';
export * as Errors from './Errors.ts';
export * as Capabilities from './Capabilities.ts';
export * as Consent from './Consent.ts';
export * as Paths from './Paths.ts';
export * as Report from './Report.ts';
export * as Telemetry from './Telemetry.ts';
export * as Ui from './Ui.ts';
