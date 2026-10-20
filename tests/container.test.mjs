import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer,request} from 'node:http';
import {mkdtempSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';

test('point d’entrée conteneur : prérequis, démarrage production, fichiers et contrôle de santé',async()=>{
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const env={...process.env,NODE_ENV:'production',HOST:'127.0.0.1',PORT:String(port),TAI_DATA_DIR:mkdtempSync(join(tmpdir(),'teranga-container-')),PUBLIC_ORIGIN:'https://docker.example.test',ADMIN_SETUP_TOKEN:'container-test-'.repeat(4),MEDIA_STORAGE:'local',TRUST_PROXY:'true',RAILWAY_ENVIRONMENT_ID:'',RAILWAY_VOLUME_MOUNT_PATH:''};
 const child=spawn(process.execPath,['apps/api/src/container.mjs'],{env,stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',b=>{logs+=b;});child.stderr.on('data',b=>{logs+=b;});
 function get(path,host='docker.example.test'){return new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path,headers:{Host:host}},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode,body}));});req.on('error',reject);req.end();});}
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await get('/healthz','healthcheck')).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,50));}
  assert.ok(ready,logs);assert.equal((await get('/')).status,200);assert.equal((await get('/var/data/teranga.sqlite')).status,404);
  assert.deepEqual(JSON.parse((await get('/api/properties')).body).properties,[]);
  const probe=spawn(process.execPath,['apps/api/src/healthcheck.mjs'],{env,stdio:'ignore'});assert.equal((await once(probe,'exit'))[0],0);
 }finally{child.kill();await once(child,'exit');}
 const invalid=spawn(process.execPath,['apps/api/src/container.mjs'],{env:{...env,ADMIN_SETUP_TOKEN:''},stdio:'ignore'});assert.equal((await once(invalid,'exit'))[0],1,'une base sans compte nécessite un code initial');
});
