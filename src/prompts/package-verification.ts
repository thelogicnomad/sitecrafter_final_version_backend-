/**
 * PACKAGE VERIFICATION PROMPT
 * Forces AI to list ALL packages BEFORE generating code
 * Ensures ZERO missing dependencies
 */

export const PACKAGE_VERIFICATION_PROMPT = `YOU MUST FOLLOW THIS PROCESS EXACTLY - NO EXCEPTIONS!

=== STEP 1: ANALYZE REQUIREMENTS ===
Read the user request carefully and identify:
1. What features are needed?
2. What UI components are needed?
3. What libraries are needed for each feature?
4. What types are needed?

=== STEP 2: CREATE COMPLETE PACKAGE LIST ===
BEFORE generating ANY code, create a COMPLETE list of ALL packages needed.

For EVERY feature, list the package:
- Search feature → need "lucide-react" for icons
- Form validation → need "react-hook-form" + "zod" + "@hookform/resolvers"
- UI components → need "class-variance-authority" + "@radix-ui/react-slot"
- Animations → need "framer-motion"
- State management → need "zustand"
- HTTP requests → need "axios"
- Date handling → need "date-fns"
- Utilities → need "clsx" + "tailwind-merge"
- Routing → need "react-router-dom"
- Styling → need "tailwindcss"

=== STEP 3: GENERATE COMPLETE PACKAGE.JSON ===
Generate package.json with EVERY package listed:

{
  "name": "project-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1",
    "axios": "^1.7.9",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^2.0.2",
    "framer-motion": "^11.0.0",
    "zustand": "^4.4.0",
    "date-fns": "^3.0.0",
    "react-countup": "^6.5.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^20.14.10",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "@eslint/js": "^9.9.1",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "typescript-eslint": "^8.3.0"
  }
}

=== STEP 4: VERIFY EACH IMPORT ===
For EVERY import in code, verify:
1. Is the package in package.json? YES or NO
2. Is the import path correct? YES or NO
3. Is the export available? YES or NO

EXAMPLE:
✓ import { useForm } from "react-hook-form" → Package exists, export available
✓ import { zodResolver } from "@hookform/resolvers/zod" → Package exists, export available
✓ import { Button } from "@/components/ui/Button" → File exists, export available
✗ import { usePathname } from "react-router-dom" → WRONG! Use useLocation instead

=== STEP 5: GENERATE CODE ===
Only generate code using packages that are in package.json.

FORBIDDEN IMPORTS:
- import { usePathname } from "react-router-dom" → WRONG (doesn't exist)
- import { useSearchParams } from "react-router-dom" → WRONG (doesn't exist)
- import { useParams } from "react-router-dom" → OK (exists)
- import { useLocation } from "react-router-dom" → OK (exists)

CORRECT REACT-ROUTER-DOM EXPORTS:
✓ useNavigate
✓ useLocation
✓ useParams
✓ useSearchParams (NOT in v7, use useLocation instead)
✓ Link
✓ Routes
✓ Route
✓ BrowserRouter
✓ Outlet

=== STEP 6: COMPLETE VERIFICATION CHECKLIST ===

Before returning code, verify EACH item:

PACKAGE.JSON:
☑ All packages listed
☑ All versions compatible
☑ No missing dependencies
☑ No version conflicts
☑ All devDependencies included

IMPORTS:
☑ All imports from package.json
☑ All file imports exist
☑ No circular imports
☑ No missing imports
☑ Correct export names

COMPONENTS:
☑ All props have types
☑ All state has types
☑ All functions have types
☑ Error handling exists
☑ Loading states exist

CONFIGURATION:
☑ tsconfig.json correct
☑ vite.config.ts correct
☑ tailwind.config.js correct
☑ postcss.config.js correct

QUALITY:
☑ No console errors
☑ No console warnings
☑ No TypeScript errors
☑ No unused imports
☑ No unused variables

=== CRITICAL RULES ===

1. **PACKAGE.JSON IS GENERATED FIRST**
   - Before ANY code
   - List EVERY package
   - Verify compatibility

2. **EVERY IMPORT MUST BE VERIFIED**
   - Check package.json
   - Check file exists
   - Check export available

3. **NO MISSING PACKAGES**
   - If code uses it, it must be in package.json
   - If package.json has it, code can use it

4. **NO BROKEN IMPORTS**
   - All imports must work
   - All exports must exist
   - All files must exist

5. **NO WRONG EXPORTS**
   - Use correct export names
   - Use correct package names
   - Use correct file paths

=== COMMON MISTAKES TO AVOID ===

❌ WRONG: import { usePathname } from "react-router-dom"
✓ RIGHT: import { useLocation } from "react-router-dom"

❌ WRONG: import { Button } from "@radix-ui/primitives"
✓ RIGHT: import { Button } from "@/components/ui/Button"

❌ WRONG: Missing @hookform/resolvers in package.json but using it in code
✓ RIGHT: Add @hookform/resolvers to package.json

❌ WRONG: Using gsap but not in package.json
✓ RIGHT: Add gsap to package.json if using it

❌ WRONG: Generating code without package.json
✓ RIGHT: Generate package.json FIRST, then code

=== FINAL CHECKLIST ===

BEFORE RETURNING CODE:
1. ✅ package.json generated with ALL packages
2. ✅ ALL imports verified against package.json
3. ✅ ALL file imports verified to exist
4. ✅ ALL exports verified to be available
5. ✅ NO missing packages
6. ✅ NO missing files
7. ✅ NO broken imports
8. ✅ NO wrong export names
9. ✅ Code is production-ready
10. ✅ Client can npm install without errors

GENERATE PERFECT CODE WITH COMPLETE PACKAGE.JSON!`;

export const PACKAGE_GENERATION_RULES = `
=== PACKAGE GENERATION RULES ===

RULE 1: GENERATE PACKAGE.JSON FIRST
- Before ANY code
- List EVERY package needed
- Include exact versions
- Include all devDependencies

RULE 2: VERIFY EACH PACKAGE
- Check if package exists on npm
- Check if version is compatible
- Check if exports are available
- Check if it works with other packages

RULE 3: LIST PACKAGES BY FEATURE
Search Feature:
  - lucide-react (for search icon)
  - No additional packages needed

Form Validation:
  - react-hook-form (for form handling)
  - zod (for validation schemas)
  - @hookform/resolvers (for zod integration)

UI Components:
  - class-variance-authority (for component variants)
  - @radix-ui/react-slot (for component composition)
  - clsx (for conditional classes)
  - tailwind-merge (for Tailwind merging)

Animations:
  - framer-motion (for animations)
  - gsap (for advanced animations)
  - @gsap/react (for React integration)

State Management:
  - zustand (for global state)
  - react-query (for server state)

HTTP Requests:
  - axios (for API calls)

Utilities:
  - date-fns (for date handling)
  - lodash (for utility functions)

Routing:
  - react-router-dom (for routing)

Styling:
  - tailwindcss (for styling)
  - tailwindcss-animate (for animations)

RULE 4: VERIFY IMPORTS IN CODE
For EVERY import statement:
1. Check package exists in package.json
2. Check export name is correct
3. Check file path is correct (if file import)
4. Check no circular imports

RULE 5: NO MISSING PACKAGES
If code uses a package:
- It MUST be in package.json
- It MUST have correct version
- It MUST be compatible with other packages

RULE 6: NO WRONG IMPORTS
If package doesn't have an export:
- Don't use it
- Use alternative export
- Use different package
- Document the limitation

=== PACKAGE.JSON TEMPLATE ===

{
  "name": "project-name",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1",
    "axios": "^1.7.9",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-slot": "^2.0.2",
    "framer-motion": "^11.0.0",
    "gsap": "^3.12.2",
    "@gsap/react": "^2.1.1",
    "zustand": "^4.4.0",
    "react-query": "^3.39.3",
    "date-fns": "^3.0.0",
    "react-countup": "^6.5.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^20.14.10",
    "@types/lodash": "^4.14.202",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.4",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "@eslint/js": "^9.9.1",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "typescript-eslint": "^8.3.0"
  }
}

=== VERIFICATION CHECKLIST ===

BEFORE GENERATING CODE:
☑ Understand all requirements
☑ List all features needed
☑ List all packages for each feature
☑ Verify package compatibility
☑ Create complete package.json

WHILE GENERATING CODE:
☑ Use only packages in package.json
☑ Use correct import paths
☑ Use correct export names
☑ Verify each import exists
☑ Add proper types
☑ Add error handling
☑ Add loading states

AFTER GENERATING CODE:
☑ Verify all imports in package.json
☑ Verify all file imports exist
☑ Verify all exports available
☑ Verify no missing packages
☑ Verify no broken imports
☑ Verify no wrong exports
☑ Code is production-ready

GENERATE PERFECT CODE WITH COMPLETE PACKAGE.JSON!
`;
