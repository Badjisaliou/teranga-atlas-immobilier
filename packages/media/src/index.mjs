import {randomUUID,createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function mediaConfig(env=process.env){
 const provider=env.MEDIA_STORAGE||'local';
 if(!['local','cloudinary'].includes(provider))throw new Error('MEDIA_STORAGE doit être local ou cloudinary.');
 const cloudName=env.CLOUDINARY_CLOUD_NAME||'',apiKey=env.CLOUDINARY_API_KEY||'',apiSecret=env.CLOUDINARY_API_SECRET||'';
 if(provider==='cloudinary'&&(!/^[a-z0-9_-]+$/i.test(cloudName)||!apiKey||!apiSecret))throw new Error('Configurer les trois variables Cloudinary côté serveur.');
 return {provider,cloudName,apiKey,apiSecret};
}

export function createMediaStorage({config,dataDir,fetchImpl=fetch}){
 const media=config.media||mediaConfig();
 return {async upload(bytes,ext){
  const id=randomUUID();
  if(media.provider==='local'){
   mkdirSync(join(dataDir,'uploads'),{recursive:true});const filename=`${id}.${ext}`;
   writeFileSync(join(dataDir,'uploads',filename),bytes,{flag:'wx'});
   return {id,provider:'local',publicId:filename,url:`/media/${filename}`};
  }
  const publicId=`teranga-atlas/${id}`,timestamp=String(Math.floor(Date.now()/1000));
  const signature=createHash('sha256').update(`overwrite=false&public_id=${publicId}&timestamp=${timestamp}${media.apiSecret}`).digest('hex');
  const form=new FormData();form.set('file',new Blob([bytes],{type:`image/${ext==='jpg'?'jpeg':ext}`}),`${id}.${ext}`);
  for(const [key,value]of Object.entries({public_id:publicId,timestamp,overwrite:'false',api_key:media.apiKey,signature}))form.set(key,value);
  let response;
  try{response=await fetchImpl(`https://api.cloudinary.com/v1_1/${media.cloudName}/image/upload`,{method:'POST',body:form,signal:AbortSignal.timeout(25000)});}catch{throw Object.assign(new Error('Le stockage photo est indisponible. Réessayez.'),{status:502});}
  if(!response.ok)throw Object.assign(new Error('Le stockage photo a refusé l’import.'),{status:502});
  const asset=await response.json();
  // Keep only HTTPS delivery URLs from this account, never a supplied external URL.
  let url;try{url=new URL(asset.secure_url);}catch{throw new Error('Réponse du stockage photo invalide.');}
  if(url.protocol!=='https:'||url.hostname!=='res.cloudinary.com'||url.username||url.password||url.port||!url.pathname.startsWith(`/${media.cloudName}/image/upload/`)||asset.public_id!==publicId)throw new Error('Réponse du stockage photo invalide.');
  return {id,provider:'cloudinary',publicId,url:url.href};
 }};
}
