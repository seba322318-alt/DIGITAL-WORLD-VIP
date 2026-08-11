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
    .select('*,lessons(*)')
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
      section.style.marginBottom='28px';
      section.innerHTML=`<div class="main-head"><div><div class="eyebrow">Membresía incluida</div><h2>${escapeHtml(plan.name)}</h2></div></div>`;

      for(const c of planCourses){
        const block=document.createElement('section');
        block.className='panel';
        block.style.marginBottom='18px';
        const lessons=(c.lessons||[]).filter(l=>l.published).sort((a,b)=>a.sort_order-b.sort_order);
        block.innerHTML=`<div class="eyebrow">Módulo</div><h2>${escapeHtml(c.title)}</h2><p style="color:#9ea8b8">${escapeHtml(c.description||'')}</p><div class="lesson-list"></div>`;
        const list=block.querySelector('.lesson-list');

        for(const l of lessons){
          const el=document.createElement('article');
          el.className='lesson';
          el.innerHTML=`<h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(l.description||'')}</p><div class="media-actions toolbar"></div><div class="video hidden"></div>`;
          const actions=el.querySelector('.media-actions');
          const video=el.querySelector('.video');

          if(l.video_path){
            const b=document.createElement('button');
            b.className='btn btn-dark btn-small';
            b.textContent='Ver video';
            b.onclick=async()=>{
              const {data,error}=await supabase.storage.from('academy-files').createSignedUrl(l.video_path,3600);
              if(error){alert(error.message);return}
              if(data?.signedUrl){video.innerHTML=`<video controls controlsList="nodownload" src="${data.signedUrl}"></video>`;video.classList.remove('hidden')}
            };
            actions.appendChild(b);
          }

          if(l.file_path){
            const b=document.createElement('button');
            b.className='btn btn-dark btn-small';
            b.textContent='Abrir archivo';
            b.onclick=async()=>{
              const {data,error}=await supabase.storage.from('academy-files').createSignedUrl(l.file_path,3600,{download:false});
              if(error){alert(error.message);return}
              if(data?.signedUrl) window.open(data.signedUrl,'_blank');
            };
            actions.appendChild(b);
          }
          list.appendChild(el);
        }
        section.appendChild(block);
      }
      content.appendChild(section);
    }
  }
}
