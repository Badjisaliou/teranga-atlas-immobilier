import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
const error=(status,message)=>Object.assign(new Error(message),{status});
export const hash=value=>createHash('sha256').update(value).digest('hex');
export function passwordHash(password,salt=randomBytes(16).toString('hex')){return `${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function passwordMatches(password,stored){const [salt,digest]=stored.split(':');return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(digest,'hex'));}
const validPassword=value=>typeof value==='string'&&value.length>=12&&value.length<=200;
export function accountRoutes({db,config,clock,body,json,session,requireUser,limit,notifications}){
 function invalidateResets(id){db.prepare('DELETE FROM password_resets WHERE user_id=?').run(id);db.prepare("UPDATE notifications SET status='expired',text='' WHERE kind='password-reset' AND status IN ('pending','failed') AND recipient=(SELECT email FROM users WHERE id=?)").run(id);}
 function admin(req){const user=requireUser(req);if(user.role!=='admin')throw error(403,'Cette action est réservée aux administrateurs.');return user;}
 return async(req,res,path)=>{
  if(path==='/api/auth/password'&&req.method==='POST'){
   limit(req,'password-change',10,900000);const user=requireUser(req),input=await body(req),stored=db.prepare('SELECT password FROM users WHERE id=?').get(user.id);
   if(typeof input.currentPassword!=='string'||input.currentPassword.length>200||!passwordMatches(input.currentPassword,stored.password))throw error(400,'Le mot de passe actuel est incorrect.');
   if(!validPassword(input.password))throw error(400,'Le nouveau mot de passe doit contenir entre 12 et 200 caractères.');
   db.exec('BEGIN');try{db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash(input.password),user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);invalidateResets(user.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
   session(res,user);return true;
  }
  if(path==='/api/auth/forgot-password'&&req.method==='POST'){
   limit(req,'password-reset-request',5,900000);const input=await body(req),email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
   // Same response for absent/disabled users and unavailable mail: no account enumeration.
   if(notifications.enabled&&config.publicOrigin&&/^\S+@\S+\.\S+$/.test(email)){
    const user=db.prepare('SELECT id,email FROM users WHERE email=? AND active=1').get(email);
    if(user){const token=randomBytes(32).toString('hex'),expires=clock()+30*60000;db.exec('BEGIN');try{invalidateResets(user.id);db.prepare('DELETE FROM password_resets WHERE expires<=?').run(clock());db.prepare('INSERT INTO password_resets VALUES(?,?,?)').run(hash(token),user.id,expires);notifications.enqueue({kind:'password-reset',to:user.email,subject:'Réinitialiser votre accès Teranga Atlas',text:`Pour choisir un nouveau mot de passe, ouvrez ce lien dans les 30 minutes :\n${config.publicOrigin}/#/admin?reset=${token}\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,expires});db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
   }
   json(res,200,{message:'Si un compte actif correspond à cette adresse et que l’envoi est configuré, un lien sera envoyé.'});return true;
  }
  if(path==='/api/auth/reset-password'&&req.method==='POST'){
   limit(req,'password-reset',10,900000);const input=await body(req);
   if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token)||!validPassword(input.password))throw error(400,'Lien invalide ou mot de passe trop court.');
   const reset=db.prepare('SELECT r.user_id FROM password_resets r JOIN users u ON u.id=r.user_id WHERE r.token=? AND r.expires>? AND u.active=1').get(hash(input.token),clock());
   if(!reset)throw error(400,'Ce lien est invalide ou a expiré.');
   db.exec('BEGIN');try{db.prepare('UPDATE users SET password=? WHERE id=?').run(passwordHash(input.password),reset.user_id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);invalidateResets(reset.user_id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
   json(res,200,{message:'Votre mot de passe est modifié. Vous pouvez vous connecter.'});return true;
  }
  if(path==='/api/admin/agents'&&req.method==='GET'){requireUser(req);json(res,200,{agents:db.prepare('SELECT id,name FROM users WHERE active=1 ORDER BY name,id').all()});return true;}
  if(path==='/api/admin/users'&&req.method==='GET'){admin(req);json(res,200,{users:db.prepare('SELECT id,email,name,role,active FROM users ORDER BY id').all()});return true;}
  if(path==='/api/admin/users'&&req.method==='POST'){
   admin(req);const input=await body(req),name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase();
   if(!name||name.length>100||email.length>200||!/^\S+@\S+\.\S+$/.test(email)||!['admin','agent'].includes(input.role)||!validPassword(input.password))throw error(400,'Nom, e-mail, rôle et mot de passe de 12 à 200 caractères requis.');
   let result;try{result=db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run(name,email,passwordHash(input.password),input.role);}catch(e){if(String(e.message).includes('UNIQUE'))throw error(409,'Cette adresse est déjà utilisée.');throw e;}
   json(res,201,{user:db.prepare('SELECT id,email,name,role,active FROM users WHERE id=?').get(result.lastInsertRowid)});return true;
  }
  const match=path.match(/^\/api\/admin\/users\/(\d+)$/);
  if(match&&req.method==='PATCH'){
   const actor=admin(req),id=Number(match[1]),input=await body(req),user=db.prepare('SELECT id,role,active FROM users WHERE id=?').get(id);
   if(!user)throw error(404,'Compte introuvable.');
   if(!['admin','agent'].includes(input.role)||typeof input.active!=='boolean')throw error(400,'Rôle ou état invalide.');
   if(id===actor.id&&(!input.active||input.role!=='admin'))throw error(400,'Vous ne pouvez pas retirer vos propres droits administrateur.');
   if(user.role==='admin'&&user.active&&(!input.active||input.role!=='admin')&&db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").get().n<=1)throw error(400,'Conservez au moins un administrateur actif.');
   db.exec('BEGIN');try{db.prepare('UPDATE users SET role=?,active=? WHERE id=?').run(input.role,input.active?1:0,id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);invalidateResets(id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
   json(res,200,{ok:true});return true;
  }
  if(path==='/api/admin/notifications'&&req.method==='GET'){admin(req);json(res,200,{...notifications.status(),notifications:db.prepare('SELECT id,kind,recipient,subject,status,attempts,last_error,created_at,sent_at FROM notifications ORDER BY id DESC LIMIT 100').all()});return true;}
  const retry=path.match(/^\/api\/admin\/notifications\/(\d+)\/retry$/);
  if(retry&&req.method==='POST'){admin(req);const result=db.prepare("UPDATE notifications SET status='pending',attempts=0,next_attempt=?,last_error='' WHERE id=? AND kind!='password-reset' AND status='failed'").run(clock(),Number(retry[1]));if(!result.changes)throw error(400,'Cet envoi ne peut pas être relancé.');json(res,200,{ok:true});return true;}
  return false;
 };
}
