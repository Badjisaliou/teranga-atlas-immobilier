import {openDatabase} from '../../../packages/database/src/index.mjs';
import {createMediaStorage} from '../../../packages/media/src/index.mjs';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {hash,passwordHash,passwordMatches,accountRoutes} from './accounts.mjs';
import {createNotifications} from './notifications.mjs';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { seedProperties } from './seed.mjs';
import { runtimeConfig,requestAllowed,clientAddress,securityHeaders } from './config.mjs';
import {agencyDefaults} from '../../../packages/shared/src/agency.mjs';

export const propertyStatuses = ['Brouillon','Publié','Masqué','Vendu','Loué','Archivé'];
export const inquiryStatuses = ['Nouvelle','Prise en charge','Rendez-vous planifié','En attente','Conclue','Abandonnée'];
const kinds=['Demander une visite','Demander des informations','Demander une réservation','Parler à un conseiller','Échanger sur WhatsApp'];
const fault=(status,message)=>Object.assign(new Error(message),{status});
const clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
const publicProperty = row => ({...JSON.parse(row.payload),id:row.id,reference:row.reference,status:row.status,demo:!!row.demo,createdAt:row.created_at,updatedAt:row.updated_at,assignedUserId:row.assigned_user_id??null});
const assetOk = value => typeof value==='string' && (/^[a-z0-9-]+\.(webp|png|jpe?g)$/i.test(value)||/^\/media\/[a-f0-9-]{36}\.(webp|png|jpg)$/.test(value));

export function createApplication({config=runtimeConfig(),dataDir=config.dataDir,clock=()=>Date.now(),mailTransport}={}) {
 mkdirSync(dataDir,{recursive:true});mkdirSync(join(dataDir,'uploads'),{recursive:true});
 const mediaStorage=createMediaStorage({config,dataDir});
 const db=openDatabase(dataDir);
 const notifications=createNotifications({db,config,clock,transport:mailTransport});
 if(!db.prepare("SELECT 1 FROM settings WHERE key='seeded'").get()){
  db.exec('BEGIN');try{const now=new Date(clock()).toISOString();const add=db.prepare('INSERT INTO properties(id,reference,payload,status,demo,created_at,updated_at) VALUES(?,?,?,?,?,?,?)');
   for(const p of (config.seedDemo?seedProperties:[])){const reference=`TAI-${p.city==='Marrakech'?'MRK':'CAS'}-${String(p.id).padStart(3,'0')}`;add.run(p.id,reference,JSON.stringify({...p,description:`Ce ${p.type.toLowerCase()} est un bien de démonstration situé à ${p.area}, ${p.city}. Les photos sont des illustrations.`,agent:'Agence Teranga Atlas',availability:'Disponible',amenities:['Terrasse','Climatisation',...(p.type!=='Appartement'?['Piscine']:[])],gallery:p.type==='Appartement'?[p.image]:[p.image,'riad-terrace.webp','hero-riad.webp']}),'Publié',1,now,now);}
   db.prepare("INSERT INTO settings(key,value) VALUES('seeded','1')").run();db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 function agency(){const row=db.prepare("SELECT value FROM settings WHERE key='agency'").get();return {...agencyDefaults,...(row?JSON.parse(row.value):{})};}
 function readiness(){const a=agency();return [
  {label:'Coordonnées de contact renseignées',ok:!!a.email&&!!a.phone&&!!a.address},
  {label:'Présentation et services renseignés',ok:!!a.aboutText&&!!a.servicesText},
  {label:'Mentions légales renseignées',ok:!!a.legalText},
  {label:'Politique de confidentialité renseignée',ok:!!a.privacyText},
  {label:'Au moins une annonce réelle publiée',ok:db.prepare("SELECT COUNT(*) AS n FROM properties WHERE status='Publié' AND demo=0").get().n>0},
 ];}
 const limits=new Map();
 function limit(req,category,max,windowMs){const now=clock(),key=`${category}:${clientAddress(req,config)}`;for(const [k,v]of limits)if(v.until<=now)limits.delete(k);const current=limits.get(key)||{count:0,until:now+windowMs};if(current.count>=max)throw fault(429,'Trop de tentatives. Réessayez dans quelques minutes.');current.count++;limits.set(key,current);}
 function currentUser(req){const cookies=req.headers.cookie||'';const token=cookies.split(';').map(x=>x.trim()).find(x=>x.startsWith('tai_session='))?.slice(12);if(!token)return null;const session=db.prepare('SELECT u.id,u.email,u.name,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=? AND expires>? AND u.active=1').get(hash(token),clock());return session||null;}
 function requireUser(req){const user=currentUser(req);if(!user)throw fault(401,'Connectez-vous à l’administration.');return user;}
 function requireAdmin(req){const user=requireUser(req);if(user.role!=='admin')throw fault(403,'Cette action est réservée aux administrateurs.');return user;}
 function assignment(value){if(value===undefined||value===null||value==='')return null;const id=Number(value);if(!Number.isInteger(id)||!db.prepare('SELECT 1 FROM users WHERE id=? AND active=1').get(id))throw fault(400,'Choisissez un compte actif pour l’affectation.');return id;}
 function owned(req,row){const user=requireUser(req);if(!row||user.role!=='admin'&&row.assigned_user_id!==user.id)throw fault(404,'Élément introuvable.');return user;}
 async function body(req,max=100_000){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw fault(413,'Fichier ou formulaire trop volumineux.');chunks.push(chunk);}try{const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();return parsed;}catch{throw fault(400,'Données JSON invalides.');}}
 function json(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
 function session(res,user){const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<=?').run(clock());db.prepare('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)').run(hash(token),user.id,clock()+8*60*60*1000);json(res,200,{user:db.prepare('SELECT id,email,name,role FROM users WHERE id=?').get(user.id)},{'Set-Cookie':`tai_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${config.production?'; Secure':''}`});}
 function validateProperty(input){const p={title:clean(input.title,160),city:clean(input.city,80),area:clean(input.area,120),type:clean(input.type,60),transaction:clean(input.transaction,20),description:clean(input.description,10000),agent:clean(input.agent,120),availability:clean(input.availability,80),image:clean(input.image,2048),badge:clean(input.badge,40),size:Number(input.size),beds:Number(input.beds),baths:Number(input.baths),furnished:input.furnished===true,price:input.price===null||input.price===''?null:Number(input.price),amenities:Array.isArray(input.amenities)?[...new Set(input.amenities)].filter(x=>['Piscine','Terrasse','Climatisation','Jardin','Parking','Ascenseur','Balcon'].includes(x)):[],gallery:Array.isArray(input.gallery)?input.gallery.slice(0,20):[],demo:input.demo===true};
  const status=clean(input.status,30),reference=clean(input.reference,60);
  if(!p.title||!reference||!propertyStatuses.includes(status))throw fault(400,'Titre, référence et statut valide sont obligatoires.');
  if(!/^[A-Za-z0-9_-]{3,60}$/.test(reference))throw fault(400,'La référence doit contenir de 3 à 60 lettres, chiffres, tirets ou underscores.');
  if(!['Acheter','Louer'].includes(p.transaction)||!['Appartement','Riad','Villa','Maison','Terrain','Immeuble','Bureau','Résidence meublée'].includes(p.type))throw fault(400,'Type de bien ou transaction invalide.');
  for(const key of ['size','beds','baths'])if(!Number.isFinite(p[key])||p[key]<0||p[key]>1_000_000||(key!=='size'&&!Number.isInteger(p[key])))throw fault(400,'Surface et nombres de chambres/salles de bain invalides.');
  if(p.price!==null&&(!Number.isFinite(p.price)||p.price<0||p.price>1e12))throw fault(400,'Prix invalide.');
  const registered=value=>typeof value==='string'&&(assetOk(value)||!!db.prepare('SELECT 1 FROM media_assets WHERE url=?').get(value));
  if(p.image&&!registered(p.image)||p.gallery.some(x=>!registered(x)))throw fault(400,'Image non autorisée.');
  if(input.assignedUserId)p.agent=db.prepare('SELECT name FROM users WHERE id=? AND active=1').get(Number(input.assignedUserId))?.name||p.agent;
  if(['Publié','Vendu','Loué'].includes(status)&&(!p.city||!p.area||!p.description||!p.agent||!p.availability||!p.image||p.size<=0))throw fault(400,'Pour publier : ville, quartier, description, agent, disponibilité, photo et surface positive sont obligatoires.');
  const assets=[p.image,...p.gallery].filter(Boolean);for(const asset of assets){if(db.prepare('SELECT 1 FROM media_assets WHERE url=?').get(asset))continue;const path=asset.startsWith('/media/')?join(dataDir,'uploads',asset.slice(7)):resolve('apps/web/public/assets',asset);if(!existsSync(path))throw fault(400,'Une image sélectionnée est introuvable.');}
  if(!p.gallery.length&&p.image)p.gallery=[p.image];
  const assignedUserId=assignment(input.assignedUserId);if(assignedUserId)p.agent=db.prepare('SELECT name FROM users WHERE id=?').get(assignedUserId).name;
  return {p,status,reference,assignedUserId};
 }
 const accounts=accountRoutes({db,config,clock,body,json,session,requireUser,limit,notifications});
 async function handler(req,res,next){
  const path=(req.url||'').split('?')[0];if(path!=='/healthz'&&!path.startsWith('/api/')&&!path.startsWith('/media/')){next?.();return false;}
  try{
   securityHeaders(res,config);
   if(path==='/healthz'&&['GET','HEAD'].includes(req.method)){db.prepare('SELECT 1').get();json(res,200,{ok:true});return true;}
   if(!requestAllowed(req,config))throw fault(403,'Hôte non autorisé.');
   const origin=config.production?config.publicOrigin:`http://${req.headers.host}`;
   if(!['GET','HEAD'].includes(req.method)){if(req.headers.origin!==origin)throw fault(403,'Origine non autorisée.');if(!req.headers['content-type']?.startsWith('application/json'))throw fault(415,'Content-Type application/json requis.');}
   if(path.startsWith('/media/')){if(req.method!=='GET')throw fault(405,'Méthode non autorisée.');if(!assetOk(path))throw fault(404,'Image introuvable.');const file=join(dataDir,'uploads',path.slice(7));if(!existsSync(file))throw fault(404,'Image introuvable.');res.writeHead(200,{'Content-Type':path.endsWith('.png')?'image/png':path.endsWith('.jpg')?'image/jpeg':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});res.end(readFileSync(file));return true;}
   const now=()=>new Date(clock()).toISOString();
   if(await accounts(req,res,path))return true;
   if(path==='/api/settings'&&req.method==='GET'){json(res,200,{settings:agency()});return true;}
   if(path==='/api/auth/status'&&req.method==='GET'){json(res,200,{setupRequired:!db.prepare('SELECT 1 FROM users LIMIT 1').get(),setupTokenRequired:config.production,recoveryAvailable:notifications.enabled&&!!config.publicOrigin,user:currentUser(req)});return true;}
   if(path==='/api/auth/setup'&&req.method==='POST'){
    limit(req,'setup',10,15*60*1000);if(db.prepare('SELECT 1 FROM users LIMIT 1').get())throw fault(409,'Un administrateur existe déjà.');const input=await body(req);if(config.production&&(!config.setupToken||config.setupToken.length<32||typeof input.setupToken!=='string'||!timingSafeEqual(Buffer.from(hash(input.setupToken)),Buffer.from(hash(config.setupToken)))))throw fault(403,'Code de configuration invalide ou non configuré.');const email=clean(input.email,200).toLowerCase(),name=clean(input.name,100);if(!name||!/^\S+@\S+\.\S+$/.test(email)||typeof input.password!=='string'||input.password.length<12||input.password.length>200)throw fault(400,'Nom, e-mail valide et mot de passe de 12 à 200 caractères requis.');if(db.prepare('SELECT 1 FROM users LIMIT 1').get())throw fault(409,'Un administrateur existe déjà.');const result=db.prepare('INSERT INTO users(email,password,name) VALUES(?,?,?)').run(email,passwordHash(input.password),name);session(res,{id:Number(result.lastInsertRowid),name,email});return true;
   }
   if(path==='/api/auth/login'&&req.method==='POST'){limit(req,'login',10,15*60*1000);const input=await body(req);if(typeof input.password!=='string'||input.password.length>200)throw fault(400,'Identifiants invalides.');const user=db.prepare('SELECT * FROM users WHERE email=?').get(clean(input.email,200).toLowerCase());const stored=user?.password||passwordHash('not-a-real-password','00000000000000000000000000000000');if(!passwordMatches(input.password,stored)||!user||!user.active)throw fault(401,'E-mail ou mot de passe incorrect.');session(res,user);return true;}
   if(path==='/api/auth/logout'&&req.method==='POST'){requireUser(req);const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tai_session='))?.slice(12);if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));json(res,200,{ok:true},{'Set-Cookie':`tai_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${config.production?'; Secure':''}`});return true;}
   if(path==='/api/properties'&&req.method==='GET'){json(res,200,{properties:db.prepare("SELECT * FROM properties WHERE status IN ('Publié','Vendu','Loué') ORDER BY created_at DESC,id ASC").all().filter(row=>!config.production||!row.demo).map(row=>{const {agent,assignedUserId,...visible}=publicProperty(row);return visible;})});return true;}
   if(path==='/api/inquiries'&&req.method==='POST'){
    limit(req,'inquiry',20,60*60*1000);const input=await body(req);const name=clean(input.name,120),phone=clean(input.phone,40),email=clean(input.email,200),kind=clean(input.kind,60),date=clean(input.date,10),time=clean(input.time,30),message=clean(input.message,5000);if(!name||(!/^[+()0-9\s.\-]{6,40}$/.test(phone)||phone.replace(/\D/g,'').length<6)||email&&!/^\S+@\S+\.\S+$/.test(email)||!kinds.includes(kind)||input.consent!==true)throw fault(400,'Vérifiez le nom, le téléphone, l’e-mail et l’accord sur les données.');
    let property=null;if(input.propertyId!==null&&input.propertyId!==undefined){if(!Number.isInteger(input.propertyId))throw fault(400,'Bien invalide.');property=db.prepare("SELECT * FROM properties WHERE id=? AND status IN ('Publié','Vendu','Loué')").get(input.propertyId);if(!property||config.production&&property.demo)throw fault(409,'Ce bien n’est plus disponible pour une demande.');if(['Demander une visite','Demander une réservation'].includes(kind)&&property.status!=='Publié')throw fault(409,'Ce bien est vendu ou loué. Les visites et réservations sont fermées.');}
    if(['Demander une visite','Demander une réservation'].includes(kind)&&!property)throw fault(400,'Sélectionnez un bien pour cette demande.');
    if(['Demander une visite','Demander une réservation'].includes(kind)){const parsed=new Date(date+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<now().slice(0,10)||!['Matin','Après-midi','À convenir'].includes(time))throw fault(400,'Date future ou créneau invalide.');}
    const created=now(),agent=property?JSON.parse(property.payload).agent:'',assignedUserId=property?.assigned_user_id??null;
    db.exec('BEGIN');let id;try{
     const result=db.prepare("INSERT INTO inquiries(property_id,name,phone,email,kind,requested_date,time_slot,message,consent_at,status,agent,created_at,updated_at,assigned_user_id) VALUES(?,?,?,?,?,?,?,?,?,'Nouvelle',?,?,?,?)").run(property?.id??null,name,phone,email,kind,date,time,message,created,agent||'',created,created,assignedUserId);id=Number(result.lastInsertRowid);
     const reference=`DEM-${String(id).padStart(5,'0')}`,a=agency();
     const recipients=new Set([a.email,assignedUserId?db.prepare('SELECT email FROM users WHERE id=? AND active=1').get(assignedUserId)?.email:null].filter(Boolean));
     for(const to of recipients)notifications.enqueue({kind:'agency-inquiry',to,subject:`Nouvelle demande ${reference}`,text:`Une demande ${reference} (${kind}) a été enregistrée. Consultez le backoffice pour les coordonnées et le suivi. ${config.publicOrigin||''}/#/admin`});
     if(email)notifications.enqueue({kind:'prospect-receipt',to:email,subject:`Votre demande ${reference} est enregistrée`,text:`Bonjour ${name},\n${a.agencyName} a bien enregistré votre demande ${reference}. Une visite ou réservation reste soumise à la confirmation de l’agence. Aucun paiement n’est demandé.`});
     db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e;}
    json(res,201,{id,reference:`DEM-${String(id).padStart(5,'0')}`});return true;
   }
   if(path.startsWith('/api/admin/'))requireUser(req);
   if(path==='/api/admin/settings'&&req.method==='GET'){requireAdmin(req);json(res,200,{settings:agency(),checks:readiness()});return true;}
   if(path==='/api/admin/settings'&&req.method==='PUT'){
    requireAdmin(req);
    const input=await body(req);const a={};for(const key of Object.keys(agencyDefaults))a[key]=clean(input[key],['legalText','privacyText'].includes(key)?20000:['aboutText','servicesText'].includes(key)?10000:300);
    a.whatsapp=a.whatsapp.replace(/^\+/, '');
    if(!a.agencyName||a.email&&!/^\S+@\S+\.\S+$/.test(a.email)||a.phone&&!/^[+()0-9 .-]{6,40}$/.test(a.phone)||a.whatsapp&&!/^[1-9][0-9]{7,14}$/.test(a.whatsapp))throw fault(400,'Vérifiez le nom, l’e-mail, le téléphone et le numéro WhatsApp international.');
    db.prepare("INSERT INTO settings(key,value) VALUES('agency',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(JSON.stringify(a));json(res,200,{settings:a,checks:readiness()});return true;
   }
   if(path==='/api/admin/properties'&&req.method==='GET'){const user=requireUser(req);json(res,200,{properties:db.prepare('SELECT * FROM properties ORDER BY updated_at DESC,id DESC').all().filter(row=>user.role==='admin'||row.assigned_user_id===user.id).map(publicProperty)});return true;}
   if(path==='/api/admin/properties'&&req.method==='POST'){requireAdmin(req);const {p,status,reference,assignedUserId}=validateProperty(await body(req));const created=now();let result;try{result=db.prepare('INSERT INTO properties(reference,payload,status,demo,created_at,updated_at,assigned_user_id) VALUES(?,?,?,?,?,?,?)').run(reference,JSON.stringify(p),status,p.demo?1:0,created,created,assignedUserId);}catch(e){if(String(e.message).includes('UNIQUE'))throw fault(409,'Cette référence existe déjà.');throw e;}json(res,201,{property:publicProperty(db.prepare('SELECT * FROM properties WHERE id=?').get(result.lastInsertRowid))});return true;}
   const propertyMatch=path.match(/^\/api\/admin\/properties\/(\d+)$/);
   if(propertyMatch&&req.method==='PUT'){requireAdmin(req);const id=Number(propertyMatch[1]);if(!db.prepare('SELECT 1 FROM properties WHERE id=?').get(id))throw fault(404,'Bien introuvable.');const {p,status,reference,assignedUserId}=validateProperty(await body(req));try{db.prepare('UPDATE properties SET reference=?,payload=?,status=?,demo=?,updated_at=?,assigned_user_id=? WHERE id=?').run(reference,JSON.stringify(p),status,p.demo?1:0,now(),assignedUserId,id);}catch(e){if(String(e.message).includes('UNIQUE'))throw fault(409,'Cette référence existe déjà.');throw e;}json(res,200,{property:publicProperty(db.prepare('SELECT * FROM properties WHERE id=?').get(id))});return true;}
   if(path==='/api/admin/inquiries'&&req.method==='GET'){const user=requireUser(req);json(res,200,{inquiries:db.prepare('SELECT i.*,p.reference AS property_reference,p.payload AS property_payload FROM inquiries i LEFT JOIN properties p ON p.id=i.property_id ORDER BY i.created_at DESC,i.id DESC').all().filter(row=>user.role==='admin'||row.assigned_user_id===user.id).map(row=>{const {property_payload,...safe}=row;return {...safe,property_title:property_payload?JSON.parse(property_payload).title:null};})});return true;}
   const inquiryMatch=path.match(/^\/api\/admin\/inquiries\/(\d+)$/);
   if(inquiryMatch&&req.method==='PATCH'){
    const id=Number(inquiryMatch[1]),row=db.prepare('SELECT * FROM inquiries WHERE id=?').get(id),actor=owned(req,row),input=await body(req),status=clean(input.status,40);
    if(!inquiryStatuses.includes(status))throw fault(400,'Statut invalide.');
    const assignedUserId=actor.role==='admin'?assignment(input.assigned_user_id===undefined?row.assigned_user_id:input.assigned_user_id):row.assigned_user_id;
    if(actor.role!=='admin'&&input.assigned_user_id!==undefined&&input.assigned_user_id!==row.assigned_user_id)throw fault(403,'Vous ne pouvez pas réaffecter cette demande.');
    const agent=assignedUserId?db.prepare('SELECT name FROM users WHERE id=?').get(assignedUserId).name:clean(input.agent,120);
    db.prepare('UPDATE inquiries SET status=?,agent=?,notes=?,assigned_user_id=?,updated_at=? WHERE id=?').run(status,agent,clean(input.notes,10000),assignedUserId,now(),id);json(res,200,{ok:true});return true;
   }
   const statusMatch=path.match(/^\/api\/admin\/properties\/(\d+)\/status$/);
   if(statusMatch&&req.method==='PATCH'){
    const row=db.prepare('SELECT * FROM properties WHERE id=?').get(Number(statusMatch[1]));owned(req,row);const input=await body(req);
    if(!['Publié','Vendu','Loué','Masqué','Archivé'].includes(row.status)||!['Publié','Vendu','Loué','Masqué','Archivé'].includes(input.status))throw fault(400,'Le brouillon doit être publié par un administrateur.');
    const existing=JSON.parse(row.payload);const {p}=validateProperty({...existing,reference:row.reference,status:input.status,availability:clean(input.availability,80)||existing.availability});db.prepare('UPDATE properties SET status=?,payload=?,updated_at=? WHERE id=?').run(input.status,JSON.stringify(p),now(),row.id);json(res,200,{ok:true});return true;
   }
   if(path==='/api/admin/media'&&req.method==='POST'){
    requireAdmin(req);
    const input=await body(req,7_100_000);if(typeof input.data!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data))throw fault(400,'Image invalide.');const bytes=Buffer.from(input.data,'base64');if(bytes.length<12||bytes.length>5*1024*1024)throw fault(400,'Une image de 5 Mo maximum est autorisée.');let ext;if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)ext='jpg';else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp';else throw fault(400,'Formats autorisés : JPEG, PNG et WebP.');const media=await mediaStorage.upload(bytes,ext);db.prepare('INSERT INTO media_assets(id,provider,public_id,url,format,bytes,created_at) VALUES(?,?,?,?,?,?,?)').run(media.id,media.provider,media.publicId,media.url,ext,bytes.length,now());json(res,201,{image:media.url});return true;
   }
   throw fault(404,'Ressource introuvable.');
  }catch(error){if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'Une erreur interne empêche l’enregistrement.'});else res.end();return true;}
 }
 return {handler,close:()=>{notifications.close();db.close();},db,notifications};
}
