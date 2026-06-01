import autoprefixer from 'autoprefixer';
import path from 'path';
import discardEmpty from 'postcss-discard-empty';
import postcssReplace from 'postcss-replace';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import propertyToCustomProp from './src/plugins/postcss-property-to-custom-prop';

const unwrapLayer = () => {
  return {
    postcssPlugin: 'unwrap-layer',
    Once(root) {
      root.walkAtRules('layer', (atRule) => {
        atRule.replaceWith(atRule.nodes || []); // Replace @layer with its contents
      });
    },
  };
};

unwrapLayer.postcss = true;

const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
};

export default defineConfig(() => {
  const isWatch = process.argv.includes('--watch');
  const isMinify = process.argv.includes('--minify=false');
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    base: '', // Use relative paths instead of absolute paths
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    },
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      }),
      svgr(),
      {
        name: 'php',
        handleHotUpdate({ file, server }) {
          if (file.endsWith('.php')) {
            server.ws.send({ type: 'full-reload' });
          }
        },
      },
      viteStaticCopy({
        targets: [
          {
            src: 'src/assets/images/*', // Copies all images inside images/ folder
            dest: 'assets/images', // Copies to the root assets/images folder
          },
          {
            src: 'src/assets/fonts/*', // Copies all fonts inside fonts/ folder
            dest: 'assets/fonts', // Copies to the root assets/fonts folder
          },
        ],
      }),
    ],
    css: {
      postcss: {
        plugins: [
          unwrapLayer(),
          tailwindcss(),
          propertyToCustomProp(),
          postcssReplace({
            pattern: /(--tw|\*, ::before, ::after)/g,
            data: {
              '--tw': '--wpchat',
              '*, ::before, ::after': ':root',
            },
          }),
          {
            name: 'wpchat-postcss-plugin',
            postcssPlugin: 'wpchat',
            Once(root, options) {
              if (root.source.input.file && root.source.input.file.includes('admin.css')) {
                root.walkRules((rule) => {
                  if (rule.selector.includes('.wpchat\\:')) {
                    rule.selector = rule.selector.replace(
                      /\.wpchat\\:/g,
                      '.wp-chat-admin-body .wpchat\\:',
                    );
                  }
                });
              }
            },
          },
          autoprefixer(),
          discardEmpty(),
        ],
      },
    },
    resolve: {
      alias: {
        '@Frontend': path.resolve(__dirname, './src/apps/Frontend'),
        '@FC': path.resolve(__dirname, './src/apps/Frontend/components'),
        '@FP': path.resolve(__dirname, './src/apps/Frontend/pages'),
        '@FU': path.resolve(__dirname, './src/apps/Frontend/utils'),
        '@FCPro': path.resolve(__dirname, './src/pro/apps/Frontend/components'),
        '@FPPro': path.resolve(__dirname, './src/pro/apps/Frontend/pages'),
        '@FUPro': path.resolve(__dirname, './src/pro/apps/Frontend/utils'),
        '@AC': path.resolve(__dirname, './src/apps/Admin/components'),
        '@AP': path.resolve(__dirname, './src/apps/Admin/pages'),
        '@AU': path.resolve(__dirname, './src/apps/Admin/utils'),
        '@AH': path.resolve(__dirname, './src/apps/Admin/hooks'),
        '@AConfig': path.resolve(__dirname, './src/apps/Admin/config'),
        '@ACPro': path.resolve(__dirname, './src/pro/apps/Admin/components'),
        '@APPro': path.resolve(__dirname, './src/pro/apps/Admin/pages'),
        '@AUPro': path.resolve(__dirname, './src/pro/apps/Admin/utils'),
        '@AHPro': path.resolve(__dirname, './src/pro/apps/Admin/hooks'),
        '@Components': path.resolve(__dirname, './src/components'),
        '@Utils': path.resolve(__dirname, './src/utils'),
        '@Hooks': path.resolve(__dirname, './src/hooks'),
        '@ComponentsPro': path.resolve(__dirname, './src/pro/components'),
        '@UtilsPro': path.resolve(__dirname, './src/pro/utils'),
        '@HooksPro': path.resolve(__dirname, './src/pro/hooks'),
        '@Assets': path.resolve(__dirname, './src/assets'),
        '@DataStore': path.resolve(__dirname, './src/apps/Admin/data'),
        '@FDataStore': path.resolve(__dirname, './src/apps/Frontend/data'),
        '@DataStorePro': path.resolve(__dirname, './src/pro/apps/Admin/data'),
        '@FDataStorePro': path.resolve(__dirname, './src/pro/apps/Frontend/data'),
        '@': path.resolve(__dirname, './src'),
        '@node': path.resolve(__dirname, './node_modules'),
        '@wordpress/i18n': path.resolve(__dirname, './src/utils/wp-i18n-shim.js'),
      },
    },
    optimizeDeps: {
      // Prevent Vite from pre-bundling @wordpress/i18n since we use a shim
      exclude: ['@wordpress/i18n'],
    },
    build: {
      watch: isWatch
        ? {
            include: ['src/**'],
            clearScreen: true,
            exclude: ['node_modules/**'],
          }
        : undefined,
      modulePreload: false,
      outDir: '../public',
      emptyOutDir: true,
      sourcemap: false,
      minify: isMinify ? false : 'esbuild', // Disable minification if `--minify=false` flag is passed
      manifest: false,
      rollupOptions: {
        input: {
          frontend: path.resolve(__dirname, './src/apps/Frontend/index.jsx'),
          admin: path.resolve(__dirname, './src/apps/Admin/index.jsx'),
        },
        output: {
          entryFileNames: 'js/wp-chat-[name]-[hash].js',
          chunkFileNames: 'js/wp-chat-[name]-[hash].js',
          assetFileNames: 'assets/wp-chat-[name].[ext]',
          dir: '../public',
          format: 'es'
        },
        onLog(level, log, handler) {
          if (log.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          handler(level, log);
        },
      },
    },
  };
});
