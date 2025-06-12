import fs from 'fs';

const writeFile = (path, content) => {
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const buffer = Buffer.concat([bom, Buffer.from(normalizedContent, 'utf8')]);
    fs.writeFileSync(path, buffer);
    console.log(`Written ${path}`);
};

const basePath = '/Users/patrick/Projects/Teralynk/backend/src/routes';

writeFile(`${basePath}/adminRoutes.mjs`, `// File: /backend/src/routes/adminRoutes.mjs

import express from 'express'; // ... rest of your imports

const router = express.Router();

// ... (All admin routes content as you provided it before)

export default router;
`);

writeFile(`${basePath}/storageRoutes.mjs`, `// File: /backend/src/routes/storageRoutes.mjs

import express from 'express';
import formidable from 'formidable';
import { PutObjectCommand } from '@aws-sdk/client-s3'; // ... rest of your imports

// fs is already imported at the top level of write-routes.mjs

const router = express.Router();

// ... (All storageRoutes content, WITHOUT the fs import)

export default router;
`);

writeFile(`${basePath}/fileShareRoutes.mjs`, `// File: /backend/src/routes/fileShareRoutes.mjs

import express from 'express';
import { body, param, query } from 'express-validator';
// ... rest of your imports

const router = express.Router();

// ... (All fileShareRoutes content, WITHOUT the fs import)

export default router;
`);

writeFile(`${basePath}/workflowRoutes.mjs`, `// File: /backend/src/routes/workflowRoutes.mjs

import express from 'express'; // ... rest of your imports

const router = express.Router();

// ... (All workflowRoutes content)

export default router;
`);

writeFile(`${basePath}/marketplaceRoutes.mjs`, `// File: /backend/src/routes/marketplaceRoutes.mjs

import express from 'express'; // ... rest of your imports

const router = express.Router();

// ... (All marketplaceRoutes content)

export default router;
`);


