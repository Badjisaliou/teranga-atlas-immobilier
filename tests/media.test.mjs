import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createMediaStorage,mediaConfig} from '../packages/media/src/index.mjs';
import {openDatabase} from '../packages/database/src/index.mjs';

test('Cloudinary : configuration, upload signé et métadonnées sans exposer le secret',async()=>{
 assert.throws(()=>mediaConfig({MEDIA_STORAGE:'unknown'}));
 assert.throws(()=>mediaConfig({MEDIA_STORAGE:'cloudinary'}));
 const config={media:mediaConfig({MEDIA_STORAGE:'cloudinary',CLOUDINARY_CLOUD_NAME:'test-cloud',CLOUDINARY_API_KEY:'test-key',CLOUDINARY_API_SECRET:'test-secret'})};
 const bytes=readFileSync('apps/web/public/assets/apartment.webp');
 let called=false;
 const storage=createMediaStorage({config,fetchImpl:async(url,{body,signal})=>{
  called=true;assert.equal(url,'https://api.cloudinary.com/v1_1/test-cloud/image/upload');assert.ok(signal);
  assert.equal(body.get('api_secret'),null);assert.equal(body.get('api_key'),'test-key');assert.equal(body.get('file').size,bytes.length);
  const publicId=body.get('public_id');assert.match(publicId,/^teranga-atlas\/[a-f0-9-]{36}$/);
  assert.equal(body.get('signature'),createHash('sha256').update(`overwrite=false&public_id=${publicId}&timestamp=${body.get('timestamp')}test-secret`).digest('hex'));
  return Response.json({public_id:publicId,secure_url:`https://res.cloudinary.com/test-cloud/image/upload/v1/${publicId}.webp`});
 }});
 const asset=await storage.upload(bytes,'webp');assert.ok(called);assert.equal(asset.provider,'cloudinary');assert.equal('apiSecret' in asset,false);
 const failing=createMediaStorage({config,fetchImpl:async()=>new Response('failure',{status:401})});await assert.rejects(()=>failing.upload(bytes,'webp'),{status:502});
 const hostile=createMediaStorage({config,fetchImpl:async()=>Response.json({secure_url:'https://evil.test/image.jpg'})});await assert.rejects(()=>hostile.upload(bytes,'webp'),/invalide/);
});

test('migrations réexécutables et registre des médias persistants',()=>{
 const dir=mkdtempSync(join(tmpdir(),'teranga-migrations-'));let db=openDatabase(dir);
 db.prepare('INSERT INTO media_assets VALUES(?,?,?,?,?,?,?)').run('test','cloudinary','teranga-atlas/test','https://res.cloudinary.com/test/image/upload/test.jpg','jpg',123,new Date().toISOString());
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n,3);db.close();
 db=openDatabase(dir);try{assert.equal(db.prepare('SELECT COUNT(*) AS n FROM media_assets').get().n,1);assert.equal(db.prepare('PRAGMA quick_check').get().quick_check,'ok');}finally{db.close();}
});
