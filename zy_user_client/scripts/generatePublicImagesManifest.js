const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUT_FILE = path.join(__dirname, '../src/data/publicImagesManifest.json');
const IMAGE_EXT = /\.(png|jpe?g|svg|gif|webp)$/i;
const SKIP_DIRS = new Set(['css']);

function walkImages(dir, basePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const rel = basePath ? `${basePath}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      paths.push(...walkImages(full, rel));
      continue;
    }

    if (IMAGE_EXT.test(entry.name)) {
      paths.push(rel.replace(/\\/g, '/'));
    }
  }

  return paths;
}

function groupByFolder(paths) {
  const folders = {};

  for (const publicPath of paths) {
    const slash = publicPath.lastIndexOf('/');
    const folder = slash === -1 ? '(raíz)' : publicPath.slice(0, slash);
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(publicPath);
  }

  return Object.keys(folders)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((name) => ({
      name,
      items: folders[name]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((publicPath) => ({
          publicPath,
          url: `/${publicPath}`,
        })),
    }));
}

const paths = walkImages(PUBLIC_DIR).sort((a, b) => a.localeCompare(b, 'es'));
const manifest = {
  generatedAt: new Date().toISOString(),
  total: paths.length,
  folders: groupByFolder(paths),
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`publicImagesManifest: ${paths.length} images in ${manifest.folders.length} folders`);
