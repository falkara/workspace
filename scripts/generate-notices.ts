#!/usr/bin/env bun

import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';

// The bundle is the only truthful source for what is being redistributed: tree-shaking decides membership, so reading the manifests instead would list packages that never made it into the artifact.
const applicationDirectory = path.resolve(process.argv[2] ?? '.');
const bundlePath = path.join(applicationDirectory, 'dist', 'index.mjs');
const bundle = fs.readFileSync(bundlePath, 'utf8');

const bundled = new Set<string>();
for (const [, name] of bundle.matchAll(/node_modules\/((?:@[\w.-]+\/)?[\w.-]+)/g)) {
  if (name !== undefined && name !== '.bun') {
    bundled.add(name);
  }
}

if (bundled.size === 0) {
  console.error(`${bundlePath} names no bundled packages; refusing to write empty notices.`);
  process.exit(1);
}

const findPackageDirectory = (entry: string, name: string): string | undefined => {
  let directory = path.dirname(entry);
  while (directory !== path.dirname(directory)) {
    const manifest = path.join(directory, 'package.json');
    if (fs.existsSync(manifest)) {
      try {
        if (JSON.parse(fs.readFileSync(manifest, 'utf8')).name === name) {
          return directory;
        }
      } catch {
        // A malformed manifest above the entry is somebody else's problem; keep climbing.
      }
    }
    directory = path.dirname(directory);
  }
  return undefined;
};

// Transitive packages are not resolvable from the application, only from whichever package dragged them in, so every resolved directory joins the search roots until the set stops growing.
const roots = [applicationDirectory];
const resolved = new Map<string, string>();
let progressed = true;
while (progressed) {
  progressed = false;
  for (const name of bundled) {
    if (resolved.has(name)) {
      continue;
    }
    for (const root of roots) {
      let entry: string;
      try {
        entry = createRequire(path.join(root, 'resolve.js')).resolve(name);
      } catch {
        continue;
      }
      const directory = findPackageDirectory(entry, name);
      if (directory !== undefined) {
        resolved.set(name, directory);
        roots.push(fs.realpathSync(directory));
        progressed = true;
        break;
      }
    }
  }
}

const missing = [...bundled].filter((name) => !resolved.has(name));
if (missing.length > 0) {
  console.error(`Bundled but not resolvable from ${applicationDirectory}: ${missing.join(', ')}`);
  process.exit(1);
}

const licenseText = (directory: string): string | undefined => {
  const candidate = fs.readdirSync(directory).find((file) => /^licen[cs]e/i.test(file));
  return candidate === undefined
    ? undefined
    : fs.readFileSync(path.join(directory, candidate), 'utf8').trimEnd();
};

const rule = '-'.repeat(70);
const sections = [...resolved.keys()].sort().map((name) => {
  const directory = resolved.get(name) as string;
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  const text = licenseText(directory);
  if (text === undefined) {
    console.error(`${name} ships no license file; its terms cannot be reproduced.`);
    process.exit(1);
  }
  return [rule, `${name} ${manifest.version} (${manifest.license})`, rule, '', text, ''].join('\n');
});

const header = [
  'This package is distributed as a single bundled file that includes the',
  'third-party software listed below. Each is used under its own terms,',
  'reproduced in full.',
  '',
];

fs.writeFileSync(
  path.join(applicationDirectory, 'THIRD-PARTY-NOTICES'),
  [...header, ...sections].join('\n'),
);
console.log(
  `THIRD-PARTY-NOTICES: ${resolved.size} packages for ${path.basename(applicationDirectory)}`,
);
