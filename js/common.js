import { supabase, configured } from './supabase-client.js';

export const DEMO = {
  settings:{academy_name:'Digital World VIP',whatsapp:'',hero_title:'Aprende a crear y vender productos digitales',hero_subtitle:'Una academia práctica para desarrollar habilidades, crear ofertas digitales y construir nuevas fuentes de ingresos por internet.',about_text:'Capacitación paso a paso, recursos descargables y contenido organizado por membresía.',transfer_details:'Configura aquí tus datos de transferencia desde el panel administrador.'},
  plans:[
    {slug:'bronce',name:'Bronce',description:'Base para comenzar desde cero.',price_local:0,price_usd:0,features:['Fundamentos del negocio digital','Creación de tu primera oferta','Recursos de inicio'],curriculum:['Introducción al ecosistema digital','Definición del producto digital','Primeros pasos para vender en internet'],level:1},
    {slug:'oro',name:'Oro',description:'Formación intermedia para desarrollar tu sistema de ventas.',price_local:0,price_usd:0,features:['Estrategia de contenidos','Embudos y conversión','Recursos avanzados'],curriculum:['Diseño de oferta','Contenido y captación','Proceso de conversión'],level:2},
    {slug:'diamante',name:'Diamante',description:'Programa premium con contenido exclusivo.',price_local:0,price_usd:0,features:['Programa completo','Biblioteca premium','Material exclusivo'],curriculum:['Estrategia integral','Optimización y escalamiento','Recursos premium'],level:3}
  ],
  founders:[1,2,3,4].map(i=>({id:i,name:`Fundador ${i}`,role:'Co-fundador',bio:'Agrega aquí la biografía y especialidad.',photo_url:''}))
};

export function money(value,currency){
  const n=Number(value||0); return n ? new Intl.NumberFormat('es',{style:'currency',currency}).format(n) : 'Por definir';
}
export function localMoney(value){
  const n=Number(value||0); return n ? `${new Intl.NumberFormat('es',{maximumFractionDigits:2}).format(n)} pesos` : 'Por definir';
}

export function waLink(phone,text){
  const p=(phone||'').replace(/\D/g,'');
  return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : '#';
}
export async function loadPublicData(){
  if(!configured) return DEMO;
  const [{data:settings},{data:plans},{data:founders}] = await Promise.all([
    supabase.from('site_settings').select('*').eq('id',1).maybeSingle(),
    supabase.from('plans').select('*').eq('active',true).order('level'),
    supabase.from('founders').select('*').order('sort_order')
  ]);
  return {settings:settings||DEMO.settings,plans:plans?.length?plans:DEMO.plans,founders:founders?.length?founders:DEMO.founders};
}
export async function getSession(){
  if(!configured) return null;
  const {data}=await supabase.auth.getSession(); return data.session;
}
export async function getProfile(){
  const session=await getSession(); if(!session) return null;
  const {data}=await supabase.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
  return data;
}
export async function logout(){ if(supabase) await supabase.auth.signOut(); location.href='/login.html'; }
export function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
