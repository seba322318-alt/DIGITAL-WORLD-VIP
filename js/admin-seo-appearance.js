import { supabase,configured } from './supabase-client.js';
import { getSession,getProfile,escapeHtml } from './common.js';

if(configured){
  const session=await getSession();
  const me=session?await getProfile():null;
  if(me?.role==='admin'){
    const nav=document.querySelector('#nav');
    const logout=document.querySelector('#logoutBtn');
    const btn=document.createElement('button');
    btn.id='seoAppearanceBtn';
    btn.textContent='SEO y apariencia';
    nav.insertBefore(btn,logout);

    document.querySelectorAll('#nav [data-view]').forEach(b=>b.addEventListener('click',()=>btn.classList.remove('active')));

    btn.onclick=async()=>{
      document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      await renderSeoAppearance();
    };
  }
}

const fonts=['Montserrat','Poppins','Cinzel','Arial','Georgia','Trebuchet MS','Verdana'];
const effects=[
  ['flat','Plano'],
  ['gradient','Degradado'],
  ['shadow','Sombra'],
  ['glow','Brillo / neón'],
  ['metallic','Metalizado'],
  ['3d-soft','3D suave'],
  ['3d-strong','3D fuerte']
];
const pageLabels={
  home:'Inicio',
  viajes:'Viajes e incentivos',
  'estilo-vida':'Trabajo digital',
  ofertas:'Accesos digitales',
  trading:'Trading'
};

function fontOptions(current){
  return fonts.map(f=>`<option value="${escapeHtml(f)}" ${current===f?'selected':''}>${escapeHtml(f)}</option>`).join('');
}
function effectOptions(current){
  return effects.map(([v,l])=>`<option value="${v}" ${current===v?'selected':''}>${l}</option>`).join('');
}
function applyPreview(el,s){
  const primary=s.hero_title_color||'#F8C54D';
  const secondary=s.hero_title_color_2||'#FFF0AB';
  const shadow=s.hero_title_shadow_color||'#3B2507';
  const map={
    'Montserrat':"'Montserrat',Arial,sans-serif",'Poppins':"'Poppins',Arial,sans-serif",
    'Cinzel':"'Cinzel',Georgia,serif",'Arial':"Arial,sans-serif",
    'Georgia':"Georgia,'Times New Roman',serif",'Trebuchet MS':"'Trebuchet MS',Arial,sans-serif",
    'Verdana':"Verdana,Arial,sans-serif"
  };
  el.style.fontFamily=map[s.hero_font]||map.Montserrat;
  el.style.background='none';el.style.webkitBackgroundClip='border-box';el.style.backgroundClip='border-box';
  el.style.color=primary;el.style.textShadow='none';el.style.filter='none';
  if(s.hero_title_effect==='gradient'){
    el.style.background=`linear-gradient(180deg,${secondary},${primary})`;el.style.webkitBackgroundClip='text';el.style.backgroundClip='text';el.style.color='transparent';
  }else if(s.hero_title_effect==='shadow'){
    el.style.textShadow=`0 8px 18px ${shadow}`;
  }else if(s.hero_title_effect==='glow'){
    el.style.textShadow=`0 0 8px ${primary},0 0 22px ${primary},0 8px 20px ${shadow}`;
  }else if(s.hero_title_effect==='3d-soft'){
    el.style.textShadow=`0 1px 0 ${shadow},0 2px 0 ${shadow},0 3px 0 ${shadow},0 7px 12px rgba(0,0,0,.55)`;
  }else if(s.hero_title_effect==='3d-strong'){
    el.style.textShadow=`0 1px 0 ${shadow},0 2px 0 ${shadow},0 3px 0 ${shadow},0 4px 0 ${shadow},0 5px 0 ${shadow},0 6px 0 ${shadow},0 8px 14px rgba(0,0,0,.7)`;
  }else if(s.hero_title_effect==='metallic'){
    el.style.background=`linear-gradient(180deg,${secondary} 0%,${primary} 28%,${shadow} 58%,${primary} 78%,${secondary} 100%)`;
    el.style.webkitBackgroundClip='text';el.style.backgroundClip='text';el.style.color='transparent';el.style.filter=`drop-shadow(0 6px 6px ${shadow})`;
  }
}

async function renderSeoAppearance(){
  const view=document.querySelector('#view');
  const flash=document.querySelector('#flash');
  const [{data:s,error:se},{data:seo,error:ee}]=await Promise.all([
    supabase.from('site_settings').select('*').eq('id',1).single(),
    supabase.from('seo_settings').select('*').order('page_slug')
  ]);
  if(se||ee){
    view.innerHTML=`<div class="notice error">${escapeHtml((se||ee).message)}</div>`;
    return;
  }

  const seoBy=Object.fromEntries((seo||[]).map(x=>[x.page_slug,x]));
  view.innerHTML=`
  <div class="panel">
    <div class="main-head"><div><div class="eyebrow">PORTADA</div><h2>Tipografía, colores y efectos</h2><p style="color:#9ea8b8">Estos cambios afectan únicamente el título y slogan de la página principal.</p></div><a class="btn btn-dark btn-small" href="/" target="_blank">Ver portada</a></div>
    <form id="appearanceForm">
      <div class="field"><label>Título principal</label><input name="hero_title" value="${escapeHtml(s?.hero_title||'DIGITAL WORLD VIP')}"></div>
      <div class="grid-2">
        <div class="field"><label>Tipografía del título</label><select name="hero_font">${fontOptions(s?.hero_font||'Montserrat')}</select></div>
        <div class="field"><label>Efecto del título</label><select name="hero_title_effect">${effectOptions(s?.hero_title_effect||'metallic')}</select></div>
      </div>
      <div class="grid-3">
        <div class="field"><label>Color principal</label><input type="color" name="hero_title_color" value="${escapeHtml(s?.hero_title_color||'#F8C54D')}"></div>
        <div class="field"><label>Segundo color</label><input type="color" name="hero_title_color_2" value="${escapeHtml(s?.hero_title_color_2||'#FFF0AB')}"></div>
        <div class="field"><label>Color sombra / relieve</label><input type="color" name="hero_title_shadow_color" value="${escapeHtml(s?.hero_title_shadow_color||'#3B2507')}"></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Slogan</label><input name="hero_slogan" value="${escapeHtml(s?.hero_slogan||'Formación digital para aprender, aplicar y crecer online')}"></div>
        <div class="field"><label>Tipografía del slogan</label><select name="hero_slogan_font">${fontOptions(s?.hero_slogan_font||'Montserrat')}</select></div>
      </div>
      <div class="field"><label>Color del slogan</label><input type="color" name="hero_slogan_color" value="${escapeHtml(s?.hero_slogan_color||'#FFFFFF')}"></div>
      <div style="padding:22px;border:1px solid #3b3420;border-radius:14px;background:#050608;text-align:center;margin:12px 0 18px">
        <div id="titlePreview" style="font-size:clamp(38px,6vw,78px);font-weight:900;line-height:1">DIGITAL WORLD VIP</div>
        <div id="sloganPreview" style="font-size:22px;margin-top:12px">Formación digital para aprender, aplicar y crecer online</div>
      </div>
      <button class="btn btn-primary">Guardar apariencia</button>
    </form>
  </div>

  <div class="panel" style="margin-top:18px">
    <div class="main-head"><div><div class="eyebrow">GOOGLE</div><h2>SEO editable por página</h2><p style="color:#9ea8b8">Puedes cambiar estos textos en el futuro sin editar el código.</p></div></div>
    <div id="seoForms">
      ${Object.keys(pageLabels).map(slug=>{
        const r=seoBy[slug]||{};
        return `<form class="seo-page-form" data-slug="${slug}" style="padding:18px 0;border-top:1px solid #252c39">
          <h3>${pageLabels[slug]}</h3>
          <div class="field"><label>Título para Google</label><input name="seo_title" maxlength="70" value="${escapeHtml(r.seo_title||'')}"></div>
          <div class="field"><label>Descripción para Google</label><textarea name="seo_description" maxlength="180">${escapeHtml(r.seo_description||'')}</textarea></div>
          <div class="field"><label>URL canónica</label><input name="canonical_url" value="${escapeHtml(r.canonical_url||'')}"></div>
          <button class="btn btn-dark btn-small">Guardar SEO de ${pageLabels[slug]}</button>
        </form>`;
      }).join('')}
    </div>
  </div>`;

  const form=document.querySelector('#appearanceForm');
  const titlePreview=document.querySelector('#titlePreview');
  const sloganPreview=document.querySelector('#sloganPreview');

  function refreshPreview(){
    const obj=Object.fromEntries(new FormData(form).entries());
    titlePreview.textContent=obj.hero_title||'DIGITAL WORLD VIP';
    sloganPreview.textContent=obj.hero_slogan||'';
    sloganPreview.style.fontFamily=obj.hero_slogan_font||'Montserrat';
    sloganPreview.style.color=obj.hero_slogan_color||'#FFFFFF';
    applyPreview(titlePreview,obj);
  }
  form.addEventListener('input',refreshPreview);
  form.addEventListener('change',refreshPreview);
  refreshPreview();

  form.onsubmit=async e=>{
    e.preventDefault();
    const obj=Object.fromEntries(new FormData(form).entries());
    const {error}=await supabase.from('site_settings').update(obj).eq('id',1);
    flash.textContent=error?error.message:'Apariencia actualizada.';
    flash.className=`notice ${error?'error':'ok'}`;
    flash.classList.remove('hidden');
    setTimeout(()=>flash.classList.add('hidden'),4500);
  };

  document.querySelectorAll('.seo-page-form').forEach(f=>f.onsubmit=async e=>{
    e.preventDefault();
    const obj=Object.fromEntries(new FormData(f).entries());
    const {error}=await supabase.from('seo_settings').upsert({
      page_slug:f.dataset.slug,
      ...obj,
      updated_at:new Date().toISOString()
    },{onConflict:'page_slug'});
    flash.textContent=error?error.message:`SEO de ${pageLabels[f.dataset.slug]} actualizado.`;
    flash.className=`notice ${error?'error':'ok'}`;
    flash.classList.remove('hidden');
    setTimeout(()=>flash.classList.add('hidden'),4500);
  });
}