import { loadPublicData,money,localMoney,waLink,escapeHtml } from './common.js';
const data=await loadPublicData(); const s=data.settings;
document.querySelector('#brandName').textContent=(s.academy_name||'Digital World VIP').toUpperCase();
document.querySelector('#heroTitle').innerHTML=escapeHtml(s.hero_title||'Aprende a crear y vender productos digitales');
document.querySelector('#heroSub').textContent=s.hero_subtitle||''; document.querySelector('#aboutText').textContent=s.about_text||''; document.querySelector('#year').textContent=new Date().getFullYear();
const planClasses={bronce:'badge-bronze',oro:'badge-gold',diamante:'badge-diamond'};
document.querySelector('#plans').innerHTML=data.plans.map((p,i)=>{
 const msg=`Hola, quiero adquirir la membresía ${p.name} de ${s.academy_name||'Digital World VIP'}. Quiero información para realizar el pago por transferencia.`;
 const link=waLink(s.whatsapp,msg); const disabled=link==='#';
 return `<article class="plan-card ${p.slug==='oro'?'featured':''}"><span class="plan-badge ${planClasses[p.slug]||'badge-gold'}">${escapeHtml(p.name)}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||'')}</p><div class="price"><strong>${localMoney(p.price_local)}</strong><small>Precio en pesos • moneda configurable</small></div><div class="price"><strong>${money(p.price_usd,'USD')}</strong><small>Precio en dólares</small></div><ul class="features">${(p.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul><div style="display:grid;gap:9px"><a class="btn btn-dark full" href="/membresia.html?plan=${encodeURIComponent(p.slug)}">Ver contenido</a><a class="btn btn-primary full" ${disabled?'href="#" onclick="alert(\'Configura el número de WhatsApp desde el panel administrador.\');return false"':`href="${link}" target="_blank" rel="noopener"`}>Solicitar por WhatsApp</a></div></article>`
}).join('');
document.querySelector('#founders').innerHTML=data.founders.slice(0,4).map(f=>`<article class="founder"><div class="founder-photo">${f.photo_url?`<img src="${escapeHtml(f.photo_url)}" alt="${escapeHtml(f.name)}" style="width:100%;height:100%;object-fit:cover">`:'Foto del fundador'}</div><div class="founder-body"><h4>${escapeHtml(f.name)}</h4><div class="role">${escapeHtml(f.role||'Co-fundador')}</div><p>${escapeHtml(f.bio||'')}</p></div></article>`).join('');
