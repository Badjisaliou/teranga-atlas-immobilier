import {verifyBackup} from './backups.mjs';
if(!process.argv[2])throw new Error('Indiquer le dossier de sauvegarde à vérifier.');
console.log('Sauvegarde vérifiée :',verifyBackup(process.argv[2]));
