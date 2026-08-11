export async function requireAdmin(request){
  const url=process.env.SUPABASE_URL; const anon=process.env.SUPABASE_ANON_KEY; const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service) return {error:'Faltan variables de entorno de Supabase en Netlify.',status:500};
  const auth=request.headers.get('authorization')||''; if(!auth.startsWith('Bearer ')) return {error:'No autorizado.',status:401};
  const token=auth.slice(7);
  const userRes=await fetch(`${url}/auth/v1/user`,{headers:{apikey:anon,Authorization:`Bearer ${token}`}}); if(!userRes.ok) return {error:'Sesión inválida.',status:401};
  const user=await userRes.json();
  const profRes=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,active`,{headers:{apikey:service,Authorization:`Bearer ${service}`}}); const arr=await profRes.json();
  if(!Array.isArray(arr)||arr[0]?.role!=='admin'||!arr[0]?.active) return {error:'Permisos de administrador requeridos.',status:403};
  return {url,anon,service,user};
}
export const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
