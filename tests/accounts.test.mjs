import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApplication} from '../apps/api/src/app.mjs';
import {runtimeConfig} from '../apps/api/src/config.mjs';
import {hash} from '../apps/api/src/accounts.mjs';

const credentials={name:'Administrateur test',email:'admin@example.test',password:'Test-Account-Administrator-2026'};
const person={name:'Agent Test',email:'agent@example.test',password:'Test-Account-Agent-2026',role:'agent'};
const property={title:'Bien test',reference:'ROLE-001',city:'Casablanca',area:'Zone test',type:'Appartement',transaction:'Acheter',size:90,beds:2,baths:1,price:1000000,status:'Publié',agent:'Agent Test',availability:'Disponible',description:'Annonce de test des permissions.',image:'apartment.webp',gallery:['apartment.webp'],demo:false};
const inquiry={name:'Prospect fictif',phone:'0600000000',email:'prospect@example.test',kind:'Demander des informations',message:'Test',consent:true};
async function fixture({mail=true}={}){
 let time=Date.now(),fail=false;const messages=[];
 const config=runtimeConfig({PUBLIC_ORIGIN:'http://localhost:4180',SEED_DEMO:'false'});
 const app=createApplication({config,dataDir:mkdtempSync(join(tmpdir(),'teranga-accounts-')),clock:()=>time,mailTransport:mail?{sendMail:async message=>{if(fail)throw new Error('SMTP unavailable secret-not-for-logs');messages.push(message);return {accepted:[message.to],rejected:[]};}}:undefined});
 const server=createServer((req,res)=>void app.handler(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 function client(){let cookie='';return async(path,body,method=body?'POST':'GET')=>{const r=await fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:base}:{})},body:body?JSON.stringify(body):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {status:r.status,data:await r.json()};};}
 const admin=client();await admin('/api/auth/setup',credentials);
 return {app,admin,client,messages,setFail:value=>fail=value,advance:ms=>time+=ms,close:async()=>{await new Promise(r=>server.close(r));app.close();}};
}

test('rôles, affectations nominatives, accès interdits et désactivation des sessions',async()=>{
 const f=await fixture();try{
  const created=await f.admin('/api/admin/users',person);assert.equal(created.status,201);const agentId=created.data.user.id;
  assert.equal('password' in created.data.user,false);
  assert.equal((await f.admin('/api/admin/users',person)).status,409);
  const owned=(await f.admin('/api/admin/properties',{...property,assignedUserId:agentId})).data.property;
  const other=(await f.admin('/api/admin/properties',{...property,reference:'ROLE-002'})).data.property;
  const general=(await f.client()('/api/inquiries',inquiry)).data;
  const demand=(await f.client()('/api/inquiries',{...inquiry,propertyId:owned.id})).data;
  const foreign=(await f.client()('/api/inquiries',{...inquiry,propertyId:other.id})).data;
  const agent=f.client();assert.equal((await agent('/api/auth/login',person)).data.user.role,'agent');
  const list=await agent('/api/admin/properties');assert.deepEqual(list.data.properties.map(p=>p.id),[owned.id],'un ancien libellé identique ne donne aucun droit');
  assert.deepEqual((await agent('/api/admin/inquiries')).data.inquiries.map(i=>i.id),[demand.id]);
  const incomplete=await f.admin('/api/admin/properties',{...property,reference:'ROLE-INCOMPLETE',description:'',status:'Masqué',assignedUserId:agentId});assert.equal(incomplete.status,201);
  assert.equal((await agent(`/api/admin/properties/${incomplete.data.property.id}/status`,{status:'Publié'},'PATCH')).status,400,'un changement de statut ne contourne pas les obligations de publication');
  for(const path of ['/api/admin/users','/api/admin/settings','/api/admin/notifications'])assert.equal((await agent(path)).status,403);
  assert.equal((await agent('/api/admin/properties',property)).status,403);
  assert.equal((await agent(`/api/admin/properties/${owned.id}`,property,'PUT')).status,403);
  assert.equal((await agent('/api/admin/media',{data:'AAAA'})).status,403);
  assert.equal((await agent(`/api/admin/properties/${other.id}/status`,{status:'Vendu'},'PATCH')).status,404);
  assert.equal((await agent(`/api/admin/properties/${owned.id}/status`,{status:'Vendu',availability:'Vendu'},'PATCH')).status,200);
  assert.equal((await agent(`/api/admin/inquiries/${foreign.id}`,{status:'Prise en charge'},'PATCH')).status,404);
  assert.equal((await agent(`/api/admin/inquiries/${general.id}`,{status:'Prise en charge'},'PATCH')).status,404);
  assert.equal((await agent(`/api/admin/inquiries/${demand.id}`,{status:'Prise en charge',notes:'Traitement agent',assigned_user_id:1},'PATCH')).status,403);
  assert.equal((await agent(`/api/admin/inquiries/${demand.id}`,{status:'Prise en charge',notes:'Traitement agent',assigned_user_id:agentId},'PATCH')).status,200);
  const visible=(await f.client()('/api/properties')).data.properties.find(p=>p.id===owned.id);assert.equal('assignedUserId' in visible,false);assert.equal('agent' in visible,false);
  assert.equal((await f.admin('/api/admin/users/1',{role:'agent',active:true},'PATCH')).status,400);
  assert.equal((await f.admin(`/api/admin/users/${agentId}`,{role:'agent',active:false},'PATCH')).status,200);
  assert.equal((await agent('/api/admin/inquiries')).status,401);
  assert.equal((await agent('/api/auth/login',person)).status,401);
 }finally{await f.close();}
});

test('changement de mot de passe : vérification, invalidation des anciennes sessions et connexion',async()=>{
 const f=await fixture();try{
  const second=f.client();await second('/api/auth/login',credentials);
  assert.equal((await f.admin('/api/auth/password',{currentPassword:'incorrect',password:'New-Account-Password-2026'})).status,400);
  assert.equal((await f.admin('/api/auth/password',{currentPassword:credentials.password,password:'court'})).status,400);
  assert.equal((await f.admin('/api/auth/password',{currentPassword:credentials.password,password:'New-Account-Password-2026'})).status,200);
  assert.equal((await second('/api/admin/users')).status,401);assert.equal((await f.admin('/api/admin/users')).status,200);
  assert.equal((await f.client()('/api/auth/login',credentials)).status,401);
  assert.equal((await f.client()('/api/auth/login',{...credentials,password:'New-Account-Password-2026'})).status,200);
 }finally{await f.close();}
});

test('récupération : réponse générique, jeton expirant à usage unique, sessions révoquées',async()=>{
 const f=await fixture();try{
  const anonymous=f.client();const known=await anonymous('/api/auth/forgot-password',{email:credentials.email});const absent=await anonymous('/api/auth/forgot-password',{email:'absent@example.test'});assert.deepEqual(known,absent);
  await f.app.notifications.flush();let message=f.messages.find(m=>m.subject.includes('Réinitialiser'));assert.ok(message);
  const token=message.text.match(/reset=([a-f0-9]{64})/)[1];assert.equal(f.app.db.prepare('SELECT token FROM password_resets').get().token,hash(token));
  const dashboard=await f.admin('/api/admin/notifications');assert.equal(JSON.stringify(dashboard.data).includes(token),false);
  assert.equal((await anonymous('/api/auth/reset-password',{token,password:'Reset-Account-Password-2026'})).status,200);
  assert.equal((await anonymous('/api/auth/reset-password',{token,password:'Other-Account-Password-2026'})).status,400);
  assert.equal((await f.admin('/api/admin/users')).status,401);
  await anonymous('/api/auth/forgot-password',{email:credentials.email});await f.app.notifications.flush();message=f.messages.at(-1);const expired=message.text.match(/reset=([a-f0-9]{64})/)[1];f.advance(31*60000);
  assert.equal((await anonymous('/api/auth/reset-password',{token:expired,password:'Another-Account-Password-2026'})).status,400);
  const sentBefore=f.messages.length;await anonymous('/api/auth/forgot-password',{email:credentials.email});f.advance(31*60000);await f.app.notifications.flush();assert.equal(f.messages.length,sentBefore,'un lien expiré dans la file ne doit pas être envoyé');
 }finally{await f.close();}
});

test('notifications durables : échec SMTP sans perte de demande, reprise et mode non configuré',async()=>{
 const f=await fixture();try{
  await f.admin('/api/admin/settings',{agencyName:'Agence test',email:'agence@example.test'},'PUT');f.setFail(true);
  const result=await f.client()('/api/inquiries',inquiry);assert.equal(result.status,201);assert.equal(f.app.db.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,1);
  await f.app.notifications.flush();let jobs=(await f.admin('/api/admin/notifications')).data.notifications;assert.equal(jobs.length,2);assert.ok(jobs.every(j=>j.status==='pending'&&j.attempts===1));assert.equal(JSON.stringify(jobs).includes('secret-not-for-logs'),false);
  f.setFail(false);f.advance(61000);await f.app.notifications.flush();jobs=(await f.admin('/api/admin/notifications')).data.notifications;assert.ok(jobs.every(j=>j.status==='sent'));assert.equal(f.messages.length,2);
 }finally{await f.close();}
 const off=await fixture({mail:false});try{assert.equal((await off.client()('/api/auth/status')).data.recoveryAvailable,false);assert.equal((await off.client()('/api/auth/forgot-password',{email:credentials.email})).status,200);assert.equal(off.app.db.prepare('SELECT COUNT(*) AS n FROM password_resets').get().n,0);}finally{await off.close();}
});

test('file SMTP conservée après redémarrage et limites des tentatives',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'teranga-mail-restart-')),config=runtimeConfig({SEED_DEMO:'false'});let time=Date.now();
 let app=createApplication({config,dataDir:dir,clock:()=>time,mailTransport:{sendMail:async()=>{throw new Error('Panne simulée');}}});
 app.notifications.enqueue({kind:'prospect-receipt',to:'test@example.test',subject:'Reprise',text:'Test sans envoi réel'});
 await app.notifications.flush();assert.equal(app.db.prepare('SELECT attempts FROM notifications').get().attempts,1);app.close();time+=61000;
 const messages=[];app=createApplication({config,dataDir:dir,clock:()=>time,mailTransport:{sendMail:async m=>{messages.push(m);return {rejected:[]};}}});
 try{await new Promise(r=>setImmediate(r));await app.notifications.flush();assert.equal(app.db.prepare('SELECT status FROM notifications').get().status,'sent');assert.equal(messages.length,1);}finally{app.close();}
 const f=await fixture();try{
  f.setFail(true);await f.client()('/api/inquiries',inquiry);
  for(let i=0;i<5;i++){await f.app.notifications.flush();f.advance(61000*2**i);}
  const jobs=(await f.admin('/api/admin/notifications')).data.notifications;assert.ok(jobs.every(j=>j.status==='failed'&&j.attempts===5));
  assert.equal((await f.admin(`/api/admin/notifications/${jobs[0].id}/retry`,{})).status,200);f.setFail(false);await f.app.notifications.flush();assert.equal(f.messages.length,1);
 }finally{await f.close();}
});
