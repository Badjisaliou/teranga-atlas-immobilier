import {runtimeConfig} from './config.mjs';
import {existsSync,accessSync,constants} from 'node:fs';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const config=runtimeConfig();const errors=[];
if(!existsSync('dist/client/index.html'))errors.push('Compiler le frontend avec npm run build.');
if(!existsSync(config.dataDir))errors.push('Le dossier de données persistant n’est pas disponible.');else try{accessSync(config.dataDir,constants.W_OK);}catch{errors.push('Le dossier de données n’est pas accessible en écriture.');}
const path=join(config.dataDir,'teranga.sqlite');
if(existsSync(path)){const db=new DatabaseSync(path,{readOnly:true});try{if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')errors.push('La base doit être vérifiée avant déploiement.');const admin=db.prepare('SELECT 1 FROM users LIMIT 1').get();if(config.production&&!admin&&config.setupToken.length<32)errors.push('Configurer ADMIN_SETUP_TOKEN (32 caractères minimum) pour le premier compte.');}finally{db.close();}}else if(config.production&&config.setupToken.length<32)errors.push('Configurer ADMIN_SETUP_TOKEN pour le premier compte.');
if(errors.length){for(const error of errors)console.error(`- ${error}`);process.exitCode=1;}else console.log('Configuration technique vérifiée. Les contenus métier et les sauvegardes Railway restent à contrôler avant ouverture publique.');
