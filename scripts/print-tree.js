#!/usr/bin/env node
/*
 Minimal file tree printer.
 Usage:
  - npx node scripts/print-tree.js [startPath]
  - or via npm script: npm run tree [-- path]
*/

import fs from 'fs';
import path from 'path';

const defaultRoot = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

// Ignored directories and files
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.cache', '.next', 'coverage', '.turbo', '.idea', '.vscode'
]);
const IGNORE_FILES = new Set(['.DS_Store']);

function isIgnored(name, fullPath) {
  if (IGNORE_FILES.has(name)) return true;
  try {
    const stat = fs.lstatSync(fullPath);
    if (stat.isDirectory()) {
      if (IGNORE_DIRS.has(name)) return true;
    }
  } catch {
    return true;
  }
  return false;
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function sortEntries(entries) {
  return entries
    .slice()
    .sort((a, b) => {
      // Directories first, then files; alphabetical within groups
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
}

function printTree(dir, prefix = '') {
  const entries = sortEntries(readDirSafe(dir)).filter((ent) => !isIgnored(ent.name, path.join(dir, ent.name)));
  entries.forEach((ent, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    const fullPath = path.join(dir, ent.name);

    console.log(prefix + connector + ent.name + (ent.isDirectory() ? '/' : ''));

    if (ent.isSymbolicLink?.()) return; // avoid following symlinks if supported

    if (ent.isDirectory()) {
      printTree(fullPath, nextPrefix);
    }
  });
}

function run() {
  const rootName = path.basename(defaultRoot);
  console.log(rootName + '/');
  printTree(defaultRoot, '');
}

run();


