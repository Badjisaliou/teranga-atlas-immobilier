import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,readdirSync,copyFileSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const allowed=/^(teranga\.sqlite|uploads\/[a-f0-9-]{36}\.(png|jpg|webp))$/;

export function createBackup(dataDir){
 dataDir=resolve(dataDir);const source=join(dataDir,'teranga.sqlite');if(!existsSync(source))throw new Error('Aucune base à sauvegarder.');
 const name=`teranga-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomBytes(3).toString('hex')}`;
 const target=join(dataDir,'backups',name);mkdirSync(join(target,'uploads'),{recursive:true,mode:0o700});
 const db=new DatabaseSync(source);try{db.prepare('VACUUM INTO ?').run(join(target,'teranga.sqlite'));}finally{db.close();}
 // Uploads are immutable UUID files; the application never deletes them while backing up.
 const files=['teranga.sqlite'];
 if(existsSync(join(dataDir,'uploads')))for(const item of readdirSync(join(dataDir,'uploads'),{withFileTypes:true})){
  if(!item.isFile()||!allowed.test(`uploads/${item.name}`))throw new Error('Fichier inattendu dans uploads : sauvegarde non validée.');
  copyFileSync(join(dataDir,'uploads',item.name),join(target,'uploads',item.name));files.push(`uploads/${item.name}`);
 }
 const manifest={version:1,createdAt:new Date().toISOString(),files:files.map(file=>({path:file,bytes:statSync(join(target,file)).size,sha256:digest(join(target,file))}))};
 writeFileSync(join(target,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
 verifyBackup(target);return target;
}

export function verifyBackup(folder){
 const manifest=JSON.parse(readFileSync(join(folder,'manifest.json'),'utf8'));
 if(manifest.version!==1||!Array.isArray(manifest.files)||!manifest.files.some(f=>f.path==='teranga.sqlite'))throw new Error('Manifeste de sauvegarde invalide.');
 for(const file of manifest.files){if(!allowed.test(file.path)||!existsSync(join(folder,file.path))||statSync(join(folder,file.path)).size!==file.bytes||digest(join(folder,file.path))!==file.sha256)throw new Error('Une partie de la sauvegarde est absente ou altérée.');}
 const db=new DatabaseSync(join(folder,'teranga.sqlite'),{readOnly:true});try{if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw new Error('Intégrité SQLite invalide.');}finally{db.close();}
 return {files:manifest.files.length,createdAt:manifest.createdAt};
}
