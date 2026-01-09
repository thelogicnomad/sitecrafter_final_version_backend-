/**
 * Validation Node - Validates all generated files
 * Checks for: duplicate Router, missing imports, unused components, etc.
 */

import { WebsiteState, ValidationError } from '../graph-state';
import { notifyPhaseChange } from '../website-graph';

export async function validationNode(state: WebsiteState): Promise<Partial<WebsiteState>> {
    console.log('\n ═══════════════════════════════════════════');
    console.log(' NODE: VALIDATION');
    console.log(' ═══════════════════════════════════════════\n');

    // Notify phase change for streaming
    notifyPhaseChange('validation');

    const errors: ValidationError[] = [];
    const files = state.files;

    // 1. Check for duplicate BrowserRouter
    let browserRouterCount = 0;
    let browserRouterFiles: string[] = [];

    files.forEach((file, path) => {
        if (file.content.includes('BrowserRouter') && !path.includes('node_modules')) {
            browserRouterCount++;
            browserRouterFiles.push(path);
        }
    });

    if (browserRouterCount > 1) {
        errors.push({
            type: 'router_duplicate',
            file: browserRouterFiles.join(', '),
            message: `BrowserRouter found in ${browserRouterCount} files. Should ONLY be in main.tsx`,
            severity: 'error',
            suggestedFix: 'Remove BrowserRouter from all files except main.tsx. Use Routes/Route in App.tsx'
        });
    }

    // Check each file
    files.forEach((file, path) => {
        // Skip config files
        if (!path.match(/\.(tsx?|jsx?)$/)) return;

        // 2. Check for placeholder content
        const placeholders = ['TODO', 'PLACEHOLDER', 'coming soon', 'Lorem ipsum'];
        for (const placeholder of placeholders) {
            if (file.content.toLowerCase().includes(placeholder.toLowerCase())) {
                errors.push({
                    type: 'syntax',
                    file: path,
                    message: `Contains placeholder text: "${placeholder}"`,
                    severity: 'warning',
                    suggestedFix: `Replace "${placeholder}" with actual implementation`
                });
            }
        }

        // 3. Check for empty components
        if (file.content.includes('return null') || file.content.includes('return <></>')) {
            errors.push({
                type: 'syntax',
                file: path,
                message: 'Component returns null or empty fragment',
                severity: 'error',
                suggestedFix: 'Implement actual component content'
            });
        }

        // 4. Check for missing default exports in pages
        if (path.includes('/pages/') && !file.content.includes('export default')) {
            errors.push({
                type: 'missing_export',
                file: path,
                message: 'Page missing default export',
                severity: 'error',
                suggestedFix: 'Add: export default PageName;'
            });
        }

        // 5. Check @/ imports resolve to existing files
        const importMatches = file.content.matchAll(/from\s+['"](@\/[^'"]+)['"]/g);
        for (const match of importMatches) {
            const importPath = match[1].replace('@/', 'src/');
            const normalizedPath = importPath.match(/\.(tsx?|jsx?)$/) ? importPath : importPath + '.tsx';

            // Check if file exists
            const exists = files.has(normalizedPath) ||
                files.has(normalizedPath.replace('.tsx', '.ts')) ||
                files.has(importPath + '/index.tsx');

            if (!exists) {
                errors.push({
                    type: 'missing_import',
                    file: path,
                    message: `Import "${match[1]}" not found`,
                    severity: 'error',
                    suggestedFix: `Create file: ${normalizedPath}`
                });
            }
        }
    });

    // 6. Check for unused components
    const registry = state.fileRegistry;
    registry.forEach((entry, path) => {
        if (entry.type === 'component' && !path.includes('layout')) {
            // Check if any file imports this
            let isUsed = false;
            files.forEach(file => {
                if (file.content.includes(`from '@/${path.replace('src/', '').replace('.tsx', '')}'`)) {
                    isUsed = true;
                }
            });

            if (!isUsed) {
                errors.push({
                    type: 'unused_component',
                    file: path,
                    message: `Component exported but never imported`,
                    severity: 'warning'
                });
            }
        }
    });

    console.log(`\n Validation complete:`);
    console.log(`   Errors: ${errors.filter(e => e.severity === 'error').length}`);
    console.log(`   Warnings: ${errors.filter(e => e.severity === 'warning').length}`);

    if (errors.length > 0) {
        console.log('\n   Issues found:');
        errors.slice(0, 10).forEach(e => {
            console.log(`   ${e.severity === 'error' ? '❌' : '⚠️'} ${e.file}: ${e.message}`);
        });
        if (errors.length > 10) {
            console.log(`   ... and ${errors.length - 10} more`);
        }
    }

    return {
        errors,
        iterationCount: 1, // Increment
        currentPhase: 'validation',
        messages: [`Validation: ${errors.length} issues found`]
    };
}
