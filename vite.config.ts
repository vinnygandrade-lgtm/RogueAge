import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

const LEGACY_STATIC_PREFIXES = ['/js/', '/db/', '/css/', '/assets/'];

/** Em dev/preview, serve pastas estáticas legadas a partir da raiz do repo. */
function legacyStaticDirsPlugin() {
  const serve = sirv(repoRoot, { dev: true, etag: true, single: false });

  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, res, next) => {
      const url = (req.url ?? '').split('?')[0];
      if (!LEGACY_STATIC_PREFIXES.some((prefix) => url.startsWith(prefix))) {
        next();
        return;
      }
      serve(req, res, next);
    });
  };

  return {
    name: 'l2mini-legacy-static-dirs',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

/**
 * Cópia física para dist/ (sem symlinks — OneDrive partia dist/js e o login morria no preview).
 * IMPORTANT: dist/assets também recebe chunks do Vite — nunca apagar essa pasta inteira.
 */
function copyLegacyDirsPlugin() {
  const wipeAndCopy = [
    ['css', 'css'],
    ['js', 'js'],
    ['db', 'db'],
  ] as const;

  /** Mescla src dentro de dest sem remover ficheiros já gerados pelo Vite (ex.: index-*.js). */
  function mergeCopyDir(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        mergeCopyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'l2mini-copy-legacy-dirs',
    closeBundle() {
      const outDir = path.resolve(repoRoot, 'dist');

      const gameAssetsSrc = path.resolve(repoRoot, 'assets');
      const gameAssetsDest = path.resolve(outDir, 'assets');
      if (fs.existsSync(gameAssetsSrc)) {
        mergeCopyDir(gameAssetsSrc, gameAssetsDest);
      }

      for (const [srcRel, destRel] of wipeAndCopy) {
        const src = path.resolve(repoRoot, srcRel);
        const dest = path.resolve(outDir, destRel);
        if (!fs.existsSync(src)) continue;
        fs.rmSync(dest, { recursive: true, force: true });
        fs.cpSync(src, dest, { recursive: true, dereference: true });
      }

      const manifest = path.resolve(repoRoot, 'manifest.webmanifest');
      if (fs.existsSync(manifest)) {
        fs.copyFileSync(manifest, path.resolve(outDir, 'manifest.webmanifest'));
      }
    },
  };
}

export default defineConfig({
  root: repoRoot,
  publicDir: false,
  plugins: [legacyStaticDirsPlugin(), copyLegacyDirsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(repoRoot, 'index.html'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: 'localhost',
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/playwright-report/**',
        '**/test-results/**',
        '**/assets/**',
        '**/.git/**',
        '**/*.sql',
      ],
    },
  },
});
