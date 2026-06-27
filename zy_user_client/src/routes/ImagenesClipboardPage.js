import React, { useMemo, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import manifest from '../data/publicImagesManifest.json';
import './ImagenesClipboardPage.css';

const blobToPng = async (blob) => {
  if (blob.type === 'image/png') return blob;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    ctx.drawImage(img, 0, 0);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png blob failed'))), 'image/png');
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const copyImageToClipboard = async (url) => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    throw new Error('clipboard image unsupported');
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch ${response.status}`);

  const blob = await response.blob();
  const pngBlob = await blobToPng(blob);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
};

const ImagenesClipboardPage = () => {
  const [query, setQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState('');
  const [copyingPath, setCopyingPath] = useState('');

  const filteredFolders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manifest.folders;

    return manifest.folders
      .map((folder) => ({
        ...folder,
        items: folder.items.filter(
          (item) =>
            item.publicPath.toLowerCase().includes(q) ||
            folder.name.toLowerCase().includes(q)
        ),
      }))
      .filter((folder) => folder.items.length > 0);
  }, [query]);

  const visibleCount = useMemo(
    () => filteredFolders.reduce((sum, folder) => sum + folder.items.length, 0),
    [filteredFolders]
  );

  const handleCopyImage = async (item) => {
    if (copyingPath) return;

    setCopyingPath(item.publicPath);
    try {
      await copyImageToClipboard(item.url);
      setCopiedPath(item.publicPath);
      toast.success(`Imagen copiada · ${item.publicPath.split('/').pop()}`, { autoClose: 1800 });
    } catch {
      toast.error('No se pudo copiar la imagen (usa HTTPS y un navegador compatible)');
    } finally {
      setCopyingPath('');
    }
  };

  return (
    <div className="imagenes-clipboard-page">
      <ToastContainer position="bottom-right" autoClose={1800} limit={4} />

      <header className="imagenes-clipboard-header">
        <div>
          <h1>Catálogo public → portapapeles</h1>
          <p>
            {visibleCount} de {manifest.total} imágenes · clic en Copiar imagen para pegar en el editor
            {manifest.generatedAt ? ` · ${manifest.generatedAt.slice(0, 10)}` : ''}
          </p>
        </div>
        <input
          type="search"
          className="imagenes-clipboard-search"
          placeholder="Buscar por nombre o carpeta…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {filteredFolders.length === 0 && (
        <p className="imagenes-clipboard-empty">Sin resultados para “{query}”.</p>
      )}

      {filteredFolders.map((folder) => (
        <section key={folder.name} className="imagenes-clipboard-section">
          <div className="imagenes-clipboard-section-head">
            <h2>{folder.name}/</h2>
            <span>{folder.items.length}</span>
          </div>

          <div className="imagenes-clipboard-grid">
            {folder.items.map((item) => {
              const fileName = item.publicPath.split('/').pop();
              const isCopied = copiedPath === item.publicPath;
              const isCopying = copyingPath === item.publicPath;

              return (
                <article
                  key={item.publicPath}
                  className={`imagenes-clipboard-card${isCopied ? ' imagenes-clipboard-card--copied' : ''}`}
                >
                  <div className="imagenes-clipboard-thumb-wrap">
                    <img src={item.url} alt={fileName} loading="lazy" />
                  </div>
                  <div className="imagenes-clipboard-path" title={item.publicPath}>
                    {item.publicPath}
                  </div>
                  <button
                    type="button"
                    className="imagenes-clipboard-btn imagenes-clipboard-btn--primary imagenes-clipboard-btn--full"
                    disabled={!!copyingPath}
                    onClick={() => void handleCopyImage(item)}
                  >
                    {isCopying ? 'Copiando…' : isCopied ? 'Copiada ✓' : 'Copiar imagen'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ImagenesClipboardPage;
