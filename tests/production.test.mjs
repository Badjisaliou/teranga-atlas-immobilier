import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {runtimeConfig} from '../apps/api/src/config.mjs';
import {createApplication} from '../apps/api/src/app.mjs';
import {createBackup,verifyBackup} from '../apps/api/src/backups.mjs';
import {DatabaseSync} from 'node:sqlite';

test('production : configuration obligatoire, installation protégée, cookies et paramètres persistants',async()=>{
 assert.throws(()=>runtimeConfig({NODE_ENV:'production'}));
 assert.throws(()=>runtimeConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'http://example.test',TAI_DATA_DIR:tmpdir()}));
 const dataDir=mkdtempSync(join(tmpdir(),'teranga-production-'));
 const config=runtimeConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://example.test',TAI_DATA_DIR:dataDir,TRUST_RAILWAY_PROXY:'true',ADMIN_SETUP_TOKEN:'a'.repeat(40)});
 let app=createApplication({config});
 const server=createServer((req,res)=>void app.handler(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
 async function request(path,body,host='example.test'){
  const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'X-Forwarded-Host':host,Origin:config.publicOrigin,...(body?{'Content-Type':'application/json'}:{}),Cookie:cookie},body:body?JSON.stringify(body):undefined});return r;
 }
 try{
  assert.equal((await request('/healthz',undefined,'healthcheck.railway.app')).status,200);
  assert.equal((await request('/api/properties',undefined,'evil.test')).status,403);
  assert.deepEqual((await (await request('/api/properties')).json()).properties,[]);
  const credentials={name:'Test',email:'test@example.test',password:'Production-Test-2026-Long'};
  assert.equal((await request('/api/auth/setup',credentials)).status,403);
  const setup=await request('/api/auth/setup',{...credentials,setupToken:config.setupToken});assert.equal(setup.status,200);assert.match(setup.headers.get('set-cookie'),/Secure/);cookie=setup.headers.get('set-cookie').split(';')[0];
  const response=await fetch(base+'/api/admin/settings',{method:'PUT',headers:{'X-Forwarded-Host':'example.test',Origin:config.publicOrigin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({agencyName:'Agence test',email:'contact@example.test',phone:'+212600000000',whatsapp:'212600000000',address:'Adresse test',aboutText:'Présentation',servicesText:'Services',legalText:'Mentions test',privacyText:'Confidentialité test'})});assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 }finally{await new Promise(r=>server.close(r));app.close();}
 app=createApplication({config});try{assert.match(app.db.prepare("SELECT value FROM settings WHERE key='agency'").get().value,/Agence test/);}finally{app.close();}
});

test('sauvegarde cohérente avec photos, restauration et détection des altérations',()=>{
 const dir=mkdtempSync(join(tmpdir(),'teranga-backup-'));const app=createApplication({dataDir:dir});
 app.db.prepare("INSERT INTO settings(key,value) VALUES('backup-test','conservé')").run();
 mkdirSync(join(dir,'uploads'),{recursive:true});const name='12345678-1234-1234-1234-123456789abc.webp';copyFileSync('apps/web/public/assets/apartment.webp',join(dir,'uploads',name));
 let backup;try{backup=createBackup(dir);}finally{app.close();}
 assert.equal(verifyBackup(backup).files,2);
 const restored=new DatabaseSync(join(backup,'teranga.sqlite'),{readOnly:true});try{assert.equal(restored.prepare("SELECT value FROM settings WHERE key='backup-test'").get().value,'conservé');}finally{restored.close();}
 writeFileSync(join(backup,'uploads',name),'altéré');assert.throws(()=>verifyBackup(backup),/altérée/);
});
