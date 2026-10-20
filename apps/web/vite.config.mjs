import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createApplication } from '../api/src/app.mjs';

export default defineConfig({
  root: "apps/web",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/*.sqlite*', '**/var/**', '**/backups/**', '**/prototype/**', '**/docs/**', '**/apps/api/**', '**/packages/database/**', '**/packages/media/**'],
    },
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: 'teranga-local-api',
    configureServer(server) {
      const application = createApplication();
      server.middlewares.use((req, res, next) => {
        let path;
        try { path = decodeURIComponent((req.url || '').split('?')[0]); } catch { res.statusCode=400; res.end('Requête invalide'); return; }
        if (/^\/(data|server)(\/|$)/.test(path) || path.startsWith('/qa/runtime-test') || /\.sqlite(?:$|[-./])/.test(path)) {
          res.statusCode=403; res.end('Accès interdit'); return;
        }
        next();
      });
      server.middlewares.use((req, res, next) => { void application.handler(req, res, next); });
      server.httpServer?.once('close', () => application.close());
    },
  }],
});
