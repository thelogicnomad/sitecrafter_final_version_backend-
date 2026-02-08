/**
 * Component Node - Generates UI and feature components
 * Uses Mem0 for persistent context between LLM calls
 * ENHANCED: Production-level UI with contrast rules and reliable images
 */

import { WebsiteState, GeneratedFile, createRegistryEntry, generateFileContext } from '../graph-state';
import { invokeLLM, parseChirActions, extractExports, extractImports } from '../llm-utils';
import { storeFileMemory, getAllFileMemories, FileMemory } from '../memory-utils';
import { notifyFileCreated, notifyPhaseChange } from '../website-graph';
import { formatImagesForPrompt } from '../services/image.service';

export async function componentNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
  console.log('\n ═══════════════════════════════════════════');
  console.log(' NODE: COMPONENTS');
  console.log(' ═══════════════════════════════════════════\n');

  // Notify phase change for streaming
  notifyPhaseChange('components');

  const blueprint = state.blueprint;
  if (!blueprint) {
    throw new Error('No blueprint available');
  }

  const files = new Map<string, GeneratedFile>();
  const registry = new Map(state.fileRegistry);

  // Get context from both registry AND Mem0
  const existingContext = generateFileContext(registry);
  const memoryContext = await getAllFileMemories(state.projectId);

  const systemPrompt = `You are a SENIOR React developer generating PRODUCTION-READY, ZERO-ERROR components.

═══════════════════════════════════════════════════════════════════════════════
ZERO ERROR TOLERANCE - MANDATORY DEFENSIVE CODING
═══════════════════════════════════════════════════════════════════════════════

EVERY component MUST follow these CRITICAL rules to prevent runtime errors:

**1. NEVER call .map() directly on a prop/state without null check:**
   BAD: {items.map(item => ...)}
   GOOD: {(items ?? []).map(item => ...)}
   GOOD: {Array.isArray(items) && items.map(item => ...)}

**2. ALWAYS use optional chaining for nested property access:**
   BAD: {product.details.price}
   GOOD: {product?.details?.price ?? 'N/A'}

**3. ALWAYS provide defaults for destructuring:**
   BAD: const { items } = data;
   GOOD: const { items = [] } = data ?? {};

**4. ALWAYS define cn() utility inline at the TOP of EVERY component file:**
   // cn utility - ALWAYS define inline, never rely on import
   const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

**5. ALWAYS import useState if using state:**
   import React, { useState } from 'react';

═══════════════════════════════════════════════════════════════════════════════
IMAGES - GRADIENT PLACEHOLDERS (NO EXTERNAL URLS)
═══════════════════════════════════════════════════════════════════════════════

**NEVER use external image URLs** - they cause CORS errors in many environments!

INSTEAD of <img src="https://..."> use beautiful GRADIENT PLACEHOLDERS:

// For Hero Images:
<div className="w-full h-[400px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />

// For Product/Card Images:
<div className="w-full h-48 bg-gradient-to-br from-blue-500 to-cyan-400" />

// For Avatar Placeholders:
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
  <span className="text-white font-bold text-lg">{name?.charAt(0) ?? '?'}</span>
</div>

// For Gallery Items (use different gradients):
const gradients = [
  'from-rose-400 to-orange-300',
  'from-blue-400 to-indigo-500', 
  'from-emerald-400 to-cyan-500',
  'from-purple-400 to-pink-500',
  'from-amber-400 to-yellow-300',
  'from-slate-600 to-slate-800'
];
<div className={\`w-full h-64 bg-gradient-to-br \${gradients[index % gradients.length]}\`} />

═══════════════════════════════════════════════════════════════════════════════
 VISUAL DESIGN RULES
═══════════════════════════════════════════════════════════════════════════════

**COLOR CONTRAST (MANDATORY - 4.5:1 ratio minimum):**
- DARK backgrounds: Use text-white, text-slate-100
- LIGHT backgrounds: Use text-slate-900, text-gray-900
- NEVER use gray text on gray backgrounds!

**NO SQUARE BOXES - MANDATORY ROUNDED CORNERS:**
- ALL cards: rounded-xl or rounded-2xl (NEVER just "rounded")
- ALL buttons: rounded-lg or rounded-xl
- ALL image containers: rounded-xl with overflow-hidden
- ALL containers: rounded-lg minimum
- Example: className="rounded-2xl overflow-hidden shadow-lg"

**PREMIUM SHADOWS:**
- Cards: shadow-lg or shadow-xl
- Hover: hover:shadow-2xl transition-shadow
- Floating elements: shadow-2xl

**PREMIUM ANIMATIONS (framer-motion):**
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02, y: -4 }}
  transition={{ duration: 0.4 }}
>

**WEB-SAFE COLOR PALETTE:**
- Primary: bg-indigo-600, bg-blue-600, bg-violet-600
- Accent: bg-emerald-500, bg-amber-500, bg-rose-500
- Neutral Dark: bg-slate-900, bg-gray-900
- Neutral Light: bg-white, bg-slate-50

**RESPONSIVE DESIGN:**
- Mobile first: Default styles for mobile
- Tablet (md:768px): md:grid-cols-2, md:text-lg
- Desktop (lg:1024px): lg:grid-cols-3, lg:text-xl

═══════════════════════════════════════════════════════════════════════════════
 REQUIRED IMPORTS (ALWAYS include these)
═══════════════════════════════════════════════════════════════════════════════

// EVERY component file must start with:
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react'; // Import specific icons as needed

// cn utility - ALWAYS define inline
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

═══════════════════════════════════════════════════════════════════════════════
 CARD & LAYOUT PATTERNS
═══════════════════════════════════════════════════════════════════════════════

**STANDARD CARD WITH GRADIENT IMAGE:**
interface CardProps {
  title?: string;
  description?: string;
  index?: number;
}

export const ProductCard: React.FC<CardProps> = ({ title = 'Product', description = 'Description', index = 0 }) => {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-blue-500 to-cyan-500',
  ];
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Gradient placeholder instead of image */}
      <div className={\`h-48 bg-gradient-to-br \${gradients[index % gradients.length]}\`} />
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-slate-600 mt-2">{description}</p>
      </div>
    </motion.div>
  );
};

**CONTAINER PATTERNS:**
- Section wrapper: container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl
- Card grids: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

═══════════════════════════════════════════════════════════════════════════════
 COMPONENT CHECKLIST (Verify EVERY component has these)
═══════════════════════════════════════════════════════════════════════════════

[ ] React and useState imported
[ ] cn utility defined inline
[ ] All props have default values
[ ] Arrays use (arr ?? []).map()
[ ] Objects use optional chaining (?.)
[ ] No external image URLs
[ ] Gradient placeholders for images
[ ] TypeScript interface defined
[ ] Named export used
[ ] motion from framer-motion for animations

CRITICAL OUTPUT FORMAT - Each file MUST use <chirAction> tags:

<chirAction type="file" filePath="src/components/ui/Card.tsx">
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// cn utility - ALWAYS define inline
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  title = 'Title', 
  description = '', 
  className = '',
  children 
}) => {
  return (
    <motion.div 
      whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      className={cn(
        'bg-white rounded-xl shadow-lg p-6 transition-all duration-300',
        className
      )}
    >
      {title && <h3 className="text-xl font-bold text-slate-900">{title}</h3>}
      {description && <p className="text-slate-600 mt-2">{description}</p>}
      {children}
    </motion.div>
  );
};
</chirAction>

NEVER use markdown code blocks. ALWAYS use <chirAction> tags.`;

  // UI components from blueprint + standard required ones
  const uiComponents = blueprint.components.filter(c => c.type === 'ui');
  const featureComponents = blueprint.components.filter(c => c.type === 'feature');

  // Format available images for the prompt
  const imagesContext = formatImagesForPrompt(state.availableImages || []);

  const userPrompt = `Generate ALL production-ready components for "${blueprint.projectName}":

${memoryContext}

${imagesContext}

EXISTING FILES (IMPORT FROM THESE):
${existingContext}

${state.dynamicTheme ? `
═══════════════════════════════════════════════════════════════════════════════
 UNIQUE DESIGN THEME: "${state.dynamicTheme.palette.name}" (MANDATORY - USE EXACT COLORS)
═══════════════════════════════════════════════════════════════════════════════

COLOR PALETTE (USE THESE HEX VALUES - NOT DEFAULTS):
- Primary: ${state.dynamicTheme.palette.primary} (for CTAs, links, highlights)
- Secondary: ${state.dynamicTheme.palette.secondary} (for secondary actions)
- Accent: ${state.dynamicTheme.palette.accent} (for badges, notifications)
- Background: ${state.dynamicTheme.palette.background}
- Surface: ${state.dynamicTheme.palette.surface}
- Style: ${state.dynamicTheme.palette.style}

TYPOGRAPHY:
- Headings: "${state.dynamicTheme.fonts.heading}" font-family
- Body: "${state.dynamicTheme.fonts.body}" font-family

COMPONENT VARIANTS FOR "${state.dynamicTheme.animation.name}" STYLE:
- Button hover: ${state.dynamicTheme.animation.hover} effect
- Card entrance: ${state.dynamicTheme.animation.entrance} animation
- Scroll triggers: ${state.dynamicTheme.animation.scroll}
- Timing function: ${state.dynamicTheme.animation.timing}

CRITICAL: Use [${state.dynamicTheme.palette.primary}] as primary color, NOT indigo-600.
` : `
═══════════════════════════════════════════════════════════════════════════════
 DESIGN SYSTEM FOR THIS PROJECT
═══════════════════════════════════════════════════════════════════════════════
- Primary Color: ${blueprint.designSystem.primaryColor}
- Secondary Color: ${blueprint.designSystem.secondaryColor}
- Accent Color: ${blueprint.designSystem.accentColor}
- Style: ${blueprint.designSystem.style}
- Fonts: ${blueprint.designSystem.fonts.join(', ')}
`}

COLOR CONTRAST RULES:
- On dark (slate-900/gray-900): ALWAYS use text-white or text-slate-100
- On light (white/slate-50): ALWAYS use text-slate-900 or text-gray-800
- Muted text: text-slate-400 on dark, text-slate-600 on light

═══════════════════════════════════════════════════════════════════════════════
 REQUIRED UI COMPONENTS (src/components/ui/)
═══════════════════════════════════════════════════════════════════════════════
${['Button', 'Card', 'Input', 'Modal', 'Badge', 'Avatar', 'Skeleton', 'Dropdown', 'Tabs', 'Container', 'Section'].map(c => `- ${c}.tsx`).join('\n')}
${uiComponents.map(c => `- ${c.name}.tsx: ${c.props?.join(', ') || 'standard props'}`).join('\n')}

Each Card MUST have:
- Visible text (high contrast)
- Proper padding (p-6)
- Shadow (shadow-lg)
- Rounded corners (rounded-xl)
- Responsive width

═══════════════════════════════════════════════════════════════════════════════
 FEATURE COMPONENTS (src/components/features/)
═══════════════════════════════════════════════════════════════════════════════
${featureComponents.map(c => `- ${c.name}.tsx: ${c.description || c.props?.join(', ')}`).join('\n')}

Each feature component MUST:
- Be fully responsive (mobile/tablet/desktop)
- Have proper section spacing (py-12 md:py-16 lg:py-20)
- Use container mx-auto for centering
- Include real, meaningful content
- Work with provided design system colors

═══════════════════════════════════════════════════════════════════════════════
 MOBILE-FIRST RESPONSIVE DESIGN (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════
All components MUST be responsive using these breakpoints:
- BASE (320px+): Mobile - single column, larger touch targets
- sm (640px+): Large mobile - can slightly widen
- md (768px+): Tablet - start 2-column layouts
- lg (1024px+): Desktop - full layouts
- xl (1280px+): Large desktop - max container

Example responsive patterns:
- Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Flex: flex-col md:flex-row
- Text: text-2xl md:text-3xl lg:text-4xl
- Padding: p-4 md:p-6 lg:p-8
- Gap: gap-4 md:gap-6 lg:gap-8

${state.detailedContext ? `
═══════════════════════════════════════════════════════════════════════════════
 DETAILED SPECIFICATIONS FROM PLANNING
═══════════════════════════════════════════════════════════════════════════════
${state.detailedContext.slice(0, 2000)}...
` : ''}

═══════════════════════════════════════════════════════════════════════════════
 ZERO TOLERANCE REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. NO invisible text (verify contrast!)
2. NO placeholder content ("Lorem ipsum", "Sample text")
3. NO broken images (use Unsplash URLs or gradients)
4. NO fixed widths - everything responsive
5. ALL components must work on 320px to 2560px screens`;

  try {
    const response = await invokeLLM(systemPrompt, userPrompt, 0.7);
    const parsedFiles = parseChirActions(response);

    for (const { path, content } of parsedFiles) {
      await addFileWithMemory(files, registry, path, content, 'component', state.projectId);
    }

    console.log(`\n✅ Component files generated: ${files.size}`);
    files.forEach((_, path) => console.log(`   📄 ${path}`));

    return {
      files,
      fileRegistry: registry,
      currentPhase: 'component',
      messages: [`Components created: ${files.size} files`]
    };

  } catch (error: any) {
    console.error('❌ Component generation failed:', error.message);
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

  // Determine file type for Mem0
  let fileType: FileMemory['type'] = 'component';
  if (path.includes('/layout/')) fileType = 'layout';
  else if (path.includes('/pages/')) fileType = 'page';
  else if (path.includes('/lib/') || path.includes('/utils/')) fileType = 'util';

  // Store in Mem0
  await storeFileMemory(projectId, {
    path,
    exports,
    imports,
    type: fileType,
    phase,
    contentPreview: content.substring(0, 300)
  });
}
