import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const migrations=fileURLToPath(new URL('../migrations/',import.meta.url));

export function openDatabase(dataDir){
 mkdirSync(dataDir,{recursive:true});
 const db=new DatabaseSync(join(dataDir,'teranga.sqlite'));
 try{
  db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);');
  for(const version of readdirSync(migrations).filter(x=>/^\d+_[a-z_]+\.sql$/.test(x)).sort()){
   if(db.prepare('SELECT 1 FROM schema_migrations WHERE version=?').get(version))continue;
   db.exec('BEGIN IMMEDIATE');
   try{db.exec(readFileSync(join(migrations,version),'utf8'));db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(version,new Date().toISOString());db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  }
  return db;
 }catch(error){db.close();throw error;}
}
