export const QUALITY_REQUIREMENTS = `
=== CRITICAL QUALITY REQUIREMENTS ===

YOU MUST FOLLOW THESE RULES ABSOLUTELY:

1. **ZERO PLACEHOLDERS ALLOWED**
   - NO "Lorem ipsum" text
   - NO "Coming soon" messages
   - NO "Under construction" pages
   - EVERY page must have REAL, relevant content
   - EVERY feature mentioned must be FULLY implemented

2. **COMPLETE FILE STRUCTURE**
   - Include ALL configuration files (tsconfig.json, tsconfig.node.json, vite.config.ts, postcss.config.js, tailwind.config.js)
   - Include .gitignore
   - Include .env.example with ALL required variables
   - Include README.md with setup instructions

3. **DEPENDENCY MANAGEMENT**
   - EVERY import/module used MUST be in package.json
   - Use exact versions, not "latest"
   - Include ALL @types packages for TypeScript
   - Double-check every import statement

4. **ERROR-FREE CODE**
   - NO TypeScript errors
   - NO runtime errors
   - ALL types properly defined
   - NO "any" types unless absolutely necessary
   - Proper error handling everywhere

5. **UI/UX EXCELLENCE**
   - Use web-safe, accessible color schemes
   - Ensure proper contrast ratios (WCAG AA minimum)
   - Responsive design (mobile, tablet, desktop)
   - Smooth animations and transitions
   - Loading states for all async operations
   - Error states with helpful messages
   - Empty states with clear guidance

6. **COLOR SCHEME REQUIREMENTS**
   - Generate colors based on project theme/industry
   - Use HSL for better control
   - Provide light and dark mode support (or choose one consistently)
   - Ensure text readability on all backgrounds
   - Use semantic color names (primary, secondary, accent, danger, success, etc.)

7. **COMPLETE PAGE IMPLEMENTATIONS**
   - Home page: Hero section, features, CTA, footer
   - About page: Company story, team, mission/vision
   - Contact page: Working contact form, address, map (if applicable)
   - Auth pages: Fully functional login/register/forgot password
   - Product/Service pages: Real product data, filters, search
   - Profile/Dashboard: Full user management
   - Any other pages: Fully implemented with real content

8. **BACKEND INTEGRATION**
   - Create API client with proper error handling
   - Implement all CRUD operations
   - Add loading and error states
   - Use environment variables for API URLs
   - Implement authentication/authorization properly

9. **PRODUCTION READINESS**
   - Optimize images (lazy loading, proper sizes)
   - Use ONLY working image URLs from Unsplash (https://images.unsplash.com/photo-xxxxx?w=800)
   - Code splitting where appropriate
   - SEO meta tags on all pages
   - Accessibility attributes (ARIA labels, alt text)
   - Performance optimizations (React.memo, useMemo, useCallback where needed)

10. **CONSISTENCY**
    - Consistent naming conventions
    - Consistent file structure
    - Consistent component patterns
    - Consistent styling approach
    - Follow the project's architecture

11. **NO README FILES**
    - DO NOT create README.md files
    - DO NOT create documentation files
    - Setup instructions are not needed

12. **DATABASE SEED FILE (Backend Only)**
    - MUST create seed.js or seed.ts file
    - Include realistic sample data for ALL models
    - At least 10-20 records for main entities
    - Runnable with: node seed.js or npm run seed

=== IF YOU CANNOT IMPLEMENT SOMETHING PROPERLY, DON'T CREATE A PLACEHOLDER - SKIP IT ===

Your goal is to create code that works immediately after \`npm install && npm run dev\` with ZERO errors.
`;

export const FRONTEND_QUALITY_CHECKLIST = `
BEFORE SUBMITTING YOUR CODE, VERIFY:

□ All config files present (tsconfig.json, tsconfig.node.json, vite.config.ts, postcss.config.js, tailwind.config.js)
□ All dependencies in package.json
□ All pages fully implemented (no placeholders)
□ Color scheme is professional and accessible
□ Responsive design works on all screen sizes
□ All forms have validation
□ API client created (src/api/client.ts)
□ API service files created for ALL backend endpoints
□ NO MOCK DATA - all data fetched from backend
□ .env file created with VITE_API_URL
□ All API calls have error handling
□ Loading states everywhere
□ No TypeScript errors
□ No console.errors in browser
□ Images use working Unsplash URLs only
□ Images have alt text
□ Links have proper targets
□ Buttons have proper types
□ Input fields have proper labels
□ NO README.md file created
`;

export const BACKEND_QUALITY_CHECKLIST = `
BEFORE SUBMITTING YOUR CODE, VERIFY:

□ All dependencies in package.json
□ Environment variables in .env.example
□ Database connection properly configured
□ All routes have proper validation
□ All routes have error handling
□ Authentication/authorization implemented
□ Password hashing implemented
□ JWT tokens implemented correctly
□ API responses follow consistent format
□ Proper HTTP status codes used
□ Input validation using Zod/Joi
□ Database models have proper indexes
□ Middleware properly ordered
□ CORS configured correctly
□ Security headers (helmet) configured
□ No TypeScript errors
□ No hardcoded secrets
□ Proper logging implemented
□ **seed.js or seed.ts file created with sample data**
□ Seed file includes 10-20+ realistic records
□ Seed file is runnable (node seed.js)
□ NO README.md file created
`;
