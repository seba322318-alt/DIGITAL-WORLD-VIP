import { supabase,configured } from './supabase-client.js';
import { escapeHtml } from './common.js';

const slug=document.body.dataset.publicPage;
const defaults={
  viajes:{eyebrow:'Experiencias Digital World VIP',title:'Viajes, reconocimientos e incentivos',subtitle:'En campañas específicas, alumnos destacados pueden ser considerados para experiencias, reconocimientos o incentivos definidos por la academia.',hero_image_url:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85',body_title:'Crecer también puede abrir nuevas experiencias',body_text:'La academia puede organizar campañas de reconocimiento para destacar constancia, participación, resultados o cumplimiento de objetivos. Los beneficios, criterios y disponibilidad se informan en cada campaña.',cta_title:'Tu progreso puede ser reconocido',cta_text:'Los viajes e incentivos no son automáticos ni garantizados; dependen de las reglas, vigencia y disponibilidad de cada campaña.',cta_button_text:'Ver membresías',cta_button_url:'/#membresias',active:true},
  'estilo-vida':{eyebrow:'Libertad para crear',title:'Aprende a trabajar y crear desde cualquier lugar',subtitle:'Organiza tu actividad digital, crea contenido, desarrolla productos y aprende a gestionar proyectos con herramientas online.',hero_image_url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=85',body_title:'Un ecosistema para el trabajo digital',body_text:'Digital World VIP reúne formación, materiales y herramientas para ayudarte a desarrollar habilidades aplicables a proyectos digitales y trabajo por internet.',cta_title:'Construye tus habilidades digitales',cta_text:'Los resultados dependen de tu implementación, dedicación, mercado y otros factores; la formación no garantiza ingresos específicos.',cta_button_text:'Conocer membresías',cta_button_url:'/#membresias',active:true}
};
const cardDefaults={viajes:[
{badge:'DESTACADOS',title:'Experiencias y viajes',body:'Campañas especiales pueden incluir experiencias o viajes para participantes que cumplan criterios previamente definidos.',image_url:'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=85'},
{badge:'RECONOCIMIENTO',title:'Reconocimiento al progreso',body:'Destaca avances, constancia, participación y logros conforme a las reglas de cada campaña.',image_url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85'},
{badge:'INCENTIVOS',title:'Incentivos especiales',body:'La academia puede anunciar premios o beneficios promocionales con condiciones, fechas y disponibilidad específicas.',image_url:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85'}],
'estilo-vida':[
{badge:'REMOTO',title:'Trabajo desde cualquier lugar',body:'Aprende a organizar tareas, recursos y procesos digitales desde una computadora o dispositivo conectado.',image_url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=85'},
{badge:'REDES',title:'Contenido y redes sociales',body:'Desarrolla habilidades para planificar contenido, comunicar propuestas y gestionar presencia digital.',image_url:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85'},
{badge:'EQUIPO',title:'Colaboración digital',body:'Conoce formas de organizar proyectos y colaborar utilizando herramientas online.',image_url:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85'}]
};
let page=defaults[slug]; let cards=cardDefaults[slug]||[]; let academy='Digital World VIP';
if(configured){
 const [{data:p},{data:c},{data:s}]=await Promise.all([
  supabase.from('site_pages').select('*').eq('slug',slug).maybeSingle(),
  supabase.from('site_cards').select('*').eq('page_slug',slug).eq('active',true).order('sort_order'),
  supabase.from('site_settings').select('academy_name').eq('id',1).maybeSingle()
 ]);
 if(p) page=p; if(c?.length) cards=c; if(s?.academy_name) academy=s.academy_name;
}
if(page?.active===false){location.href='/';}
document.querySelectorAll('[data-brand]').forEach(x=>x.textContent=academy.toUpperCase());
document.querySelector('#year').textContent=new Date().getFullYear();
document.querySelector('#pageEyebrow').textContent=page.eyebrow||'';
document.querySelector('#pageTitle').textContent=page.title||'';
document.querySelector('#pageSubtitle').textContent=page.subtitle||'';
document.querySelector('#bodyTitle').textContent=page.body_title||'';
document.querySelector('#bodyText').textContent=page.body_text||'';
document.querySelector('#ctaTitle').textContent=page.cta_title||'';
document.querySelector('#ctaText').textContent=page.cta_text||'';
const btn=document.querySelector('#ctaButton'); btn.textContent=page.cta_button_text||'Ver membresías'; btn.href=page.cta_button_url||'/#membresias';
document.querySelector('#pageHeroBg').style.backgroundImage=`url("${String(page.hero_image_url||'').replace(/["\\]/g,'')}")`;
document.querySelector('#pageCards').innerHTML=cards.map((c,i)=>`<article class="experience-card"><div class="experience-image"><img src="${escapeHtml(c.image_url||'')}" alt="${escapeHtml(c.title||'')}" loading="lazy"></div><div class="experience-body"><span>${escapeHtml(c.badge||String(i+1).padStart(2,'0'))}</span><h3>${escapeHtml(c.title||'')}</h3><p>${escapeHtml(c.body||'')}</p></div></article>`).join('');
