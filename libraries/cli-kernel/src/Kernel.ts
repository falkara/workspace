// Imported by submodule rather than the package root. The root barrel eagerly loads the whole platform, undici included, which no Falkara binary uses.
import * as NodeServices from '@effect/platform-node/NodeServices';
import { Layer } from 'effect';
import * as Capabilities from '#src/Capabilities.ts';
import * as Paths from '#src/Paths.ts';
import * as Telemetry from '#src/Telemetry.ts';
import * as Ui from '#src/Ui.ts';

// `Ui` and `Paths` need nothing from each other and merge as siblings. `Capabilities` and the platform sit underneath them, because `Ui` is built from the terminal and what it permits and `Paths` resolves against the filesystem.
const services = Layer.mergeAll(Ui.layer, Paths.layer).pipe(
  Layer.provideMerge(Capabilities.layer),
  Layer.provideMerge(NodeServices.layer),
);

/**
 * Every service a Falkara binary runs on, wired for the binary that asked.
 *
 * Nothing is consumed on the way: commands read `Ui`, `Capabilities` and the
 * platform services themselves, and the tracer reads `ConfigDirectory`,
 * `FileSystem` and `Path` out of the same set.
 *
 * The tracer is composed in here rather than provided alongside, because it
 * only flushes when its scope closes and so has to be acquired after everything
 * it writes through and released before any of it. Providing the two
 * separately leaves that ordering to whoever writes the entry point, where
 * getting it wrong drops the one trace a run exists to send and reports
 * nothing.
 *
 * @param binary What the traces this run produces are attributed to.
 */
export const layerFor = (binary: Telemetry.Service) =>
  Telemetry.layer(binary).pipe(Layer.provideMerge(services));
