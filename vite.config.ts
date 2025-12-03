import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10kb
      deleteOriginFile: false,
    }),
    // Brotli compression (better compression ratio)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  base: '',
  
  // Pre-bundling optimization for faster dev server
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/styled-engine',
      '@mui/system',
      '@mui/icons-material',
      'react',
      'react-dom',
      'react-router-dom',
    ],
  },

  build: {
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },

    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Generate sourcemaps for debugging (set to false for smaller builds)
    sourcemap: false,

    // Rollup-specific optimizations
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // MUI core components
          'mui-core': [
            '@mui/material',
            '@mui/system',
            '@emotion/react',
            '@emotion/styled',
          ],
          
          // MUI icons (large dependency)
          'mui-icons': ['@mui/icons-material'],
          
          // Rich text editor (large dependency)
          'editor': ['react-quill-new', 'quill-image-resize-module-react'],
          
          // Emoji picker (large dependency)
          'emoji-picker': ['emoji-picker-react'],
          
          // State management
          'state': ['jotai'],
          
          // Utilities and other libraries
          'utils': ['short-unique-id', 'compressorjs', 'mediainfo.js'],
          
          // i18n
          'i18n': ['i18next', 'react-i18next'],
        },
        
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb as base64
  },

  // Performance optimizations
  server: {
    fs: {
      // Improve dev server performance
      strict: true,
    },
  },
});
