import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const cleanUser=(v='')=>String(v).trim().toLowerCase().replace(/\s+/g,'');
function verifyPassword(password,stored=''){try{const [kind,salt,hex]=stored.split('$');if(kind!=='scrypt'||!salt||!hex)return false;const got=scryptSync(password,salt,64);const expected=Buffer.from(hex,'hex');return got.length===expected.length&&timingSafeEqual(got,expected)}catch{return false}}
function signToken(payload,secret){const body=Buffer.from(JSON.stringify(payload)).toString('base64url');const sig=createHmac('sha256',secret).update(body).digest('base64url');return `${body}.${sig}`}
export default async(request)=>{
 if(request.method!=='POST')return json({error:'Método no permitido.'},405);
 const url=(process.env.SUPABASE_URL||'').replace(/\/+$/,'');const service=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!service)return json({error:'Configuración del servidor incompleta.'},500);
 let body={};try{body=await request.json()}catch{}
 const username=cleanUser(body.username),password=String(body.password||'');if(!username||!password)return json({error:'Escribe usuario y contraseña.'},400);
 const r=await fetch(`${url}/rest/v1/trading_accounts?username=eq.${encodeURIComponent(username)}&select=id,username,password_hash,active,expires_at&limit=1`,{headers:{apikey:service,Authorization:`Bearer ${service}`}});
 if(!r.ok)return json({error:'No se pudo validar el acceso.'},500);const rows=await r.json();const a=rows?.[0];
 const expired=a?.expires_at&&new Date(a.expires_at).getTime()<Date.now();if(!a||!a.active||expired||!verifyPassword(password,a.password_hash))return json({error:'Usuario o contraseña no válidos, o acceso inactivo.'},401);
 const exp=Math.floor(Date.now()/1000)+(12*60*60);const token=signToken({sub:a.id,u:a.username,exp},service);return json({token,username:a.username,expires_at:exp});
};
