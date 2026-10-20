import nodemailer from 'nodemailer';

export function mailConfig(env=process.env){
 const host=env.SMTP_HOST||'',from=env.MAIL_FROM||'';
 const enabled=!!host&&!!from;
 const port=Number(env.SMTP_PORT||587);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('SMTP_PORT invalide.');
 if((host&&!from)||(!host&&from))throw new Error('Configurer SMTP_HOST et MAIL_FROM ensemble.');
 if(from&&!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(from))throw new Error('MAIL_FROM doit être une adresse e-mail valide.');
 return {enabled,host,port,from,secure:env.SMTP_SECURE==='true',user:env.SMTP_USER||'',password:env.SMTP_PASSWORD||''};
}

export function createNotifications({db,config,clock,transport}){
 const mail=config.mail||{enabled:false};
 const sender=transport||(mail.enabled?nodemailer.createTransport({host:mail.host,port:mail.port,secure:mail.secure,requireTLS:!mail.secure,auth:mail.user?{user:mail.user,pass:mail.password}:undefined,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000}):null);
 let running=false,closed=false;
 function enqueue({kind,to,subject,text,expires=null}){
  db.prepare('INSERT INTO notifications(kind,recipient,subject,text,next_attempt,expires,created_at) VALUES(?,?,?,?,?,?,?)').run(kind,to,subject,text,clock(),expires,new Date(clock()).toISOString());
 }
 async function flush(){
  if(running||closed||!sender)return;running=true;
  try{
   // One process / one replica. Expired reset links are never sent.
   db.prepare("UPDATE notifications SET status='expired',text='' WHERE status='pending' AND expires IS NOT NULL AND expires<=?").run(clock());
   const jobs=db.prepare("SELECT * FROM notifications WHERE status='pending' AND next_attempt<=? ORDER BY id LIMIT 10").all(clock());
   for(const job of jobs){
    if(closed)break;
    try{const result=await sender.sendMail({from:mail.from,to:job.recipient,subject:job.subject,text:job.text,headers:{'X-Entity-Ref-ID':`tai-${job.id}`}});if(result?.rejected?.length)throw new Error('rejected');if(closed)break;db.prepare("UPDATE notifications SET status='sent',attempts=attempts+1,sent_at=?,last_error='',text=CASE WHEN kind='password-reset' THEN '' ELSE text END WHERE id=?").run(new Date(clock()).toISOString(),job.id);}
    catch{if(closed)break;const attempts=job.attempts+1;db.prepare("UPDATE notifications SET status=?,attempts=?,next_attempt=?,last_error='Envoi SMTP refusé ou indisponible' WHERE id=?").run(attempts>=5?'failed':'pending',attempts,clock()+Math.min(3600000,60000*2**job.attempts),job.id);}
   }
  }finally{running=false;}
 }
 const timer=setInterval(()=>void flush().catch(()=>{}),15000);timer.unref();
 void flush().catch(()=>{});
 return {enqueue,flush,enabled:!!sender,status:()=>({configured:!!sender,counts:db.prepare('SELECT status,COUNT(*) AS count FROM notifications GROUP BY status').all()}),close(){closed=true;clearInterval(timer);sender?.close?.();}};
}
