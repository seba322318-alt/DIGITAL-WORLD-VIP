import {requireAdmin,json} from './_auth.mjs';
export default async (request)=>{
 if(request.method!=='POST')return json({error:'Método no permitido'},405); const auth=await requireAdmin(request);if(auth.error)return json({error:auth.error},auth.status); const {id,full_name,plan_slug,active}=await request.json();if(!id)return json({error:'ID requerido'},400);
 const r=await fetch(`${auth.url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({full_name,plan_slug,active})}); if(!r.ok)return json({error:'No se pudo actualizar el alumno'},400); return json({ok:true});
}
