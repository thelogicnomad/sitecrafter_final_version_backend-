/**
 * Core Node - Generates main.tsx, App.tsx, and layout components
 * CRITICAL: BrowserRouter is ONLY in main.tsx, NOT in App.tsx
 */

import { WebsiteState, GeneratedFile, createRegistryEntry } from '../graph-state';
import { invokeLLM, parseChirActions, extractExports, extractImports } from '../llm-utils';
import { storeFileMemory, FileMemory } from '../memory-utils';
import { notifyFileCreated, notifyPhaseChange } from '../website-graph';

export async function coreNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log('\n ═══════════════════════════════════════════');
  console.log(' NODE: CORE');
  console.log(' ═══════════════════════════════════════════\n');

  // Notify phase change for streaming
  notifyPhaseChange('core');

  const blueprint = state.blueprint;
  if (!blueprint) {
    throw new Error('No blueprint available');
  }

  const files = new Map<string, GeneratedFile>();
  const registry = new Map(state.fileRegistry);

  // 1. FIXED main.tsx - BrowserRouter is HERE and ONLY HERE
  // NOTE: Removed QueryClientProvider - causes "Invalid hook call" in WebContainer
  const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  </React.StrictMode>
);`;
  addFile(files, registry, 'src/main.tsx', mainTsx, 'core');
  console.log('    main.tsx created (BrowserRouter HERE)');

  // 2. Generate page routes for App.tsx
  const routes = blueprint.pages.map(page => {
    const componentName = page.name.replace(/\s+/g, '');
    return `        <Route path="${page.route}" element={<${componentName} />} />`;
  }).join('\n');

  const pageImports = blueprint.pages.map(page => {
    const componentName = page.name.replace(/\s+/g, '');
    return `import ${componentName} from '@/pages/${componentName}';`;
  }).join('\n');

  // 3. FIXED App.tsx - NO BrowserRouter, just Routes
  const appTsx = `import { Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
${pageImports}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
${routes}
      </Route>
    </Routes>
  );
}

export default App;`;
  addFile(files, registry, 'src/App.tsx', appTsx, 'core');
  console.log('    App.tsx created (NO BrowserRouter - Routes only)');

  // 4. Generate lib/utils.ts - with standalone cn that works without dependencies
  const utilsTsx = `// Utility functions for className merging
// This cn function works standalone without any dependencies

/**
 * Combines class names conditionally
 * @example cn('base', isActive && 'active', className)
 */
export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date values
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}`;
  addFile(files, registry, 'src/lib/utils.ts', utilsTsx, 'core');

  // 5. Now generate layout components via LLM
  const systemPrompt = `You are a senior React developer generating layout components.

RULES:
1. Use TypeScript with proper types
2. Use Tailwind CSS for styling
3. Import { Link, Outlet } from 'react-router-dom' - NOT BrowserRouter
4. Use lucide-react for icons
5. Export components properly (Header and Footer as named, AppLayout as default)

CRITICAL OUTPUT FORMAT - Each file MUST be wrapped in <chirAction> tags:

<chirAction type="file" filePath="src/components/layout/Header.tsx">
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      {/* Header content */}
    </header>
  );
};
</chirAction>

<chirAction type="file" filePath="src/components/layout/Footer.tsx">
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      {/* Footer content */}
    </footer>
  );
};
</chirAction>

<chirAction type="file" filePath="src/components/layout/AppLayout.tsx">
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
</chirAction>

NEVER use markdown. ALWAYS use <chirAction> tags.`;

  const userPrompt = `Generate these layout components for "${blueprint.projectName}":

═══════════════════════════════════════════════════
1. src/components/layout/Header.tsx
═══════════════════════════════════════════════════
- Logo/brand: "${blueprint.projectName}"
- Navigation links for ALL pages:
${blueprint.pages.map(p => `  - "${p.name}" → "${p.route}"`).join('\n')}
- Mobile hamburger menu with useState (show/hide)
- Use { Link } from 'react-router-dom' for navigation
- Use lucide-react icons (Menu, X, etc.)
- Sticky header with backdrop blur
- Primary color: ${blueprint.designSystem.primaryColor}

═══════════════════════════════════════════════════
2. src/components/layout/Footer.tsx
═══════════════════════════════════════════════════
- Company info: "${blueprint.projectName}"
- Quick links matching navigation
- Social media icons from lucide-react
- Copyright with current year: {new Date().getFullYear()}
- Dark background (slate-900 or similar)
- Contact info placeholder

═══════════════════════════════════════════════════
3. src/components/layout/AppLayout.tsx
═══════════════════════════════════════════════════
- Import Header from './Header'
- Import Footer from './Footer'
- Use { Outlet } from 'react-router-dom' for nested routes
- Structure: Header → <main><Outlet /></main> → Footer
- min-h-screen with flex column layout
- MUST export default AppLayout

CRITICAL: Do NOT import BrowserRouter anywhere. Use Link and Outlet only.`;

  try {
    const response = await invokeLLM(systemPrompt, userPrompt, 0.7);
    const parsedFiles = parseChirActions(response);

    for (const { path, content } of parsedFiles) {
      await addFileWithMemory(files, registry, path, content, 'core', state.projectId);
    }

    console.log(`\n Core files generated: ${files.size}`);
    files.forEach((_, path) => console.log(`    ${path}`));

    return {
      files,
      fileRegistry: registry,
      currentPhase: 'core',
      messages: [`Core created: ${files.size} files (Router in main.tsx only)`]
    };

  } catch (error: any) {
    console.error(' Core generation failed:', error.message);
    throw error;
  }
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

async function addFileWithMemory(
  files: Map<string, GeneratedFile>,
  registry: Map<string, any>,
  path: string,
  content: string,
  phase: string,
  projectId: string
) {
  addFile(files, registry, path, content, phase);

  // Determine file type for Mem0
  let fileType: FileMemory['type'] = 'config';
  if (path.includes('/layout/')) fileType = 'layout';
  else if (path.includes('/lib/') || path.includes('/utils')) fileType = 'util';

  // Store in Mem0
  const exports = extractExports(content);
  const imports = extractImports(content);
  await storeFileMemory(projectId, {
    path,
    exports,
    imports,
    type: fileType,
    phase,
    contentPreview: content.substring(0, 300)
  });
}

