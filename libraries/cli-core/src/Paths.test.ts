import { NodeServices } from '@effect/platform-node';
import { ConfigProvider, Effect } from 'effect';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import * as Host from '#src/Host.ts';
import * as Paths from '#src/Paths.ts';

const home = '/home/tester';

const machineOn = (platform: string): Host.Machine => ({
  platform,
  architecture: 'arm64',
  runtimeVersion: '24.0.0',
  homeDirectory: home,
});

// The environment and the host are both supplied, so every branch is reachable from whichever machine happens to be running the suite.
const resolve = (platform: string, env: Record<string, string>): Promise<string> =>
  Effect.gen(function* () {
    return yield* Paths.ConfigDirectory;
  }).pipe(
    Effect.provide(Paths.layer),
    Effect.provideService(Host.Machine, machineOn(platform)),
    Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromEnv({ env })),
    Effect.provide(NodeServices.layer),
    Effect.runPromise,
  );

describe('ConfigDirectory', () => {
  it('honors an absolute XDG_CONFIG_HOME on every platform', async () => {
    for (const platform of ['linux', 'darwin', 'win32']) {
      expect(await resolve(platform, { XDG_CONFIG_HOME: '/custom/config' })).toBe(
        join('/custom/config', 'falkara'),
      );
    }
  });

  // The specification requires these variables to hold absolute paths and has a relative one treated as invalid. Honoring one would resolve against the working directory, so a decision recorded under one directory would be unreadable from the next.
  it('ignores a relative XDG_CONFIG_HOME', async () => {
    expect(await resolve('linux', { XDG_CONFIG_HOME: 'relative-config' })).toBe(
      join(home, '.config', 'falkara'),
    );
  });

  it('ignores an empty XDG_CONFIG_HOME', async () => {
    expect(await resolve('linux', { XDG_CONFIG_HOME: '' })).toBe(join(home, '.config', 'falkara'));
  });

  it('falls back to the host convention on darwin', async () => {
    expect(await resolve('darwin', {})).toBe(
      join(home, 'Library', 'Application Support', 'falkara'),
    );
  });

  it('falls back to the host convention on linux', async () => {
    expect(await resolve('linux', {})).toBe(join(home, '.config', 'falkara'));
  });

  it('honors an absolute APPDATA on win32', async () => {
    expect(await resolve('win32', { APPDATA: '/Users/tester/AppData/Roaming' })).toBe(
      join('/Users/tester/AppData/Roaming', 'falkara'),
    );
  });

  it('ignores a relative APPDATA on win32', async () => {
    expect(await resolve('win32', { APPDATA: 'AppData/Roaming' })).toBe(
      join(home, '.config', 'falkara'),
    );
  });

  // APPDATA is a Windows convention and says nothing about where config belongs on a host that also happens to set it.
  it('ignores APPDATA away from win32', async () => {
    expect(await resolve('darwin', { APPDATA: '/Users/tester/AppData/Roaming' })).toBe(
      join(home, 'Library', 'Application Support', 'falkara'),
    );
  });
});
