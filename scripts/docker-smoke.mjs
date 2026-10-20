// Optional integration probe, executed INSIDE an isolated Compose app container.
// Requires the test proxy's CA certificate at /tmp/docker-validation-ca.crt.
import assert from 'node:assert/strict';
import {request} from 'node:https';
import {readFileSync,writeFileSync} from 'node:fs';
import {createBackup,verifyBackup} from '/app/apps/api/src/backups.mjs';

const ca=readFileSync('/tmp/docker-validation-ca.crt');let cookie='';
const credentials={name:'Validation Docker',email:'docker-validation@example.test',password:'Docker-Validation-Isolated-2026-Only'};
function call(path,{method='GET',body}={}){
 return new Promise((resolve,reject)=>{
  const req=request({hostname:'proxy',port:443,servername:'localhost',ca,path,method,headers:{Host:'localhost',Origin:'https://localhost',...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})}},res=>{
   let raw='';res.on('data',b=>raw+=b);res.on('end',()=>{if(res.headers['set-cookie'])cookie=res.headers['set-cookie'][0].split(';')[0];let data;try{data=JSON.parse(raw);}catch{data=raw;}resolve({status:res.statusCode,data,headers:res.headers});});
  });req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
 });
}
assert.equal(process.getuid(),1000);
assert.throws(()=>writeFileSync('/app/docker-validation-write','test'),/EROFS|EACCES/);
assert.equal((await call('/healthz')).status,200);
assert.match((await call('/')).data,/Teranga Atlas/);
assert.equal((await call('/api/admin/properties')).status,401);
assert.equal((await call('/data/teranga.sqlite')).status,404);
const restore=process.argv.includes('--after-restart');
if(!restore){
 assert.deepEqual((await call('/api/properties')).data.properties,[]);
 const setup=await call('/api/auth/setup',{method:'POST',body:{...credentials,setupToken:process.env.ADMIN_SETUP_TOKEN}});assert.equal(setup.status,200);assert.match(setup.headers['set-cookie'][0],/Secure/);
 const bytes=readFileSync('/app/apps/web/public/assets/apartment.webp');
 const media=await call('/api/admin/media',{method:'POST',body:{data:bytes.toString('base64')}});assert.equal(media.status,201);
 const created=await call('/api/admin/properties',{method:'POST',body:{title:'Bien de validation Docker',reference:'DOCKER-001',city:'Casablanca',area:'Zone de test',type:'Appartement',transaction:'Acheter',size:90,beds:2,baths:1,price:1800000,furnished:false,status:'Publié',agent:'Agent test Docker',availability:'Disponible',description:'Données fictives sur volume Docker isolé.',image:media.data.image,gallery:[media.data.image],amenities:['Terrasse'],demo:false}});assert.equal(created.status,201);
 const sent=await call('/api/inquiries',{method:'POST',body:{propertyId:created.data.property.id,name:'Prospect Docker fictif',phone:'0600000000',email:'docker-prospect@example.test',kind:'Demander des informations',message:'Validation Docker uniquement.',consent:true}});assert.equal(sent.status,201);
 const updated=await call(`/api/admin/inquiries/${sent.data.id}`,{method:'PATCH',body:{status:'Prise en charge',agent:'Agent test Docker',notes:'Suivi conservé après redémarrage'}});assert.equal(updated.status,200);
 const backup=createBackup('/data');assert.ok(verifyBackup(backup).files>=2);
 writeFileSync('/data/docker-validation-state.json',JSON.stringify({propertyId:created.data.property.id,inquiryId:sent.data.id,image:media.data.image,backup}));
 console.log('OK : HTTPS vérifié, UID 1000, lecture seule, accès privé, création admin, photo, publication, demande, suivi et sauvegarde.');
}else{
 const state=JSON.parse(readFileSync('/data/docker-validation-state.json','utf8'));
 assert.equal((await call('/api/auth/login',{method:'POST',body:credentials})).status,200);
 const property=(await call('/api/admin/properties')).data.properties.find(p=>p.id===state.propertyId);assert.equal(property.reference,'DOCKER-001');
 const inquiry=(await call('/api/admin/inquiries')).data.inquiries.find(i=>i.id===state.inquiryId);assert.equal(inquiry.notes,'Suivi conservé après redémarrage');
 assert.equal((await call(state.image)).status,200);assert.ok(verifyBackup(state.backup).files>=2);
 console.log('OK après redémarrage : compte, bien, photo, demande, suivi et sauvegarde conservés.');
}
