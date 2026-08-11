import { supabase,configured } from './supabase-client.js';
import { getSession,getProfile,logout,escapeHtml } from './common.js';

if(!configured) location.href='/login.html';
const session=await getSession();
if(!session) location.href='/login.html';

const profile=await getProfile();
if(!profile||!profile.active) location.href='/login.html';
if(profile.role==='admin') location.href='/admin.html';

document.querySelector('#welcome').textContent=`Hola, ${profile.full_name||'Alumno'}`;
document.querySelector('#logoutBtn').onclick=logout;

const {data:plans}=await supabase.from('plans').select('slug,name,level').eq('active',true).order('level');
const ownPlan=(plans||[]).find(p=>p.slug===profile.plan_slug);
const ownLevel=Number(ownPlan?.level||0);
const allowedPlans=(plans||[]).filter(p=>Number(p.level)<=ownLevel).sort((a,b)=>a.level-b.level);
const allowedSlugs=allowedPlans.map(p=>p.slug);

document.querySelector('#membership').textContent=allowedPlans.length
  ? `Acceso: ${allowedPlans.map(p=>p.name).join(' + ')}`
  : 'Sin membresía asignada';

const content=document.querySelector('#content');
if(!allowedSlugs.length){
  content.innerHTML='<div class="notice error">Tu cuenta no tiene una membresía activa asignada. Contacta al administrador.</div>';
}else{
  const {data:courses,error}=await supabase
    .from('courses')
    .select('*,lessons(*,lesson_resources(*))')
    .in('plan_slug',allowedSlugs)
    .order('sort_order');

  if(error){
    content.innerHTML=`<div class="notice error">${escapeHtml(error.message)}</div>`;
  }else if(!courses?.length){
    content.innerHTML='<div class="panel"><h2>Contenido próximamente</h2><p style="color:#9ea8b8">El administrador todavía no ha publicado módulos para tus membresías.</p></div>';
  }else{
    for(const plan of allowedPlans){
      const planCourses=(courses||[]).filter(c=>c.plan_slug===plan.slug);
      if(!planCourses.length) continue;
      const section=document.createElement('section');
      section.className=`academy-plan-section academy-${plan.slug}`;
      section.innerHTML=`<div class="academy-plan-head"><div><div class="eyebrow">Membresía incluida</div><h2>${escapeHtml(plan.name)}</h2></div><span class="plan-access-chip">Acceso habilitado</span></div>`;

      for(const c of planCourses){
        const block=document.createElement('section');
        block.className='panel course-premium';
        const lessons=(c.lessons||[]).filter(l=>l.published).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));
        block.innerHTML=`<div class="course-heading"><div><div class="eyebrow">Módulo</div><h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.description||'')}</p></div><span>${lessons.length} clase${lessons.length===1?'':'s'}</span></div><div class="lesson-list"></div>`;
        const list=block.querySelector('.lesson-list');

        for(const l of lessons){
          const el=document.createElement('article');
          el.className='lesson lesson-premium';
          el.innerHTML=`<div class="lesson-title-row"><div><span class="lesson-kicker">CLASE</span><h3>${escapeHtml(l.title)}</h3></div></div><p>${escapeHtml(l.description||'')}</p><div class="lesson-video-area"></div><div class="lesson-resources-area"></div>`;
          const videoArea=el.querySelector('.lesson-video-area');
          const resourcesArea=el.querySelector('.lesson-resources-area');
          renderLessonVideo(videoArea,l);
          await renderResources(resourcesArea,(l.lesson_resources||[]).filter(r=>r.active).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)));
          list.appendChild(el);
        }
        section.appendChild(block);
      }
      content.appendChild(section);
    }
  }
}

function youtubeId(url=''){
  try{
    const u=new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0]||'';
    if(u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2]||'';
    if(u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2]||'';
    return u.searchParams.get('v')||'';
  }catch{return ''}
}

function renderLessonVideo(host,l){
  const yid=youtubeId(l.youtube_url||'');
  if(l.video_path){
    const card=document.createElement('div');
    card.className='video-player-shell';
    card.innerHTML=`<div class="video-placeholder"><div class="play-orb">▶</div><h4>Video de la clase</h4><p>Reproduce el contenido directamente dentro de Digital World VIP.</p><button class="btn btn-primary btn-small">Reproducir</button></div>`;
    card.querySelector('button').onclick=async()=>{
      const {data,error}=await supabase.storage.from('academy-files').createSignedUrl(l.video_path,3600);
      if(error){alert(error.message);return}
      card.innerHTML=`<video class="academy-video" controls controlsList="nodownload" playsinline src="${data.signedUrl}"></video>`;
    };
    host.appendChild(card);
  }
  if(yid){
    const wrap=document.createElement('div');
    wrap.className='youtube-embed';
    wrap.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yid)}?rel=0&modestbranding=1" title="${escapeHtml(l.title||'Video de YouTube')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
    host.appendChild(wrap);
  }
  if(!l.video_path&&!yid){
    host.innerHTML='<div class="lesson-no-video">Esta clase no tiene video publicado.</div>';
  }
}

async function renderResources(host,resources){
  if(!resources.length){host.innerHTML='';return}
  host.innerHTML='<div class="resources-heading"><span>Materiales de apoyo</span><small>Archivos disponibles para esta clase</small></div><div class="resource-grid"></div>';
  const grid=host.querySelector('.resource-grid');
  for(const r of resources){
    if(r.resource_type==='image'&&r.storage_path){
      const {data,error}=await supabase.storage.from('academy-files').createSignedUrl(r.storage_path,3600);
      if(error) continue;
      const a=document.createElement('a');
      a.className='resource-image-card';a.href=data.signedUrl;a.target='_blank';a.rel='noopener';
      a.innerHTML=`<img src="${data.signedUrl}" alt="${escapeHtml(r.title||'Imagen de apoyo')}" loading="lazy"><div><b>${escapeHtml(r.title||'Imagen')}</b><span>Ver imagen</span></div>`;
      grid.appendChild(a);continue;
    }
    if(r.resource_type==='link'&&r.external_url){
      const a=document.createElement('a');a.className='resource-file-card';a.href=r.external_url;a.target='_blank';a.rel='noopener noreferrer';a.innerHTML=`<span class="resource-icon">↗</span><div><b>${escapeHtml(r.title||'Enlace')}</b><small>Abrir recurso</small></div>`;grid.appendChild(a);continue;
    }
    if(r.storage_path){
      const downloadName=r.original_name||true;
      const {data,error}=await supabase.storage.from('academy-files').createSignedUrl(r.storage_path,3600,{download:downloadName});
      if(error) continue;
      const a=document.createElement('a');a.className=`resource-file-card resource-${r.resource_type}`;a.href=data.signedUrl;a.target='_blank';a.rel='noopener';
      const icon=r.resource_type==='apk'?'APK':'DOC';
      a.innerHTML=`<span class="resource-icon">${icon}</span><div><b>${escapeHtml(r.title||r.original_name||'Recurso')}</b><small>${r.resource_type==='apk'?'Descargar aplicación Android':'Abrir o descargar archivo'}</small></div>`;
      grid.appendChild(a);
    }
  }
}
