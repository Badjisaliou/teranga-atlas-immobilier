import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createApplication} from '../apps/api/src/app.mjs';

async function fixture(dataDir=mkdtempSync(join(tmpdir(),'teranga-api-')),clock){
 const app=createApplication({dataDir,clock});const server=createServer((req,res)=>{void app.handler(req,res);});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
 async function request(path,{method='GET',body,origin=base,authenticated=true}={}){const response=await fetch(base+path,{method,headers:{...(authenticated&&cookie?{Cookie:cookie}:{}),...(body!==undefined?{'Content-Type':'application/json',Origin:origin}:{})},body:body!==undefined?JSON.stringify(body):undefined});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,data:await response.json()};}
 return {app,request,dataDir,close:async()=>{await new Promise(resolve=>server.close(resolve));app.close();}};
}
const password='Test-'+randomBytes(20).toString('hex');
const credentials={name:'Test administrateur',email:'admin@example.test',password};
const property={title:'Appartement test',reference:'TEST-001',city:'Casablanca',area:'Test',type:'Appartement',transaction:'Acheter',size:90,beds:2,baths:1,price:1800000,furnished:false,status:'Publié',agent:'Agent Test',availability:'Disponible',description:'Bien utilisé uniquement dans les tests automatiques.',image:'apartment.webp',gallery:['apartment.webp'],demo:true};
const inquiry={name:'Prospect test',phone:'0600000000',email:'prospect@example.test',kind:'Demander des informations',message:'Demande de test',consent:true};

test('authentification, origine et contrôle des données privées',async()=>{
 let time=Date.now();const f=await fixture(undefined,()=>time);try{
  assert.equal((await f.request('/api/admin/inquiries')).status,401);
  assert.equal((await f.request('/api/auth/setup',{method:'POST',body:null})).status,400);
  assert.equal((await f.request('/api/auth/status')).data.setupRequired,true);
  assert.equal((await f.request('/api/auth/setup',{method:'POST',body:credentials,origin:'https://example.test'})).status,403);
  assert.equal((await f.request('/api/auth/setup',{method:'POST',body:{...credentials,password:'court'}})).status,400);
  assert.equal((await f.request('/api/auth/setup',{method:'POST',body:credentials})).status,200);
  assert.equal((await f.request('/api/auth/setup',{method:'POST',body:credentials})).status,409);
  const user=f.app.db.prepare('SELECT password FROM users').get();assert.notEqual(user.password,password);assert.match(user.password,/^[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.equal((await f.request('/api/admin/properties')).status,200);
  time+=9*60*60*1000;assert.equal((await f.request('/api/admin/properties')).status,401);
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:{email:credentials.email,password:'incorrect'}})).status,401);
  assert.equal((await f.request('/api/auth/login',{method:'POST',body:credentials})).status,200);
  assert.equal((await f.request('/api/auth/logout',{method:'POST',body:{}})).status,200);
  assert.equal((await f.request('/api/admin/inquiries')).status,401);
 }finally{await f.close();}
});

test('cycle réel bien → demande → suivi, masquage et persistance après réouverture SQLite',async()=>{
 let f=await fixture();let id,demandId;const dir=f.dataDir;try{
  await f.request('/api/auth/setup',{method:'POST',body:credentials});
  assert.equal((await f.request('/api/admin/properties',{method:'POST',body:{...property,description:''}})).status,400);
  const created=await f.request('/api/admin/properties',{method:'POST',body:property});assert.equal(created.status,201);id=created.data.property.id;
  assert.equal((await f.request('/api/admin/properties',{method:'POST',body:property})).status,409);
  assert.equal((await f.request('/api/properties',{authenticated:false})).data.properties.some(x=>x.id===id),true);
  assert.equal('agent' in (await f.request('/api/properties')).data.properties[0],false,'les noms internes ne sont pas exposés par le catalogue public');
  const sent=await f.request('/api/inquiries',{method:'POST',authenticated:false,body:{...inquiry,propertyId:id}});assert.equal(sent.status,201);demandId=sent.data.id;assert.match(sent.data.reference,/^DEM-\d{5}$/);
  const demands=(await f.request('/api/admin/inquiries')).data.inquiries;assert.equal(demands[0].property_reference,property.reference);assert.equal(demands[0].agent,'Agent Test');
  assert.equal((await f.request(`/api/admin/inquiries/${demandId}`,{method:'PATCH',body:{status:'Prise en charge',agent:'Agent Deux',notes:'Appeler demain'}})).status,200);
  assert.equal((await f.request(`/api/admin/properties/${id}`,{method:'PUT',body:{...property,status:'Masqué'}})).status,200);
  assert.equal((await f.request('/api/properties')).data.properties.some(x=>x.id===id),false);
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,propertyId:id}})).status,409);
 }finally{await f.close();}
 f=await fixture(dir);try{
  await f.request('/api/auth/login',{method:'POST',body:credentials});
  const saved=(await f.request('/api/admin/properties')).data.properties.find(p=>p.id===id);assert.equal(saved.status,'Masqué');
  const savedDemand=(await f.request('/api/admin/inquiries')).data.inquiries.find(q=>q.id===demandId);assert.equal(savedDemand.notes,'Appeler demain');assert.equal(savedDemand.agent,'Agent Deux');assert.equal(savedDemand.status,'Prise en charge');
  assert.equal((await f.request('/api/properties')).data.properties.length,9,'les annonces masquées ne sont pas réinjectées par le seed');
 }finally{await f.close();}
});

test('validation serveur des demandes et photos',async()=>{
 const f=await fixture();try{
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,consent:false}})).status,400);
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,phone:'abc'}})).status,400);
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,phone:'abc123456'}})).status,400);
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,kind:'Demander une visite',date:'2020-01-01',time:'Matin',propertyId:1}})).status,400);
  assert.equal((await f.request('/api/inquiries',{method:'POST',body:{...inquiry,propertyId:99999}})).status,409);
  assert.equal((await f.request('/api/admin/media',{method:'POST',body:{data:''}})).status,401);
  await f.request('/api/auth/setup',{method:'POST',body:credentials});
  assert.equal((await f.request('/api/admin/media',{method:'POST',body:{data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')}})).status,400);
  const bytes=readFileSync('apps/web/public/assets/apartment.webp');const uploaded=await f.request('/api/admin/media',{method:'POST',body:{data:bytes.toString('base64')}});assert.equal(uploaded.status,201);assert.match(uploaded.data.image,/^\/media\/[a-f0-9-]+\.webp$/);
  const created=await f.request('/api/admin/properties',{method:'POST',body:{...property,image:uploaded.data.image,gallery:[uploaded.data.image]}});assert.equal(created.status,201);
  assert.equal((await f.request('/api/admin/properties',{method:'POST',body:{...property,reference:'BAD-IMAGE',image:'/media/../../secrets'}})).status,400);
  const cloudUrl='https://res.cloudinary.com/test-cloud/image/upload/v1/teranga-atlas/test.webp';
  assert.equal((await f.request('/api/admin/properties',{method:'POST',body:{...property,reference:'CLOUD-TEST',image:cloudUrl,gallery:[cloudUrl]}})).status,400,'une URL distante non enregistrée est refusée');
  f.app.db.prepare('INSERT INTO media_assets VALUES(?,?,?,?,?,?,?)').run('cloud-test','cloudinary','teranga-atlas/test',cloudUrl,'webp',123,new Date().toISOString());
  const cloudProperty=await f.request('/api/admin/properties',{method:'POST',body:{...property,reference:'CLOUD-TEST',image:cloudUrl,gallery:[cloudUrl],demo:false}});assert.equal(cloudProperty.status,201);assert.equal(cloudProperty.data.property.image,cloudUrl);
 }finally{await f.close();}
});
