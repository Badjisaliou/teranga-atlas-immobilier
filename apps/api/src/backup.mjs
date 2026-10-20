import {resolve} from 'node:path';
import {createBackup} from './backups.mjs';
const dir=process.env.TAI_DATA_DIR||process.env.RAILWAY_VOLUME_MOUNT_PATH||resolve('var/data');
console.log(`Sauvegarde complète vérifiée : ${createBackup(dir)}`);
