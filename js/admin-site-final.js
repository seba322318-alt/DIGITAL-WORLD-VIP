import { supabase, configured } from './supabase-client.js';
import { getSession, getProfile } from './common.js';

if (configured) {
  const session = await getSession();
  const profile = session ? await getProfile() : null;
  if (session && profile?.role === 'admin') {
    const view = document.querySelector('#view');
    const flash = document.querySelector('#flash');
    let busy = false;

    const observer = new MutationObserver(() => enhanceAll());
    observer.observe(view, { childList: true, subtree: true });
    enhanceAll();

    function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
    function safeName(name='archivo'){return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'_')}
    function notify(text,type='ok'){if(!flash)return;flash.textContent=text;flash.className=`notice ${type}`;flash.classList.remove('hidden');setTimeout(()=>flash.classList.add('hidden'),4500)}
    async function upload(file,folder){if(!file)throw new Error('Selecciona un archivo.');const path=`${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error}=await supabase.storage.from('site-media').upload(path,file,{upsert:false,contentType:file.type||undefined});if(error)throw error;const {data}=supabase.storage.from('site-media').getPublicUrl(path);if(!data?.publicUrl)throw new Error('No se pudo obtener la URL del archivo.');return data.publicUrl}
    function setLabel(input,text){const field=input?.closest('.field');const label=field?.querySelector('label');if(label)label.textContent=text}

    async function enhanceAll(){if(busy)return;busy=true;try{enhanceHome();await enhanceVisual();await enhanceOffers();await enhanceTrading()}finally{busy=false}}

    function enhanceHome(){
      const form=view.querySelector('#settingsForm'); if(!form||form.dataset.finalEnhanced)return; form.dataset.finalEnhanced='1';
      const title=form.querySelector('[name="hero_title"]'); if(title){setLabel(title,'Título principal completo visible');title.placeholder='Ej. DIGITAL WORLD VIP'}
      const slogan=form.querySelector('[name="hero_slogan"]'); if(slogan)setLabel(slogan,'Slogan debajo del título');
      const type=form.querySelector('[name="hero_video_enabled"]');
      if(type){setLabel(type,'Fondo principal');const yes=type.querySelector('option[value="true"]'),no=type.querySelector('option[value="false"]');if(yes)yes.textContent='Video';if(no)no.textContent='Foto'}
      const video=form.querySelector('[name="hero_video_url"]'); if(video)setLabel(video,'Video de fondo — URL o subir desde computadora');
      const poster=form.querySelector('[name="hero_poster_url"]'); if(poster)setLabel(poster,'Foto de fondo / imagen de respaldo');
      const helper=document.createElement('div');helper.className='dwv-admin-helper';helper.textContent='El título completo, la foto y el video de la portada se controlan aquí. Si eliges Foto, se usa la imagen de respaldo; si eliges Video, se reproduce el video y la foto queda como respaldo.';form.insertBefore(helper,form.firstChild?.nextSibling||form.firstChild);
      const founderForms=[...view.querySelectorAll('.founder-form')];founderForms.slice(2).forEach(x=>x.remove());
    }

    async function enhanceVisual(){
      const forms=[...view.querySelectorAll('.page-settings-form')].filter(f=>f.dataset.slug!=='home-marketing'&&!f.dataset.bgEnhanced); if(!forms.length)return;
      const {data:pages}=await supabase.from('site_pages').select('slug,hero_bg_type,hero_video_url');const map=Object.fromEntries((pages||[]).map(p=>[p.slug,p]));
      for(const form of forms){form.dataset.bgEnhanced='1';const slug=form.dataset.slug;const p=map[slug]||{};const image=form.querySelector('[name="hero_image_url"]');if(image)setLabel(image,'Foto de fondo');const box=document.createElement('div');box.className='dwv-bg-extra';box.innerHTML=`<h4>Fondo de la página</h4><div class="grid-2"><div class="field"><label>Tipo de fondo</label><select name="hero_bg_type"><option value="foto" ${p.hero_bg_type!=='video'?'selected':''}>Foto</option><option value="video" ${p.hero_bg_type==='video'?'selected':''}>Video</option></select></div><div class="field"><label>URL del video</label><input name="hero_video_url" value="${esc(p.hero_video_url||'')}" placeholder="https://...mp4"></div></div><div class="field"><label>Subir video desde computadora</label><input type="file" class="dwv-page-video-file" accept="video/*"><button type="button" class="btn btn-dark btn-small dwv-upload-page-video">Subir video</button></div>`;const titleField=form.querySelector('.field:nth-of-type(2)')||form.firstChild;form.insertBefore(box,titleField);
        box.querySelector('.dwv-upload-page-video').onclick=async()=>{const btn=box.querySelector('.dwv-upload-page-video');try{btn.disabled=true;btn.textContent='Subiendo...';const url=await upload(box.querySelector('.dwv-page-video-file').files[0],`pages/${slug}`);box.querySelector('[name="hero_video_url"]').value=url;notify('Video subido. Pulsa Guardar sección para aplicar el cambio.')}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent='Subir video'}};
      }
    }

    async function enhanceOffers(){
      const form=view.querySelector('#offersPageForm'); if(!form||form.dataset.bgEnhanced)return; form.dataset.bgEnhanced='1';
      const {data:p}=await supabase.from('site_pages').select('hero_bg_type,hero_image_url,hero_video_url').eq('slug','ofertas-digitales').maybeSingle();
      const box=document.createElement('div');box.className='dwv-bg-extra';box.innerHTML=`<h4>Fondo de Accesos digitales</h4><div class="grid-2"><div class="field"><label>Tipo</label><select name="hero_bg_type"><option value="foto" ${p?.hero_bg_type!=='video'?'selected':''}>Foto</option><option value="video" ${p?.hero_bg_type==='video'?'selected':''}>Video</option></select></div><div class="field"><label>Foto de fondo</label><input name="hero_image_url" value="${esc(p?.hero_image_url||'')}" placeholder="https://..."></div></div><div class="field"><label>Video de fondo</label><input name="hero_video_url" value="${esc(p?.hero_video_url||'')}" placeholder="https://...mp4"></div><div class="grid-2"><div class="field"><label>Subir foto</label><input type="file" class="dwv-offer-bg-image" accept="image/*"><button type="button" class="btn btn-dark btn-small dwv-upload-offer-image">Subir foto</button></div><div class="field"><label>Subir video</label><input type="file" class="dwv-offer-bg-video" accept="video/*"><button type="button" class="btn btn-dark btn-small dwv-upload-offer-video">Subir video</button></div></div>`;form.appendChild(box);
      box.querySelector('.dwv-upload-offer-image').onclick=async()=>{try{const url=await upload(box.querySelector('.dwv-offer-bg-image').files[0],'offers/background');box.querySelector('[name="hero_image_url"]').value=url;notify('Foto subida. Guarda el encabezado para aplicar.')}catch(e){alert(e.message)}};
      box.querySelector('.dwv-upload-offer-video').onclick=async()=>{try{const url=await upload(box.querySelector('.dwv-offer-bg-video').files[0],'offers/background');box.querySelector('[name="hero_video_url"]').value=url;notify('Video subido. Guarda el encabezado para aplicar.')}catch(e){alert(e.message)}};
    }

    async function enhanceTrading(){
      const form=view.querySelector('#tradingSettingsForm');if(!form||form.dataset.bgEnhanced)return;form.dataset.bgEnhanced='1';
      const {data:t}=await supabase.from('trading_settings').select('cover_bg_type,cover_video_url').eq('id',1).maybeSingle();
      const cover=form.querySelector('[name="cover_url"]');if(cover)setLabel(cover,'Foto de fondo');
      const box=document.createElement('div');box.className='dwv-bg-extra';box.innerHTML=`<h4>Foto o video de fondo</h4><div class="grid-2"><div class="field"><label>Tipo</label><select name="cover_bg_type"><option value="foto" ${t?.cover_bg_type!=='video'?'selected':''}>Foto</option><option value="video" ${t?.cover_bg_type==='video'?'selected':''}>Video</option></select></div><div class="field"><label>URL del video</label><input name="cover_video_url" value="${esc(t?.cover_video_url||'')}" placeholder="https://...mp4"></div></div><div class="field"><label>Subir video desde computadora</label><input type="file" class="dwv-trading-video" accept="video/*"><button type="button" class="btn btn-dark btn-small dwv-upload-trading-video">Subir video</button></div>`;const coverField=cover?.closest('.field');coverField?.insertAdjacentElement('afterend',box);box.querySelector('.dwv-upload-trading-video').onclick=async()=>{try{const url=await upload(box.querySelector('.dwv-trading-video').files[0],'trading/background');box.querySelector('[name="cover_video_url"]').value=url;notify('Video subido. Guarda Trading para aplicar.')}catch(e){alert(e.message)}};
    }

  }
}
