import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { parse } from 'yaml';

// Port: env PORT > config/config.yaml server.port > 5173.
function resolvePort(): number {
  const fromEnv = Number(process.env.PORT);
  if (fromEnv > 0) return fromEnv;
  try {
    const cfg = parse(readFileSync('config/config.yaml', 'utf8')) as {
      server?: { port?: number };
    } | null;
    const fromFile = Number(cfg?.server?.port);
    if (fromFile > 0) return fromFile;
  } catch {
    // no config.yaml — use the default
  }
  return 5173;
}

const port = resolvePort();

export default defineConfig({
  plugins: [react()],
  server: {
    port,
    host: true,
    strictPort: false,
  },
  preview: {
    port,
    host: true,
    strictPort: false,
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.{test,spec}.ts', 'src/lib/index.ts'],
    },
  },
});
