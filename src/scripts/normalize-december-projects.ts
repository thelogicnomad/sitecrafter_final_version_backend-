/**
 * Migration Script: Normalize December Project File Paths
 * 
 * This script adds the `src/` prefix to files that should be inside the src folder
 * for projects uploaded in December 2025 via zip file import.
 * 
 * Run with: npx ts-node src/scripts/normalize-december-projects.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Files that should be in src/ folder
const SRC_FILES = [
    'App.tsx',
    'App.jsx',
    'App.ts',
    'App.js',
    'main.tsx',
    'main.jsx',
    'main.ts',
    'main.js',
    'index.css',
    'index.tsx',
    'index.ts',
    'vite-env.d.ts',
];

// Folders that should be in src/ 
const SRC_FOLDERS = [
    'components/',
    'pages/',
    'lib/',
    'utils/',
    'hooks/',
    'context/',
    'services/',
    'types/',
    'assets/',
    'styles/',
    'layouts/',
    'features/',
    'api/',
    'store/',
    'data/',
];

// Files that should NOT be in src/ (root level files)
const ROOT_FILES = [
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'vite.config.js',
    'tsconfig.json',
    'tsconfig.node.json',
    'tailwind.config.js',
    'tailwind.config.ts',
    'postcss.config.js',
    'postcss.config.cjs',
    'eslint.config.js',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.gitignore',
    'README.md',
];

interface ProjectFile {
    path: string;
    content: string;
}

interface Project {
    _id: mongoose.Types.ObjectId;
    name: string;
    files: ProjectFile[];
    createdAt: Date;
}

async function normalizeProjects() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sitecrafter';

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the projects collection
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection failed');
    }

    const projectsCollection = db.collection('projects');

    // Find projects created in December 2025
    const decemberStart = new Date('2025-12-01T00:00:00.000Z');
    const decemberEnd = new Date('2025-12-31T23:59:59.999Z');

    console.log('\n📋 Finding December 2025 projects...');

    const projects = await projectsCollection.find({
        createdAt: {
            $gte: decemberStart,
            $lte: decemberEnd
        }
    }).toArray();

    console.log(`Found ${projects.length} projects from December 2025`);

    let normalizedCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
        const projectName = project.name || project._id.toString();
        const files = project.files as ProjectFile[];

        if (!files || files.length === 0) {
            console.log(`⏭️ Skipping ${projectName}: No files`);
            skippedCount++;
            continue;
        }

        // Check if this project needs normalization
        // If ANY file starts with /src/ or src/, it's already normalized
        const alreadyNormalized = files.some(f =>
            f.path.startsWith('/src/') || f.path.startsWith('src/')
        );

        if (alreadyNormalized) {
            console.log(`⏭️ Skipping ${projectName}: Already has src/ structure`);
            skippedCount++;
            continue;
        }

        // Check if this looks like a project that needs src/ normalization
        const hasSrcFiles = files.some(f => {
            const cleanPath = f.path.replace(/^\//, '');
            return SRC_FILES.some(sf => cleanPath === sf) ||
                SRC_FOLDERS.some(folder => cleanPath.startsWith(folder));
        });

        if (!hasSrcFiles) {
            console.log(`⏭️ Skipping ${projectName}: Doesn't look like a React/Vite project`);
            skippedCount++;
            continue;
        }

        console.log(`\n🔧 Normalizing: ${projectName} (${files.length} files)`);

        // Normalize file paths
        const normalizedFiles = files.map(file => {
            let path = file.path;

            // Ensure path starts with /
            if (!path.startsWith('/')) {
                path = '/' + path;
            }

            const cleanPath = path.replace(/^\//, '');

            // Check if this is a root-level file (should NOT be in src/)
            const isRootFile = ROOT_FILES.some(rf => cleanPath === rf);
            if (isRootFile) {
                return { ...file, path };
            }

            // Check if this file/folder should be in src/
            const shouldBeInSrc =
                SRC_FILES.some(sf => cleanPath === sf) ||
                SRC_FOLDERS.some(folder => cleanPath.startsWith(folder));

            if (shouldBeInSrc) {
                // Add src/ prefix
                const newPath = '/src/' + cleanPath;
                console.log(`  📁 ${path} → ${newPath}`);
                return { ...file, path: newPath };
            }

            return { ...file, path };
        });

        // Update the project in MongoDB
        await projectsCollection.updateOne(
            { _id: project._id },
            { $set: { files: normalizedFiles } }
        );

        console.log(`  ✅ Normalized ${projectName}`);
        normalizedCount++;
    }

    console.log('\n' + '═'.repeat(50));
    console.log('📊 NORMALIZATION COMPLETE');
    console.log('═'.repeat(50));
    console.log(`   Normalized: ${normalizedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${projects.length}`);
    console.log('═'.repeat(50));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
}

// Run the migration
normalizeProjects()
    .then(() => {
        console.log('✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
