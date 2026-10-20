import {resolve,isAbsolute} from 'node:path';
import {isIP} from 'node:net';
import {mailConfig} from './notifications.mjs';
import {mediaConfig} from '../../../packages/media/src/index.mjs';

export function runtimeConfig(env=process.env){
 const production=env.NODE_ENV==='production';
 const raw=env.PUBLIC_ORIGIN||(env.RAILWAY_PUBLIC_DOMAIN?`https://${env.RAILWAY_PUBLIC_DOMAIN}`:'');
 let publicOrigin='';
 if(raw){const url=new URL(raw);if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||!['https:','http:'].includes(url.protocol))throw new Error('PUBLIC_ORIGIN doit contenir uniquement l’origine du site.');if(production&&url.protocol!=='https:')throw new Error('PUBLIC_ORIGIN doit utiliser HTTPS en production.');publicOrigin=url.origin;}
 if(production&&!publicOrigin)throw new Error('PUBLIC_ORIGIN ou RAILWAY_PUBLIC_DOMAIN est requis en production.');
 const dataDir=env.TAI_DATA_DIR||env.RAILWAY_VOLUME_MOUNT_PATH||resolve('var/data');
 if(production&&!env.TAI_DATA_DIR&&!env.RAILWAY_VOLUME_MOUNT_PATH)throw new Error('Configurer un volume persistant et TAI_DATA_DIR avant le démarrage en production.');
 if(production&&env.RAILWAY_ENVIRONMENT_ID&&!env.RAILWAY_VOLUME_MOUNT_PATH)throw new Error('Attacher un volume Railway persistant avant le démarrage.');
 if(production&&!isAbsolute(dataDir))throw new Error('TAI_DATA_DIR doit être un chemin absolu en production.');
 if(production&&env.RAILWAY_VOLUME_MOUNT_PATH&&resolve(dataDir)!==resolve(env.RAILWAY_VOLUME_MOUNT_PATH))throw new Error('TAI_DATA_DIR doit correspondre au volume Railway monté.');
 const mail=mailConfig(env);if(mail.enabled&&!publicOrigin)throw new Error('PUBLIC_ORIGIN est requis pour les liens des e-mails.');
 const port=Number(env.PORT||4173);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT invalide.');
 return {production,publicOrigin,dataDir:resolve(dataDir),port,host:env.HOST||(production?'0.0.0.0':'127.0.0.1'),setupToken:env.ADMIN_SETUP_TOKEN||'',seedDemo:!production&&env.SEED_DEMO!=='false',trustRailwayProxy:production&&(env.TRUST_RAILWAY_PROXY==='true'||env.TRUST_PROXY==='true'),media:mediaConfig(env),mail};
}

export function requestAllowed(req,config){
 const host=String(config.trustRailwayProxy?(req.headers['x-forwarded-host']||req.headers.host):req.headers.host||'').toLowerCase();
 if(config.production){if(host!==new URL(config.publicOrigin).host)return false;return true;}
 return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

export function clientAddress(req,config){
 // Enable only behind a controlled proxy that overwrites X-Real-IP.
 const forwarded=req.headers['x-real-ip'];
 return config.trustRailwayProxy&&typeof forwarded==='string'&&isIP(forwarded)?forwarded:req.socket.remoteAddress||'unknown';
}

export function securityHeaders(res,config){
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(config.production){
  res.setHeader('Strict-Transport-Security','max-age=31536000');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
 }
}
