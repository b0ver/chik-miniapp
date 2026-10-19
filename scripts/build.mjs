import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'dist');
const destination=path.join(root,'docs');
// Only this generated publication directory is replaced.
await fs.rm(destination,{recursive:true,force:true});
await fs.cp(source,destination,{recursive:true});
await fs.writeFile(path.join(destination,'.nojekyll'),'');
let html=await fs.readFile(path.join(destination,'index.html'),'utf8');
for(const name of ['styles.css','config.js','telegram.js','app.js']){
  const version=createHash('sha256').update(await fs.readFile(path.join(destination,name))).digest('hex').slice(0,12);
  html=html.replaceAll('"'+name+'"','"'+name+'?v='+version+'"');
}
await fs.writeFile(path.join(destination,'index.html'),html);
console.log('GitHub Pages: docs/ prepared from dist/.');
