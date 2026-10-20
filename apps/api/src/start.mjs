import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createApplication } from './app.mjs';
import { runtimeConfig,securityHeaders,requestAllowed } from './config.mjs';
const config=runtimeConfig();
const root=resolve('dist/client');
if(!existsSync(resolve(root,'index.html')))throw new Error('Lancez npm run build avant npm start.');
const app=createApplication({config});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 securityHeaders(res,config);
 if(await app.handler(req,res))return;
 if(!requestAllowed(req,config)){res.writeHead(403);res.end('Hôte non autorisé');return;}
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403);res.end();return;}
  const file=path===root?resolve(root,'index.html'):path;
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('Introuvable');return;}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});
  res.end(req.method==='HEAD'?undefined:readFileSync(file));
 }catch{res.writeHead(400);res.end('Requête invalide');}
});
server.requestTimeout=30_000;server.headersTimeout=15_000;
server.listen(config.port,config.host,()=>console.log(`Teranga Atlas démarré sur le port ${server.address().port}`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Ce port est déjà utilisé. Arrêtez le serveur de développement ou choisissez PORT.':'Le serveur n’a pas pu démarrer.');app.close();process.exitCode=1;});
let closing=false;function close(){if(closing)return;closing=true;server.close(()=>{app.close();process.exit(0);});server.closeIdleConnections();setTimeout(()=>{server.closeAllConnections();},10000).unref();}
process.on('SIGINT',close);process.on('SIGTERM',close);
