import { Cause, Effect, Exit, Option, Schema } from 'effect';
import { describe, expect, it } from 'vite-plus/test';
import * as Binary from '#src/Binary.ts';

const decode = (manifest: unknown) =>
  Effect.runPromise(Effect.exit(Schema.decodeUnknownEffect(Binary.Manifest)(manifest)));

const succeeds = async (manifest: unknown) => {
  const exit = await decode(manifest);
  if (Exit.isFailure(exit)) {
    throw new Error(`expected success, got: ${Cause.pretty(exit.cause)}`);
  }
  return exit.value;
};

const fails = async (manifest: unknown) => {
  const exit = await decode(manifest);
  if (Exit.isSuccess(exit)) {
    throw new Error(`expected failure, got: ${JSON.stringify(exit.value)}`);
  }
  return Option.getOrUndefined(Cause.findErrorOption(exit.cause));
};

const valid = {
  bin: { falkara: './dist/index.mjs' },
  version: '1.0.0',
  description: 'Command line access to everything Falkara Workspace.',
};

describe('Manifest', () => {
  it('takes the installed name from the key of bin, not from the package name', async () => {
    const manifest = await succeeds(valid);

    expect(manifest.name).toBe('falkara');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.description).toBe(valid.description);
  });

  it('refuses a manifest that declares no executable', async () => {
    expect(await fails({ ...valid, bin: {} })).toBeDefined();
  });

  it('refuses a manifest with no bin at all', async () => {
    const { bin: _bin, ...withoutBin } = valid;

    expect(await fails(withoutBin)).toBeDefined();
  });

  it('refuses a manifest missing the fields help output is built from', async () => {
    const { description: _description, ...withoutDescription } = valid;
    const { version: _version, ...withoutVersion } = valid;

    expect(await fails(withoutDescription)).toBeDefined();
    expect(await fails(withoutVersion)).toBeDefined();
  });

  // A package declaring two executables is unusual but legal, and the first is as good an answer as any.
  it('takes the first executable when a package declares several', async () => {
    const manifest = await succeeds({
      ...valid,
      bin: { falkara: './dist/index.mjs', 'falkara-legacy': './dist/legacy.mjs' },
    });

    expect(manifest.name).toBe('falkara');
  });

  it('refuses values that are not strings', async () => {
    expect(await fails({ ...valid, version: 1 })).toBeDefined();
    expect(await fails({ ...valid, bin: { falkara: 42 } })).toBeDefined();
    expect(await fails('not a manifest')).toBeDefined();
  });
});
