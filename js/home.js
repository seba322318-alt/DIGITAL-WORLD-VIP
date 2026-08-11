import { supabase, configured } from './supabase-client.js';
import { loadPublicData,money,localMoney,waLink,escapeHtml } from './common.js';

const data=await loadPublicData();
const s=data.settings||{};
const academy=(s.academy_name||'Digital World VIP');

document.querySelector('#brandName').textContent=academy.toUpperCase();
document.querySelector('#heroBrandline').textContent=academy.toUpperCase();
document.querySelector('#footerBrand').textContent=academy;
document.querySelector('#heroTitle').textContent=s.hero_title||'Aprende a crear, promocionar y vender productos digitales';
document.querySelector('#heroSub').textContent=s.hero_subtitle||'Formación práctica para desarrollar habilidades de marketing digital y construir oportunidades de negocio en internet.';
document.querySelector('#year').textContent=new Date().getFullYear();

const slogan=(s.hero_slogan||'TU MEJOR ALIADO').trim();
const words=slogan.split(/\s+/).filter(Boolean);
const last=words.pop()||'';
document.querySelector('#heroSlogan').innerHTML=`${escapeHtml(words.join(' '))}${words.length?' ':''}<span>${escapeHtml(last)}</span>`;

const heroPoster=s.hero_poster_url||'https://images.pexels.com/videos/35244308/drone-sunset-35244308.jpeg?auto=compress&dpr=1&h=1080&w=1920';
const posterEl=document.querySelector('#heroPoster');
posterEl.style.backgroundImage=`url("${String(heroPoster).replace(/["\\]/g,'')}")`;
const video=document.querySelector('#heroVideo');
const source=document.querySelector('#heroVideoSource');
if(s.hero_video_enabled!==false && s.hero_video_url){
  source.src=s.hero_video_url;
  video.poster=heroPoster;
  video.load();
  video.classList.remove('hidden');
}else{
  video.classList.add('hidden');
}

const planClasses={bronce:'badge-bronze',oro:'badge-gold',diamante:'badge-diamond'};
const planLabels={bronce:'Nivel inicial',oro:'Nivel avanzado',diamante:'Nivel completo'};
document.querySelector('#plans').innerHTML=data.plans.map((p)=>{
  const msg=`Hola, quiero adquirir la membresía ${p.name} de ${academy}. Quiero información para realizar el pago por transferencia.`;
  const link=waLink(s.whatsapp,msg); const disabled=link==='#';
  return `<article class="plan-card plan-${escapeHtml(p.slug)} ${p.slug==='oro'?'featured':''}">
    <div class="plan-topline"></div><div class="plan-heading-row"><span class="plan-badge ${planClasses[p.slug]||'badge-gold'}">${escapeHtml(p.name)}</span><span class="plan-level">${planLabels[p.slug]||'Membresía'}</span></div>
    <h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p>
    <div class="price-stack"><div class="price"><strong>${localMoney(p.price_local)}</strong><small>Precio en pesos • moneda configurable</small></div><div class="price price-usd"><strong>${money(p.price_usd,'USD')}</strong><small>Precio en dólares</small></div></div>
    <ul class="features">${(p.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul>
    <div class="plan-actions"><a class="btn btn-dark full" href="/membresia.html?plan=${encodeURIComponent(p.slug)}">Ver contenido</a><a class="btn btn-primary full" ${disabled?'href="#" onclick="alert(\'Configura el número de WhatsApp desde el panel administrador.\');return false"':`href="${link}" target="_blank" rel="noopener"`}>Solicitar por WhatsApp</a></div>
  </article>`;
}).join('');

document.querySelector('#founders').innerHTML=data.founders.slice(0,4).map(f=>`<article class="founder"><div class="founder-photo">${f.photo_url?`<img src="${escapeHtml(f.photo_url)}" alt="${escapeHtml(f.name)}" style="width:100%;height:100%;object-fit:cover">`:'Foto del fundador'}</div><div class="founder-body"><h4>${escapeHtml(f.name)}</h4><div class="role">${escapeHtml(f.role||'Co-fundador')}</div><p>${escapeHtml(f.bio||'')}</p></div></article>`).join('');

const fallbackPages={
  'home-marketing':{eyebrow:'Ecosistema Digital World VIP',title:'Conocimientos pensados para el mundo digital',subtitle:'Estrategia, contenido, ventas y herramientas para desarrollar proyectos digitales.',active:true},
  viajes:{title:'Viajes e incentivos',subtitle:'Conoce campañas y experiencias de reconocimiento.',hero_image_url:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=85',active:true},
  'estilo-vida':{title:'Trabajo digital',subtitle:'Herramientas y habilidades para crear desde cualquier lugar.',hero_image_url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=85',active:true}
};
const fallbackMarketing=[
  {badge:'01',title:'Marketing y estrategia',body:'Aprende a presentar una oferta, comunicar valor y estructurar acciones digitales.',image_url:'https://images.pexels.com/photos/7970815/pexels-photo-7970815.jpeg?auto=compress&dpr=1&h=900&w=1400'},
  {badge:'02',title:'Negocio online',body:'Organiza productos, recursos y procesos para desarrollar una presencia comercial en internet.',image_url:'https://images.pexels.com/photos/16675632/pexels-photo-16675632/free-photo-of-shoper-website-opened-on-the-computer.jpeg?auto=compress&dpr=1&h=900&w=1400'},
  {badge:'03',title:'Ventas digitales',body:'Conoce herramientas y conceptos para llevar una propuesta al mercado digital.',image_url:'https://images.pexels.com/photos/5632397/pexels-photo-5632397.jpeg?auto=compress&dpr=1&h=900&w=1400'}
];
let pages={...fallbackPages}; let marketing=fallbackMarketing;
if(configured){
  const [{data:p},{data:c}]=await Promise.all([
    supabase.from('site_pages').select('*').in('slug',['home-marketing','viajes','estilo-vida']),
    supabase.from('site_cards').select('*').eq('page_slug','home-marketing').eq('active',true).order('sort_order')
  ]);
  for(const row of p||[]) pages[row.slug]=row;
  if(c?.length) marketing=c;
}
const marketingPage=pages['home-marketing']||fallbackPages['home-marketing'];
document.querySelector('#marketingEyebrow').textContent=marketingPage.eyebrow||'Ecosistema Digital World VIP';
document.querySelector('#marketingTitle').textContent=marketingPage.title||'Conocimientos pensados para el mundo digital';
document.querySelector('#marketingSubtitle').textContent=marketingPage.subtitle||'';
document.querySelector('#marketingCards').innerHTML=marketing.map((c,i)=>`<article class="marketing-card ${i===0?'marketing-card-large':''}"><img src="${escapeHtml(c.image_url||'')}" alt="${escapeHtml(c.title||'Marketing digital')}" loading="lazy"><div class="marketing-overlay"><span class="marketing-number">${escapeHtml(c.badge||String(i+1).padStart(2,'0'))}</span><h3>${escapeHtml(c.title||'')}</h3><p>${escapeHtml(c.body||'')}</p></div></article>`).join('');

function applyPromo(slug,prefix){
 const p=pages[slug]||fallbackPages[slug]; const card=document.querySelector(`#${prefix}Promo`); const nav=document.querySelector(`#${prefix}Nav`);
 if(p.active===false){card?.classList.add('hidden');nav?.classList.add('hidden');return}
 document.querySelector(`#${prefix}PromoTitle`).textContent=p.title||'';
 document.querySelector(`#${prefix}PromoText`).textContent=p.subtitle||'';
 const bg=document.querySelector(`#${prefix}PromoBg`); if(bg) bg.style.backgroundImage=`url("${String(p.hero_image_url||'').replace(/["\\]/g,'')}")`;
}
applyPromo('viajes','travel');
applyPromo('estilo-vida','lifestyle');

// V6: vista previa de accesos digitales y Trading.
if(configured){
  const [{data:offers},{data:trading}]=await Promise.all([
    supabase.from('digital_offers').select('*').eq('active',true).order('sort_order').limit(4),
    supabase.from('trading_settings').select('*').eq('id',1).maybeSingle()
  ]);
  const preview=document.querySelector('#digitalOffersPreview');
  if(preview){preview.innerHTML=(offers||[]).map((o,i)=>`<a class="offer-preview-card" href="/ofertas.html"><div class="offer-preview-media">${o.image_url?`<img src="${escapeHtml(o.image_url)}" alt="${escapeHtml(o.name)}" loading="lazy">`:`<div class="offer-placeholder"><span>${escapeHtml((o.name||'DW').slice(0,2).toUpperCase())}</span></div>`}</div><div class="offer-preview-body"><span>${String(i+1).padStart(2,'0')}</span><h3>${escapeHtml(o.name)}</h3><p>${escapeHtml(o.subtitle||'Acceso digital disponible')}</p><div class="mini-prices"><b>${localMoney(o.price_local||0)}</b><b>${money(o.price_usd||0,'USD')}</b></div></div></a>`).join('')||'<div class="notice">Próximamente encontrarás aquí accesos digitales.</div>'}
  if(trading){const card=document.querySelector('#tradingPromoHome');if(trading.active===false)card?.classList.add('hidden');document.querySelector('#tradingHomeEyebrow').textContent=trading.eyebrow||'NUEVA ERA';document.querySelector('#tradingHomeTitle').textContent=trading.title||'TRADING — LA ERA DIGITAL';document.querySelector('#tradingHomeText').textContent=trading.subtitle||'';if(trading.cover_url)document.querySelector('#tradingHomeBg').style.backgroundImage=`url("${String(trading.cover_url).replace(/["\\]/g,'')}")`}
}
