import {requireAdmin,json} from './_auth.mjs';
export default async (request)=>{
 if(request.method!=='POST') return json({error:'Método no permitido'},405); const auth=await requireAdmin(request); if(auth.error)return json({error:auth.error},auth.status);
 const {full_name,email,password,plan_slug}=await request.json(); if(!email||!password||!plan_slug)return json({error:'Datos incompletos'},400);
 const r=await fetch(`${auth.url}/auth/v1/admin/users`,{method:'POST',headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,user_metadata:{full_name}})}); const u=await r.json(); if(!r.ok)return json({error:u.msg||u.message||'No se pudo crear el usuario'},400);
 const p=await fetch(`${auth.url}/rest/v1/profiles`,{method:'POST',headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({id:u.id,full_name,email,role:'student',plan_slug,active:true})}); if(!p.ok){await fetch(`${auth.url}/auth/v1/admin/users/${u.id}`,{method:'DELETE',headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`}});return json({error:'No se pudo crear el perfil del alumno'},400)}
 return json({ok:true,id:u.id});
}
