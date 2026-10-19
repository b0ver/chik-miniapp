import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'dist');
const destination=path.join(root,'docs');
// Only this generated publication directory is replaced.
await fs.rm(destination,{recursive:true,force:true});
await fs.cp(source,destination,{recursive:true});
await fs.writeFile(path.join(destination,'.nojekyll'),'');
console.log('GitHub Pages: docs/ prepared from dist/.');
