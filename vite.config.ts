import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    ...(isSsrBuild
      ? {}
      : {
          // Only split vendor chunks on client build; SSR treats these deps as externals.
          rollupOptions: {
            output: {
              manualChunks: {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                'supabase-vendor': ['@supabase/supabase-js'],
                'ui-vendor': [
                  '@radix-ui/react-dialog',
                  '@radix-ui/react-dropdown-menu',
                  '@radix-ui/react-select',
                ],
                'query-vendor': ['@tanstack/react-query'],
              },
            },
          },
        }),
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Use esbuild for faster minification (built-in, no extra dependencies)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
    ],
  },
}));
