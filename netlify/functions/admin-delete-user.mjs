import {requireAdmin,json} from './_auth.mjs';

export default async (request)=>{
  if(request.method!=='POST') return json({error:'Método no permitido'},405);

  const auth=await requireAdmin(request);
  if(auth.error) return json({error:auth.error},auth.status);

  const {id}=await request.json().catch(()=>({}));
  if(!id) return json({error:'ID del alumno requerido'},400);
  if(id===auth.user.id) return json({error:'No puedes eliminar tu propia cuenta de administrador.'},400);

  const profileRes=await fetch(
    `${auth.url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,role`,
    {headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`}}
  );
  const profiles=await profileRes.json().catch(()=>[]);
  if(!profileRes.ok || !Array.isArray(profiles) || profiles.length===0) return json({error:'Alumno no encontrado'},404);
  if(profiles[0].role!=='student') return json({error:'Solo se pueden eliminar cuentas de alumnos desde esta opción.'},400);

  const r=await fetch(`${auth.url}/auth/v1/admin/users/${encodeURIComponent(id)}`,{
    method:'DELETE',
    headers:{apikey:auth.service,Authorization:`Bearer ${auth.service}`}
  });

  if(!r.ok){
    const detail=await r.json().catch(()=>({}));
    return json({error:detail.msg||detail.message||'No se pudo eliminar el alumno'},400);
  }

  return json({ok:true});
};
