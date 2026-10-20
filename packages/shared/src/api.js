export async function api(path,options={}){
 let response;
 try{response=await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});}catch{throw new Error('Le serveur est indisponible. Réessayez lorsque la connexion est rétablie.');}
 let data;try{data=await response.json();}catch{throw new Error('L’API ne répond pas. Démarrez le serveur Node de l’application.');}
 if(!response.ok){const error=new Error(data.error||'Une erreur est survenue.');error.status=response.status;throw error;}return data;
}
export const mediaUrl=image=>image?.startsWith('/media/')||image?.startsWith('https://res.cloudinary.com/')?image:`/assets/${image}`;
