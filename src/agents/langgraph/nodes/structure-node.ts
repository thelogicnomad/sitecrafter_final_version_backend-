/**
 * Structure Node - Generates config files with CORRECT package.json
 */

import { WebsiteState, GeneratedFile, createRegistryEntry } from '../graph-state';
import { STANDARD_DEPENDENCIES, DEV_DEPENDENCIES } from './blueprint-node';
import { extractExports, extractImports } from '../llm-utils';
import { notifyFileCreated, notifyPhaseChange } from '../website-graph';

export async function structureNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log('\n ═══════════════════════════════════════════');
  console.log(' NODE: STRUCTURE');
  console.log(' ═══════════════════════════════════════════\n');

  // Notify phase change for streaming
  notifyPhaseChange('structure');

  const blueprint = state.blueprint;
  if (!blueprint) {
    throw new Error('No blueprint available');
  }

  const files = new Map<string, GeneratedFile>();
  const registry = new Map(state.fileRegistry);

  // 1. package.json - COMPLETE with all deps
  const packageJson = {
    name: blueprint.projectName.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "0.1.0",
    type: "module",
    description: blueprint.description,
    scripts: {
      dev: "vite",
      build: "tsc -b && vite build",
      preview: "vite preview",
      lint: "eslint ."
    },
    dependencies: { ...STANDARD_DEPENDENCIES, ...blueprint.dependencies },
    devDependencies: DEV_DEPENDENCIES
  };

  addFile(files, registry, 'package.json', JSON.stringify(packageJson, null, 2), 'structure');
  console.log('    package.json created with', Object.keys(packageJson.dependencies).length, 'dependencies');

  // 2. tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] }
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  };
  addFile(files, registry, 'tsconfig.json', JSON.stringify(tsconfig, null, 2), 'structure');

  // 3. tsconfig.node.json
  const tsconfigNode = {
    compilerOptions: {
      composite: true,
      tsBuildInfoFile: "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
      module: "ESNext",
      moduleResolution: "bundler",
      allowSyntheticDefaultImports: true,
      strict: true
    },
    include: ["vite.config.ts"]
  };
  addFile(files, registry, 'tsconfig.node.json', JSON.stringify(tsconfigNode, null, 2), 'structure');

  // 4. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});`;
  addFile(files, registry, 'vite.config.ts', viteConfig, 'structure');

  // 5. tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${blueprint.designSystem.primaryColor}',
        secondary: '${blueprint.designSystem.secondaryColor}',
        accent: '${blueprint.designSystem.accentColor}',
      },
      fontFamily: {
        sans: ${JSON.stringify(blueprint.designSystem.fonts)},
      },
    },
  },
  plugins: [],
};`;
  addFile(files, registry, 'tailwind.config.js', tailwindConfig, 'structure');

  // 6. postcss.config.js
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
  addFile(files, registry, 'postcss.config.js', postcssConfig, 'structure');

  // 7. index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${blueprint.description}" />
    <title>${blueprint.projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  addFile(files, registry, 'index.html', indexHtml, 'structure');

  // 8. src/index.css
  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: ${blueprint.designSystem.primaryColor};
  --secondary: ${blueprint.designSystem.secondaryColor};
  --accent: ${blueprint.designSystem.accentColor};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@layer components {
  .container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}`;
  addFile(files, registry, 'src/index.css', indexCss, 'structure');

  // 9. src/vite-env.d.ts
  addFile(files, registry, 'src/vite-env.d.ts', '/// <reference types="vite/client" />', 'structure');

  console.log(`\n Structure files generated: ${files.size}`);
  files.forEach((_, path) => console.log(`    ${path}`));

  return {
    files,
    fileRegistry: registry,
    currentPhase: 'structure',
    messages: [`Structure created: ${files.size} config files`]
  };
}

function addFile(
  files: Map<string, GeneratedFile>,
  registry: Map<string, any>,
  path: string,
  content: string,
  phase: string
) {
  const exports = extractExports(content);
  const imports = extractImports(content);

  const file: GeneratedFile = { path, content, phase, exports, imports };
  files.set(path, file);
  registry.set(path, createRegistryEntry(file));

  // Stream file to frontend
  notifyFileCreated(file);
}
