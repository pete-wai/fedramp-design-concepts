import fs from 'node:fs';
import path from 'node:path';

export function validId(id) {
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 64) {
    throw new Error('Prototype ID must be 1–64 lowercase letters, digits, and single hyphens.');
  }
  return id;
}

export function validBase(value = '') {
  if (value === '' || value === '/') return '';
  const base = value.replace(/\/$/, '');
  if (!/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(base)) {
    throw new Error('Base must be empty or a path such as /repository/prototype-id.');
  }
  return base;
}

export function listVariants(projectRoot) {
  const directory = path.join(projectRoot, 'prototypes');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    .map((entry) => {
      validId(entry.name);
      const folder = path.join(directory, entry.name);
      const metadata = JSON.parse(fs.readFileSync(path.join(folder, 'prototype.json'), 'utf8'));
      return { ...metadata, id: entry.name, folder };
    }).sort((a, b) => a.id.localeCompare(b.id));
}

export function createVariant(projectRoot, id, parent) {
  validId(id);
  if (parent) validId(parent);
  const source = parent ? path.join(projectRoot, 'prototypes', parent) : path.join(projectRoot, 'starter');
  const destination = path.join(projectRoot, 'prototypes', id);
  if (!fs.existsSync(path.join(source, 'package.json'))) throw new Error(`Starter/parent not found: ${source}`);
  if (fs.existsSync(destination)) throw new Error(`Prototype ${id} already exists; choose another ID.`);
  const excluded = new Set(['node_modules', '.svelte-kit', 'build', '_site', '.git', 'output', 'test-results', 'playwright-report', '.DS_Store']);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (item) => {
      const name = path.basename(item);
      if (excluded.has(name) || (name.startsWith('.env') && name !== '.env.example')) return false;
      if (fs.lstatSync(item).isSymbolicLink()) throw new Error(`Cannot clone a symbolic link: ${item}`);
      return true;
    }
  });
  const prior = JSON.parse(fs.readFileSync(path.join(source, 'prototype.json'), 'utf8'));
  const { iteration, status, archivedAt, archiveReason, archiveNotice, ...inherited } = prior;
  const metadata = { ...inherited, status: 'active', id, title: id === 'baseline' ? 'Reference baseline' : id.split('-').join(' '), parent: parent || null, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(destination, 'prototype.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(path.join(destination, 'iteration.md'), `# ${metadata.title}\n\nCreated from ${parent || `starter ${metadata.starterVersion}`}.\n\n## Feedback and changes\n\nNo experimental changes yet. Keep participant observations in research notes, outside the built site.\n`);
  return destination;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
