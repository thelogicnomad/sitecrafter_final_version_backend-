/**
 * Dynamic Trends Service
 * Generates unique, randomized design themes and trends for each project
 * Ensures every website is visually distinct and production-level
 */

// Design theme palettes - 25 unique color combinations
const COLOR_PALETTES = [
    { name: 'Midnight Aurora', primary: '#6366f1', secondary: '#8b5cf6', accent: '#22d3ee', background: '#0f172a', surface: '#1e293b', style: 'dark-gradient' },
    { name: 'Sunrise Coral', primary: '#f97316', secondary: '#ec4899', accent: '#facc15', background: '#fffbeb', surface: '#ffffff', style: 'warm-light' },
    { name: 'Ocean Depths', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#10b981', background: '#0c4a6e', surface: '#164e63', style: 'aquatic-dark' },
    { name: 'Forest Canopy', primary: '#22c55e', secondary: '#84cc16', accent: '#fbbf24', background: '#14532d', surface: '#166534', style: 'nature-dark' },
    { name: 'Neon Cyberpunk', primary: '#f0abfc', secondary: '#22d3ee', accent: '#a3e635', background: '#18181b', surface: '#27272a', style: 'cyberpunk' },
    { name: 'Lavender Dreams', primary: '#a78bfa', secondary: '#c084fc', accent: '#fb7185', background: '#faf5ff', surface: '#ffffff', style: 'soft-light' },
    { name: 'Volcanic Ember', primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24', background: '#1c1917', surface: '#292524', style: 'fiery-dark' },
    { name: 'Arctic Frost', primary: '#38bdf8', secondary: '#e0f2fe', accent: '#7dd3fc', background: '#f8fafc', surface: '#ffffff', style: 'icy-light' },
    { name: 'Golden Luxe', primary: '#d97706', secondary: '#b45309', accent: '#fbbf24', background: '#1c1917', surface: '#292524', style: 'luxury-dark' },
    { name: 'Mint Fresh', primary: '#2dd4bf', secondary: '#5eead4', accent: '#34d399', background: '#ecfdf5', surface: '#ffffff', style: 'fresh-light' },
    { name: 'Velvet Night', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#c4b5fd', background: '#0f0f0f', surface: '#171717', style: 'elegant-dark' },
    { name: 'Cherry Blossom', primary: '#f472b6', secondary: '#fb7185', accent: '#fda4af', background: '#fdf2f8', surface: '#ffffff', style: 'floral-light' },
    { name: 'Storm Gray', primary: '#64748b', secondary: '#94a3b8', accent: '#0ea5e9', background: '#1e293b', surface: '#334155', style: 'corporate-dark' },
    { name: 'Tropical Paradise', primary: '#f59e0b', secondary: '#10b981', accent: '#06b6d4', background: '#0f172a', surface: '#1e293b', style: 'vibrant-dark' },
    { name: 'Rose Quartz', primary: '#fb7185', secondary: '#fda4af', accent: '#fecaca', background: '#fff1f2', surface: '#ffffff', style: 'romantic-light' },
    { name: 'Obsidian Edge', primary: '#a855f7', secondary: '#d946ef', accent: '#22d3ee', background: '#000000', surface: '#0a0a0a', style: 'sleek-dark' },
    { name: 'Sage Serenity', primary: '#84cc16', secondary: '#a3e635', accent: '#4ade80', background: '#fefce8', surface: '#ffffff', style: 'organic-light' },
    { name: 'Electric Blue', primary: '#3b82f6', secondary: '#60a5fa', accent: '#22d3ee', background: '#0f172a', surface: '#1e293b', style: 'tech-dark' },
    { name: 'Peach Sunset', primary: '#fb923c', secondary: '#fdba74', accent: '#fef3c7', background: '#fff7ed', surface: '#ffffff', style: 'warm-light' },
    { name: 'Cosmic Purple', primary: '#c084fc', secondary: '#e879f9', accent: '#f0abfc', background: '#0c0014', surface: '#1a0026', style: 'space-dark' },
    { name: 'Teal Oasis', primary: '#14b8a6', secondary: '#2dd4bf', accent: '#5eead4', background: '#042f2e', surface: '#134e4a', style: 'tropical-dark' },
    { name: 'Blush Pink', primary: '#ec4899', secondary: '#f472b6', accent: '#fce7f3', background: '#fdf2f8', surface: '#ffffff', style: 'feminine-light' },
    { name: 'Charcoal Modern', primary: '#6366f1', secondary: '#818cf8', accent: '#22d3ee', background: '#18181b', surface: '#27272a', style: 'modern-dark' },
    { name: 'Lime Zest', primary: '#84cc16', secondary: '#bef264', accent: '#22c55e', background: '#ecfccb', surface: '#ffffff', style: 'energetic-light' },
    { name: 'Burgundy Elegance', primary: '#be123c', secondary: '#e11d48', accent: '#fda4af', background: '#1c1917', surface: '#292524', style: 'refined-dark' },
];

// Typography combinations
const FONT_COMBINATIONS = [
    { heading: 'Inter', body: 'Inter', mono: 'JetBrains Mono' },
    { heading: 'Poppins', body: 'Open Sans', mono: 'Fira Code' },
    { heading: 'Montserrat', body: 'Lato', mono: 'Source Code Pro' },
    { heading: 'Playfair Display', body: 'Source Sans Pro', mono: 'Monaco' },
    { heading: 'Space Grotesk', body: 'DM Sans', mono: 'JetBrains Mono' },
    { heading: 'Outfit', body: 'Work Sans', mono: 'Fira Code' },
    { heading: 'Clash Display', body: 'Satoshi', mono: 'IBM Plex Mono' },
    { heading: 'Cabinet Grotesk', body: 'General Sans', mono: 'JetBrains Mono' },
    { heading: 'Sora', body: 'Plus Jakarta Sans', mono: 'Fira Code' },
    { heading: 'Bricolage Grotesque', body: 'Be Vietnam Pro', mono: 'Source Code Pro' },
];

// Layout patterns
const LAYOUT_PATTERNS = [
    { name: 'Classic Hero', hero: 'full-height-gradient', sections: 'alternating-bg', cards: 'grid-3' },
    { name: 'Split Screen', hero: 'split-image-text', sections: 'full-width', cards: 'masonry' },
    { name: 'Centered Focus', hero: 'centered-minimal', sections: 'narrow-width', cards: 'list-view' },
    { name: 'Asymmetric Bold', hero: 'asymmetric-overlap', sections: 'offset-grid', cards: 'staggered' },
    { name: 'Video Background', hero: 'video-bg-overlay', sections: 'card-heavy', cards: 'grid-4' },
    { name: 'Floating Cards', hero: 'minimal-text', sections: 'floating-elements', cards: 'hover-lift' },
    { name: 'Magazine Style', hero: 'editorial-split', sections: 'multi-column', cards: 'featured-grid' },
    { name: 'App Landing', hero: 'device-mockup', sections: 'feature-blocks', cards: 'icon-cards' },
    { name: 'Portfolio Grid', hero: 'text-only-bold', sections: 'gallery-grid', cards: 'hover-reveal' },
    { name: 'SaaS Modern', hero: 'gradient-blob', sections: 'comparison-tables', cards: 'pricing-cards' },
];

// Animation styles
const ANIMATION_STYLES = [
    { name: 'Subtle Elegance', entrance: 'fade-up', hover: 'scale-slight', scroll: 'fade-in', timing: 'ease-out' },
    { name: 'Playful Bounce', entrance: 'bounce-in', hover: 'wiggle', scroll: 'slide-in', timing: 'spring' },
    { name: 'Smooth Flow', entrance: 'slide-up', hover: 'glow', scroll: 'parallax', timing: 'ease-in-out' },
    { name: 'Sharp Precision', entrance: 'clip-reveal', hover: 'underline-expand', scroll: 'stagger', timing: 'linear' },
    { name: 'Organic Movement', entrance: 'morph-in', hover: 'rotate-subtle', scroll: 'wave', timing: 'cubic-bezier' },
    { name: 'Dramatic Impact', entrance: 'zoom-burst', hover: 'shake', scroll: 'reveal-clip', timing: 'ease-out-back' },
    { name: 'Minimal Fade', entrance: 'fade-only', hover: 'opacity-shift', scroll: 'fade-stagger', timing: 'ease' },
    { name: 'Tech Glitch', entrance: 'glitch-in', hover: 'flicker', scroll: 'typewriter', timing: 'steps' },
];

// 2024-2025 Design trends
const DESIGN_TRENDS_2025 = [
    'Bento Grid Layouts - Card-based asymmetric grids',
    'Glassmorphism 2.0 - Frosted glass with colored overlays',
    'Gradient Mesh Backgrounds - Multi-color gradient blobs',
    'Micro-interactions - Every button, input has subtle animations',
    'Dark Mode First - Rich dark themes with vibrant accents',
    'Neumorphism Accents - Soft shadows on buttons and cards',
    '3D Elements - Floating shapes, depth layers',
    'Animated Cursors - Custom cursor effects',
    'Scroll Storytelling - Scroll-triggered narrative animations',
    'Variable Fonts - Dynamic typography with weight/width changes',
    'Claymorphism - Soft 3D inflated UI elements',
    'Aurora Gradients - Animated northern lights effects',
    'Brutal Minimalism - Bold typography, stark contrasts',
    'Retro Futurism - 80s aesthetics with modern tech',
    'Organic Shapes - Blob backgrounds, curved sections',
];

// Component style variations
const COMPONENT_STYLES = {
    buttons: [
        { variant: 'solid-rounded', hover: 'scale-glow', size: 'lg' },
        { variant: 'outline-pill', hover: 'fill-in', size: 'md' },
        { variant: 'ghost-minimal', hover: 'underline', size: 'sm' },
        { variant: 'gradient-animated', hover: 'shimmer', size: 'lg' },
        { variant: 'neumorphic', hover: 'press-in', size: 'md' },
        { variant: '3d-raised', hover: 'press-down', size: 'lg' },
    ],
    cards: [
        { variant: 'glass-blur', hover: 'lift-glow', corners: 'xl' },
        { variant: 'solid-shadow', hover: 'tilt-3d', corners: 'lg' },
        { variant: 'outline-subtle', hover: 'border-glow', corners: 'md' },
        { variant: 'gradient-border', hover: 'scale', corners: 'full' },
        { variant: 'neumorphic-inset', hover: 'pop-out', corners: 'xl' },
        { variant: 'floating-shadow', hover: 'rotate-subtle', corners: 'lg' },
    ],
    inputs: [
        { variant: 'underline-animate', focus: 'line-expand', label: 'floating' },
        { variant: 'outlined-rounded', focus: 'border-glow', label: 'inside' },
        { variant: 'filled-subtle', focus: 'lift', label: 'above' },
        { variant: 'glass-blur', focus: 'glow', label: 'floating' },
    ],
    navigation: [
        { variant: 'sticky-blur', style: 'horizontal', indicator: 'underline' },
        { variant: 'floating-pill', style: 'centered', indicator: 'background' },
        { variant: 'sidebar-collapsible', style: 'vertical', indicator: 'border-left' },
        { variant: 'mega-menu', style: 'dropdown', indicator: 'arrow' },
    ],
};

// Extended package suggestions based on project type
const EXTENDED_PACKAGES: Record<string, Record<string, string>> = {
    ecommerce: {
        'stripe': '^14.0.0',
        '@stripe/stripe-js': '^2.4.0',
        'react-hot-toast': '^2.4.1',
        'swiper': '^11.0.5',
    },
    dashboard: {
        'recharts': '^2.10.3',
        'react-circular-progressbar': '^2.1.0',
        '@tanstack/react-table': '^8.11.2',
        'react-dropzone': '^14.2.3',
    },
    social: {
        'socket.io-client': '^4.7.2',
        'emoji-picker-react': '^4.6.0',
        'react-virtualized': '^9.22.5',
    },
    portfolio: {
        'swiper': '^11.0.5',
        'gsap': '^3.12.4',
        '@react-three/fiber': '^8.15.12',
        '@react-three/drei': '^9.92.7',
    },
    blog: {
        'react-markdown': '^9.0.1',
        'prism-react-renderer': '^2.3.1',
        'reading-time': '^1.5.0',
    },
    landing: {
        'gsap': '^3.12.4',
        'react-intersection-observer': '^9.5.3',
        'swiper': '^11.0.5',
    },
    saas: {
        'recharts': '^2.10.3',
        '@tanstack/react-table': '^8.11.2',
        'react-hot-toast': '^2.4.1',
        'react-dropzone': '^14.2.3',
    },
    default: {
        'gsap': '^3.12.4',
        'swiper': '^11.0.5',
        'react-hot-toast': '^2.4.1',
    },
};

export interface DynamicDesignTheme {
    id: string;
    timestamp: number;
    palette: typeof COLOR_PALETTES[0];
    fonts: typeof FONT_COMBINATIONS[0];
    layout: typeof LAYOUT_PATTERNS[0];
    animation: typeof ANIMATION_STYLES[0];
    trends: string[];
    components: {
        button: typeof COMPONENT_STYLES.buttons[0];
        card: typeof COMPONENT_STYLES.cards[0];
        input: typeof COMPONENT_STYLES.inputs[0];
        navigation: typeof COMPONENT_STYLES.navigation[0];
    };
    extendedPackages: Record<string, string>;
}

/**
 * Generate a unique design theme for each project
 */
export function generateDynamicTheme(projectDescription: string): DynamicDesignTheme {
    const descLower = projectDescription.toLowerCase();

    // Determine project category for package suggestions
    let projectCategory = 'default';
    if (descLower.includes('shop') || descLower.includes('store') || descLower.includes('ecommerce') || descLower.includes('cart')) {
        projectCategory = 'ecommerce';
    } else if (descLower.includes('dashboard') || descLower.includes('admin') || descLower.includes('analytics')) {
        projectCategory = 'dashboard';
    } else if (descLower.includes('social') || descLower.includes('chat') || descLower.includes('community')) {
        projectCategory = 'social';
    } else if (descLower.includes('portfolio') || descLower.includes('gallery') || descLower.includes('artist')) {
        projectCategory = 'portfolio';
    } else if (descLower.includes('blog') || descLower.includes('news') || descLower.includes('article')) {
        projectCategory = 'blog';
    } else if (descLower.includes('landing') || descLower.includes('marketing') || descLower.includes('product')) {
        projectCategory = 'landing';
    } else if (descLower.includes('saas') || descLower.includes('platform') || descLower.includes('app')) {
        projectCategory = 'saas';
    }

    // Random selections with seed from timestamp for uniqueness
    const seed = Date.now() + Math.random() * 1000000;
    const randomIndex = (arr: any[]) => Math.floor((seed * Math.random()) % arr.length);

    // Select random trends (3-5 trends per project)
    const trendCount = 3 + Math.floor(Math.random() * 3);
    const shuffledTrends = [...DESIGN_TRENDS_2025].sort(() => Math.random() - 0.5);
    const selectedTrends = shuffledTrends.slice(0, trendCount);

    const theme: DynamicDesignTheme = {
        id: `theme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        palette: COLOR_PALETTES[randomIndex(COLOR_PALETTES)],
        fonts: FONT_COMBINATIONS[randomIndex(FONT_COMBINATIONS)],
        layout: LAYOUT_PATTERNS[randomIndex(LAYOUT_PATTERNS)],
        animation: ANIMATION_STYLES[randomIndex(ANIMATION_STYLES)],
        trends: selectedTrends,
        components: {
            button: COMPONENT_STYLES.buttons[randomIndex(COMPONENT_STYLES.buttons)],
            card: COMPONENT_STYLES.cards[randomIndex(COMPONENT_STYLES.cards)],
            input: COMPONENT_STYLES.inputs[randomIndex(COMPONENT_STYLES.inputs)],
            navigation: COMPONENT_STYLES.navigation[randomIndex(COMPONENT_STYLES.navigation)],
        },
        extendedPackages: EXTENDED_PACKAGES[projectCategory] || EXTENDED_PACKAGES.default,
    };

    console.log(`[DynamicTrends] Generated theme: ${theme.palette.name} + ${theme.layout.name}`);
    console.log(`[DynamicTrends] Trends: ${theme.trends.join(', ')}`);
    console.log(`[DynamicTrends] Extended packages: ${Object.keys(theme.extendedPackages).join(', ')}`);

    return theme;
}

/**
 * Format theme for LLM prompt injection
 */
export function formatThemeForPrompt(theme: DynamicDesignTheme): string {
    return `
============================================================================================
UNIQUE DESIGN THEME FOR THIS PROJECT (THEME ID: ${theme.id})
============================================================================================

COLOR PALETTE: "${theme.palette.name}"
- Primary: ${theme.palette.primary}
- Secondary: ${theme.palette.secondary}
- Accent: ${theme.palette.accent}
- Background: ${theme.palette.background}
- Surface: ${theme.palette.surface}
- Style: ${theme.palette.style}

TYPOGRAPHY:
- Headings: "${theme.fonts.heading}" (bold, impactful)
- Body: "${theme.fonts.body}" (readable, clean)
- Code: "${theme.fonts.mono}"

LAYOUT PATTERN: "${theme.layout.name}"
- Hero Style: ${theme.layout.hero}
- Section Style: ${theme.layout.sections}
- Card Layout: ${theme.layout.cards}

ANIMATION STYLE: "${theme.animation.name}"
- Page Entrance: ${theme.animation.entrance}
- Hover Effects: ${theme.animation.hover}
- Scroll Animations: ${theme.animation.scroll}
- Timing: ${theme.animation.timing}

COMPONENT STYLES:
- Buttons: ${theme.components.button.variant}, hover: ${theme.components.button.hover}
- Cards: ${theme.components.card.variant}, corners: ${theme.components.card.corners}
- Inputs: ${theme.components.input.variant}, focus: ${theme.components.input.focus}
- Navigation: ${theme.components.navigation.variant}, style: ${theme.components.navigation.style}

2024-2025 DESIGN TRENDS TO APPLY:
${theme.trends.map((trend, i) => `${i + 1}. ${trend}`).join('\n')}

EXTENDED PACKAGES TO USE (install dynamically):
${Object.entries(theme.extendedPackages).map(([pkg, ver]) => `- ${pkg}: ${ver}`).join('\n')}

============================================================================================
IMPORTANT: This theme is UNIQUE to this project. DO NOT use default colors or patterns.
Apply this exact design system throughout ALL components and pages.
============================================================================================
`;
}

/**
 * Generate responsive design patterns based on project type
 */
export function generateResponsivePatterns(projectType: string): string {
    return `
============================================================================================
RESPONSIVE DESIGN PATTERNS (MANDATORY)
============================================================================================

BREAKPOINT STRATEGY:
- Mobile First: Base styles for 320px+
- sm (640px): Tablet portrait
- md (768px): Tablet landscape
- lg (1024px): Laptop/Desktop
- xl (1280px): Large desktop
- 2xl (1536px): Wide screens

GRID PATTERNS:
- Products/Cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Two Column: grid-cols-1 lg:grid-cols-2
- Gallery: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5

TYPOGRAPHY SCALING:
- Hero H1: text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl
- Section H2: text-2xl sm:text-3xl md:text-4xl lg:text-5xl
- Card Title: text-lg sm:text-xl md:text-2xl
- Body: text-sm sm:text-base md:text-lg

SPACING PATTERNS:
- Section padding: py-12 sm:py-16 md:py-20 lg:py-24
- Container: px-4 sm:px-6 lg:px-8
- Gap: gap-4 sm:gap-6 md:gap-8

NAVIGATION:
- Mobile: Hamburger menu with slide-in drawer
- Desktop: Horizontal nav with hover dropdowns

IMAGES:
- Hero: aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]
- Cards: aspect-square sm:aspect-[4/3]
- Gallery: aspect-square

TOUCH TARGETS:
- All buttons: min-h-[44px] min-w-[44px] for mobile accessibility

============================================================================================
`;
}

export const DynamicTrendsService = {
    generateDynamicTheme,
    formatThemeForPrompt,
    generateResponsivePatterns,
    COLOR_PALETTES,
    FONT_COMBINATIONS,
    LAYOUT_PATTERNS,
    ANIMATION_STYLES,
    EXTENDED_PACKAGES,
};
