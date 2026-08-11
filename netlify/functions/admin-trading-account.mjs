import { randomBytes, scryptSync } from 'node:crypto';
import { requireAdmin, json } from './_auth.mjs';

const headers=(service)=>({apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'});
const cleanUser=(v='')=>String(v).trim().toLowerCase().replace(/\s+/g,'');
const hashPassword=(password)=>{const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');return `scrypt$${salt}$${hash}`};

export default async (request)=>{
  if(request.method!=='POST') return json({error:'Método no permitido.'},405);
  const auth=await requireAdmin(request); if(auth.error) return json({error:auth.error},auth.status);
  const {url,service}=auth; let body={}; try{body=await request.json()}catch{}
  const action=body.action||'list';
  try{
    if(action==='list'){
      const r=await fetch(`${url}/rest/v1/trading_accounts?select=id,username,active,expires_at,notes,created_at&order=created_at.desc`,{headers:headers(service)});
      if(!r.ok) throw new Error(await r.text()); return json({accounts:await r.json()});
    }
    if(action==='create'){
      const username=cleanUser(body.username); const password=String(body.password||'');
      if(username.length<3) return json({error:'El usuario debe tener al menos 3 caracteres.'},400);
      if(password.length<8) return json({error:'La contraseña debe tener al menos 8 caracteres.'},400);
      const payload={username,password_hash:hashPassword(password),active:true,expires_at:body.expires_at||null,notes:String(body.notes||'')};
      const r=await fetch(`${url}/rest/v1/trading_accounts`,{method:'POST',headers:{...headers(service),Prefer:'return=representation'},body:JSON.stringify(payload)});
      if(!r.ok){const t=await r.text();if(t.includes('duplicate')) return json({error:'Ese usuario ya existe.'},409);throw new Error(t)}
      return json({ok:true,account:(await r.json())[0]});
    }
    if(action==='update'){
      if(!body.id) return json({error:'Falta el ID del acceso.'},400);
      const payload={active:body.active!==false,expires_at:body.expires_at||null,notes:String(body.notes||''),updated_at:new Date().toISOString()};
      if(body.username) payload.username=cleanUser(body.username);
      if(body.password){if(String(body.password).length<8)return json({error:'La nueva contraseña debe tener al menos 8 caracteres.'},400);payload.password_hash=hashPassword(String(body.password))}
      const r=await fetch(`${url}/rest/v1/trading_accounts?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',headers:headers(service),body:JSON.stringify(payload)});
      if(!r.ok) throw new Error(await r.text()); return json({ok:true});
    }
    if(action==='delete'){
      if(!body.id) return json({error:'Falta el ID del acceso.'},400);
      const r=await fetch(`${url}/rest/v1/trading_accounts?id=eq.${encodeURIComponent(body.id)}`,{method:'DELETE',headers:headers(service)});
      if(!r.ok) throw new Error(await r.text()); return json({ok:true});
    }
    return json({error:'Acción no válida.'},400);
  }catch(err){return json({error:'No se pudo gestionar el acceso Trading.',detail:String(err.message||err)},500)}
};
