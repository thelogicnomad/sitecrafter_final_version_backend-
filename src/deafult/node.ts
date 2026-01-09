export const nodeprompt = `<chirArtifact id="project-import" title="Project Files"><chirAction type="file" filePath="package.json">{
  "name": "backend",
  "version": "1.0.0",
  "description": "TypeScript Express Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.3",
    "ts-node-dev": "^2.0.0"
  }
}
</chirAction><chirAction type="file" filePath="tsconfig.json">{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
</chirAction><chirAction type="file" filePath=".env.example">PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db-name
JWT_SECRET=your-jwt-secret-key-change-in-production
NODE_ENV=development
</chirAction><chirAction type="file" filePath="src/server.ts">import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
</chirAction><chirAction type="file" filePath="src/types/index.ts">export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
</chirAction></chirArtifact>`;