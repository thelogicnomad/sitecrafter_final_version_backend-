/**
 * Page Node - Generates page components
 * Uses Mem0 for persistent context between LLM calls
 * ENHANCED: Production-level UI with full feature implementation
 */

import { WebsiteState, GeneratedFile, createRegistryEntry, generateFileContext } from '../graph-state';
import { invokeLLM, parseChirActions, extractExports, extractImports } from '../llm-utils';
import { storeFileMemory, getAllFileMemories, FileMemory } from '../memory-utils';
import { notifyFileCreated, notifyPhaseChange } from '../website-graph';
import { formatImagesForPrompt } from '../services/image.service';

export async function pageNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log('\n ═══════════════════════════════════════════');
  console.log(' NODE: PAGES');
  console.log(' ═══════════════════════════════════════════\n');

  // Notify phase change for streaming
  notifyPhaseChange('pages');

  const blueprint = state.blueprint;
  if (!blueprint) {
    throw new Error('No blueprint available');
  }

  const files = new Map<string, GeneratedFile>();
  const registry = new Map(state.fileRegistry);

  // Get FULL context from both registry AND Mem0
  const existingContext = generateFileContext(registry);
  const memoryContext = await getAllFileMemories(state.projectId);

  console.log(`    Memory context loaded: ${memoryContext.length} chars`);

  const systemPrompt = `You are a SENIOR FRONTEND ARCHITECT generating PRODUCTION-READY, ZERO-ERROR page components.

═══════════════════════════════════════════════════════════════════════════════
 ZERO ERROR TOLERANCE - MANDATORY DEFENSIVE CODING
═══════════════════════════════════════════════════════════════════════════════

EVERY page MUST follow these CRITICAL rules to prevent runtime errors:

**1. NEVER call .map() directly without null check:**
    BAD: {products.map(p => ...)}
    GOOD: {(products ?? []).map(p => ...)}

**2. ALWAYS use optional chaining:**
    BAD: {item.details.price}
    GOOD: {item?.details?.price ?? 'N/A'}

**3. ALWAYS provide defaults for props:**
    BAD: const HomePage = ({ items }) => ...
    GOOD: const HomePage = ({ items = [] }) => ...

**4. DEFINE cn() utility inline in EVERY file that uses conditional classes:**
   const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

**5. ALWAYS import useState if using state:**
   import React, { useState } from 'react';

═══════════════════════════════════════════════════════════════════════════════
 IMAGES - USE GRADIENT PLACEHOLDERS (NO EXTERNAL URLS!)
═══════════════════════════════════════════════════════════════════════════════

**NEVER use external image URLs** - they cause CORS errors!

USE GRADIENT PLACEHOLDERS instead:

// Hero backgrounds:
<section className="min-h-[80vh] bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">

// Product/Card images:
const gradients = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
];
<div className={\`h-48 bg-gradient-to-br \${gradients[index % gradients.length]}\`} />

// Avatar placeholders:
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
  <span className="text-white font-bold">{name?.charAt(0) ?? '?'}</span>
</div>

═══════════════════════════════════════════════════════════════════════════════
 VISUAL DESIGN RULES
═══════════════════════════════════════════════════════════════════════════════

**COLOR CONTRAST:**
- Dark backgrounds (slate-900): text-white, text-slate-100
- Light backgrounds (white): text-slate-900, text-gray-800
- NEVER use light text on light backgrounds!

**SECTION STRUCTURE:**
<section className="py-16 md:py-24 bg-white">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
    {/* Content */}
  </div>
</section>

**HERO SECTIONS:**
<section className="min-h-[80vh] flex items-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
  <div className="container mx-auto px-4 max-w-7xl">
    <h1 className="text-4xl md:text-6xl font-bold text-white">Heading</h1>
    <p className="text-lg text-slate-300">Subheading</p>
  </div>
</section>

**CARD GRIDS (with defensive coding):**
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(items ?? []).map((item, index) => (
    <Card key={item?.id ?? index}>
      {/* Gradient instead of image */}
      <div className={\`h-48 bg-gradient-to-br \${gradients[index % gradients.length]}\`} />
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900">{item?.title ?? 'Title'}</h3>
        <p className="text-slate-600">{item?.description ?? 'Description'}</p>
      </div>
    </Card>
  ))}
</div>

═══════════════════════════════════════════════════════════════════════════════
 REQUIRED IMPORTS FOR EVERY PAGE
═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
// Import specific icons as needed
import { ArrowRight, Check, Star } from 'lucide-react';

// cn utility - ALWAYS define inline
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

═══════════════════════════════════════════════════════════════════════════════
 PAGE CHECKLIST (Verify EVERY page has these)
═══════════════════════════════════════════════════════════════════════════════

[ ] React and useState imported
[ ] cn utility defined inline (if using conditional classes)
[ ] All props have default values
[ ] Arrays use (arr ?? []).map()
[ ] Objects use optional chaining (?.)
[ ] No external image URLs
[ ] Gradient placeholders for all images
[ ] Hero section with gradient background
[ ] Proper color contrast (text visible)
[ ] motion from framer-motion for animations
[ ] default export for the page

═══════════════════════════════════════════════════════════════════════════════
 SAMPLE PAGE PATTERN
═══════════════════════════════════════════════════════════════════════════════

CRITICAL OUTPUT FORMAT - Each file MUST use <chirAction> tags:

<chirAction type="file" filePath="src/pages/HomePage.tsx">
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Star } from 'lucide-react';

// cn utility - ALWAYS define inline
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// Gradient colors for variety
const gradients = [
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
];

// Sample data with all properties defined
const products = [
  { id: 1, title: 'Product 1', description: 'Description 1', price: '$99' },
  { id: 2, title: 'Product 2', description: 'Description 2', price: '$149' },
  { id: 3, title: 'Product 3', description: 'Description 3', price: '$199' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with gradient background */}
      <section className="min-h-[80vh] flex items-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Welcome to Our Site
          </motion.h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
            A beautiful description with proper contrast.
          </p>
          <Button size="lg">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
            Our Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* DEFENSIVE CODING: use (arr ?? []).map() */}
            {(products ?? []).map((product, index) => (
              <motion.div
                key={product?.id ?? index}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* Gradient placeholder instead of image */}
                <div className={\`h-48 bg-gradient-to-br \${gradients[index % gradients.length]}\`} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900">{product?.title ?? 'Product'}</h3>
                  <p className="text-slate-600 mt-2">{product?.description ?? ''}</p>
                  <p className="text-lg font-bold text-indigo-600 mt-4">{product?.price ?? '$0'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
</chirAction>

NEVER use markdown. ALWAYS use <chirAction> tags.`;

  // Format available images for the prompt
  const imagesContext = formatImagesForPrompt(state.availableImages || []);

  const userPrompt = `Generate ALL page components for "${blueprint.projectName}":

${imagesContext}

═══════════════════════════════════════════════════════════════════════════════
 MEMORY CONTEXT (Previously Generated Components)
═══════════════════════════════════════════════════════════════════════════════
${memoryContext}

═══════════════════════════════════════════════════════════════════════════════
 AVAILABLE COMPONENTS (IMPORT AND USE THESE)
═══════════════════════════════════════════════════════════════════════════════
${existingContext}

IMPORT PATTERNS:
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Star } from 'lucide-react';

═══════════════════════════════════════════════════════════════════════════════
 DESIGN SYSTEM
═══════════════════════════════════════════════════════════════════════════════
- Primary: ${blueprint.designSystem.primaryColor}
- Secondary: ${blueprint.designSystem.secondaryColor}
- Accent: ${blueprint.designSystem.accentColor}
- Style: ${blueprint.designSystem.style}

MANDATORY COLOR USAGE:
- Dark sections: bg-slate-900 with text-white headings, text-slate-300 body
- Light sections: bg-white with text-slate-900 headings, text-slate-700 body
- CTAs: bg-indigo-600 hover:bg-indigo-700 text-white
- Cards: bg-white shadow-lg rounded-xl with text-slate-900

═══════════════════════════════════════════════════════════════════════════════
 BLUEPRINT FEATURES TO IMPLEMENT
═══════════════════════════════════════════════════════════════════════════════
${blueprint.features.map(f => `✅ ${f.name}: ${f.description} [Priority: ${f.priority}]`).join('\n')}

ALL of these features MUST be visible and implemented in the pages!

═══════════════════════════════════════════════════════════════════════════════
 PAGES TO GENERATE
═══════════════════════════════════════════════════════════════════════════════
${blueprint.pages.map(page => `
═══ ${page.name} (src/pages/${page.name.replace(/\s+/g, '')}.tsx) ═══
Route: ${page.route}
Description: ${page.description}

REQUIRED SECTIONS (3-5 minimum):
${page.sections?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '1. Hero Section\n2. Features Grid\n3. Content Section\n4. CTA Section'}

Uses components: ${page.components?.join(', ') || 'Button, Card, Badge'}

MUST INCLUDE:
- Responsive layout (mobile/tablet/desktop)
- High contrast text (readable on all backgrounds)
- Working images (use Unsplash URLs)
- Real content (no lorem ipsum)
- Export: export default ${page.name.replace(/\s+/g, '')};
`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
 CRITICAL REQUIREMENTS (ZERO TOLERANCE)
═══════════════════════════════════════════════════════════════════════════════
1. VISIBLE TEXT: All text must be readable. Dark bg = light text, Light bg = dark text
2. RESPONSIVE: Every element must work from 320px to 4K screens
3. WORKING IMAGES: Use provided Unsplash URLs or gradient fallbacks
4. REAL CONTENT: No placeholder text, create meaningful content for ${blueprint.projectName}
5. ALL FEATURES: Implement every feature from blueprint
6. PROPER IMPORTS: Import components from @/components/ui/ and @/components/features/
7. DEFAULT EXPORT: Each page must have export default PageName;
8. NO APPLAYOUT WRAPPER: Pages render inside AppLayout via Outlet

═══════════════════════════════════════════════════════════════════════════════
MOBILE-FIRST RESPONSIVE DESIGN (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
All pages MUST be mobile-first using these Tailwind breakpoints:
- BASE (320px+): Mobile - single column, stacked layouts
- sm (640px+): Large mobile
- md (768px+): Tablet - start 2-column
- lg (1024px+): Desktop - full layouts
- xl (1280px+): Large desktop

Example patterns to use:
- Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Flex: flex-col md:flex-row
- Text sizes: text-3xl md:text-4xl lg:text-5xl xl:text-6xl
- Spacing: p-4 md:p-6 lg:p-8, gap-4 md:gap-6 lg:gap-8
- Container: container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl

${state.detailedContext ? `
═══════════════════════════════════════════════════════════════════════════════
 DETAILED SPECIFICATIONS FROM PLANNING
═══════════════════════════════════════════════════════════════════════════════
${state.detailedContext.slice(0, 3000)}...
` : ''}`;

  try {
    const response = await invokeLLM(systemPrompt, userPrompt, 0.7);
    const parsedFiles = parseChirActions(response);

    for (const { path, content } of parsedFiles) {
      await addFileWithMemory(files, registry, path, content, 'page', state.projectId);
    }

    console.log(`\n Page files generated: ${files.size}`);
    files.forEach((_, path) => console.log(`    ${path}`));

    return {
      files,
      fileRegistry: registry,
      currentPhase: 'page',
      messages: [`Pages created: ${files.size} files`]
    };

  } catch (error: any) {
    console.error(' Page generation failed:', error.message);
    throw error;
  }
}

async function addFileWithMemory(
  files: Map<string, GeneratedFile>,
  registry: Map<string, any>,
  path: string,
  content: string,
  phase: string,
  projectId: string
) {
  const exports = extractExports(content);
  const imports = extractImports(content);

  const file: GeneratedFile = { path, content, phase, exports, imports };
  files.set(path, file);
  registry.set(path, createRegistryEntry(file));

  // Stream file to frontend
  notifyFileCreated(file);

  // Store in Mem0
  await storeFileMemory(projectId, {
    path,
    exports,
    imports,
    type: 'page',
    phase,
    contentPreview: content.substring(0, 300)
  });
}
