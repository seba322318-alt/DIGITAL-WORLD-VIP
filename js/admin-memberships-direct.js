import { supabase, configured } from './supabase-client.js';
import { getSession, getProfile } from './common.js';

if (!configured) throw new Error('Supabase no está configurado.');
const session = await getSession();
const profile = session ? await getProfile() : null;
if (!session || !profile || profile.role !== 'admin') {
  // admin.js ya hace la redirección. Este módulo no expone herramientas a alumnos.
} else {
  const view = document.querySelector('#view');
  const modalHost = document.querySelector('#modal');
  const flash = document.querySelector('#flash');

  injectStyles();
  const observer = new MutationObserver(() => enhanceMembershipCards());
  observer.observe(view, { childList: true, subtree: true });
  enhanceMembershipCards();

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function safeName(name = 'archivo') {
    return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  function notify(text, type = 'ok') {
    if (!flash) return;
    flash.textContent = text;
    flash.className = `notice ${type}`;
    flash.classList.remove('hidden');
    setTimeout(() => flash.classList.add('hidden'), 5000);
  }

  function showModal(html) {
    modalHost.innerHTML = `<div class="modal-backdrop direct-modal-backdrop"><div class="modal direct-modal">${html}</div></div>`;
    modalHost.classList.remove('hidden');
    modalHost.querySelectorAll('[data-direct-close]').forEach(btn => btn.onclick = () => modalHost.classList.add('hidden'));
    modalHost.querySelector('.direct-modal-backdrop')?.addEventListener('click', e => {
      if (e.target.classList.contains('direct-modal-backdrop')) modalHost.classList.add('hidden');
    });
  }

  function enhanceMembershipCards() {
    view.querySelectorAll('.plan-form[data-slug]').forEach(form => {
      if (form.querySelector('.direct-content-tools')) return;
      const slug = form.dataset.slug;
      const nameInput = form.querySelector('input[name="name"]');
      const planName = nameInput?.value?.trim() || slug;
      const box = document.createElement('div');
      box.className = 'direct-content-tools';
      box.innerHTML = `
        <div class="direct-content-title">CONTENIDO DE LA MEMBRESÍA</div>
        <p>Agrega clases, videos y materiales sin salir de ${esc(planName)}.</p>
        <button type="button" class="btn btn-primary full direct-add-content">＋ AGREGAR CONTENIDO</button>
        <button type="button" class="btn btn-dark full direct-manage-content">VER / ADMINISTRAR CONTENIDO</button>
      `;
      form.appendChild(box);
      box.querySelector('.direct-add-content').onclick = () => openAddContent(slug, nameInput?.value?.trim() || planName);
      box.querySelector('.direct-manage-content').onclick = () => openMembershipContent(slug, nameInput?.value?.trim() || planName);
    });
  }

  async function getCourses(slug) {
    const { data, error } = await supabase.from('courses').select('*').eq('plan_slug', slug).order('sort_order');
    if (error) throw error;
    return data || [];
  }

  async function uploadPrivateFile(file, slug, folder) {
    if (!file) throw new Error('Selecciona un archivo.');
    const path = `${slug}/${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
    const { error } = await supabase.storage.from('academy-files').upload(path, file, {
      upsert: false,
      contentType: file.type || undefined
    });
    if (error) throw error;
    return path;
  }

  function classifyResource(file) {
    const lower = file.name.toLowerCase();
    if (file.type?.startsWith('image/')) return 'image';
    if (lower.endsWith('.apk')) return 'apk';
    return 'file';
  }

  function validateYoutube(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      if (!['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
        throw new Error('La URL debe ser de YouTube.');
      }
      return url;
    } catch (e) {
      throw new Error(e.message === 'La URL debe ser de YouTube.' ? e.message : 'La URL de YouTube no es válida.');
    }
  }

  async function openAddContent(slug, planName, presetCourseId = '') {
    let courses;
    try {
      courses = await getCourses(slug);
    } catch (err) {
      notify(err.message, 'error');
      return;
    }

    const defaultCourse = presetCourseId || courses[0]?.id || '__new__';
    showModal(`
      <div class="direct-modal-head">
        <div><div class="eyebrow">${esc(planName)}</div><h2>Agregar contenido</h2><p>Video y materiales en un solo paso.</p></div>
        <button type="button" data-direct-close class="btn btn-dark btn-small">Cerrar</button>
      </div>
      <form id="directContentForm">
        <div class="direct-step"><span>1</span><b>¿Dónde irá esta clase?</b></div>
        <div class="field">
          <label>Módulo</label>
          <select id="dcCourse">
            ${courses.map(c => `<option value="${esc(c.id)}" ${defaultCourse === c.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}
            <option value="__new__" ${defaultCourse === '__new__' ? 'selected' : ''}>＋ Crear nuevo módulo</option>
          </select>
        </div>
        <div id="dcNewModuleWrap" class="direct-new-module hidden">
          <div class="field"><label>Nombre del nuevo módulo</label><input id="dcNewModule" value="Contenido de ${esc(planName)}" placeholder="Ej. Marketing desde cero"></div>
          <div class="field"><label>Descripción del módulo</label><textarea id="dcNewModuleDesc" placeholder="Descripción breve del módulo"></textarea></div>
        </div>

        <div class="direct-step"><span>2</span><b>Clase / video</b></div>
        <div class="field"><label>Título</label><input id="dcTitle" required placeholder="Ej. Introducción al marketing digital"></div>
        <div class="field"><label>Descripción</label><textarea id="dcDesc" placeholder="Explica brevemente qué aprenderá el alumno"></textarea></div>
        <div class="field">
          <label>Origen del video</label>
          <select id="dcVideoType">
            <option value="youtube">URL de YouTube</option>
            <option value="upload">Subir video desde la computadora</option>
            <option value="none">Sin video</option>
          </select>
        </div>
        <div class="field" id="dcYoutubeWrap"><label>URL de YouTube</label><input id="dcYoutube" type="url" placeholder="https://www.youtube.com/watch?v=..."></div>
        <div class="field hidden" id="dcVideoFileWrap"><label>Video del escritorio</label><input id="dcVideoFile" type="file" accept="video/*"><small>MP4 u otro formato compatible con navegador.</small></div>

        <div class="direct-step"><span>3</span><b>Materiales descargables</b></div>
        <div class="field">
          <label>PDF, Word, imágenes, ZIP o APK</label>
          <input id="dcResources" type="file" multiple accept=".pdf,.doc,.docx,.zip,.apk,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
          <small>Puedes seleccionar varios archivos al mismo tiempo.</small>
        </div>
        <div id="dcSelectedFiles" class="direct-file-preview">Ningún archivo seleccionado.</div>

        <div class="grid-2">
          <div class="field"><label>Publicar ahora</label><select id="dcPublished"><option value="true">Sí, visible para alumnos</option><option value="false">No, dejar oculta</option></select></div>
          <div class="field"><label>Orden</label><input id="dcOrder" type="number" value="10" min="0"></div>
        </div>
        <button id="dcSave" class="btn btn-primary full">GUARDAR CONTENIDO</button>
        <div id="dcState" class="notice hidden" style="margin-top:12px"></div>
      </form>
    `);

    const courseSelect = document.querySelector('#dcCourse');
    const newWrap = document.querySelector('#dcNewModuleWrap');
    const videoType = document.querySelector('#dcVideoType');
    const youtubeWrap = document.querySelector('#dcYoutubeWrap');
    const videoFileWrap = document.querySelector('#dcVideoFileWrap');
    const resourcesInput = document.querySelector('#dcResources');
    const selectedFiles = document.querySelector('#dcSelectedFiles');

    const syncCourse = () => newWrap.classList.toggle('hidden', courseSelect.value !== '__new__');
    const syncVideo = () => {
      youtubeWrap.classList.toggle('hidden', videoType.value !== 'youtube');
      videoFileWrap.classList.toggle('hidden', videoType.value !== 'upload');
    };
    courseSelect.onchange = syncCourse;
    videoType.onchange = syncVideo;
    syncCourse(); syncVideo();

    resourcesInput.onchange = () => {
      const files = [...resourcesInput.files];
      selectedFiles.innerHTML = files.length
        ? files.map(f => `<span>${esc(f.name)}</span>`).join('')
        : 'Ningún archivo seleccionado.';
    };

    document.querySelector('#directContentForm').onsubmit = async e => {
      e.preventDefault();
      const saveBtn = document.querySelector('#dcSave');
      const state = document.querySelector('#dcState');
      saveBtn.disabled = true;
      state.textContent = 'Guardando contenido...';
      state.className = 'notice';
      try {
        let courseId = courseSelect.value;
        if (courseId === '__new__') {
          const moduleTitle = document.querySelector('#dcNewModule').value.trim();
          if (!moduleTitle) throw new Error('Escribe el nombre del módulo.');
          const { data: created, error } = await supabase.from('courses').insert({
            plan_slug: slug,
            title: moduleTitle,
            description: document.querySelector('#dcNewModuleDesc').value.trim(),
            sort_order: 10
          }).select('id').single();
          if (error) throw error;
          courseId = created.id;
        }

        let video_path = null;
        let youtube_url = '';
        if (videoType.value === 'youtube') {
          youtube_url = validateYoutube(document.querySelector('#dcYoutube').value.trim());
          if (!youtube_url) throw new Error('Pega la URL del video de YouTube.');
        }
        if (videoType.value === 'upload') {
          const video = document.querySelector('#dcVideoFile').files[0];
          if (!video) throw new Error('Selecciona el video de tu computadora.');
          state.textContent = 'Subiendo video...';
          video_path = await uploadPrivateFile(video, slug, 'videos');
        }

        state.textContent = 'Creando la clase...';
        const lessonObj = {
          course_id: courseId,
          title: document.querySelector('#dcTitle').value.trim(),
          description: document.querySelector('#dcDesc').value.trim(),
          video_path,
          youtube_url,
          published: document.querySelector('#dcPublished').value === 'true',
          sort_order: Number(document.querySelector('#dcOrder').value || 10)
        };
        const { data: lesson, error: lessonError } = await supabase.from('lessons').insert(lessonObj).select('id').single();
        if (lessonError) throw lessonError;

        const files = [...resourcesInput.files];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          state.textContent = `Subiendo material ${i + 1} de ${files.length}: ${file.name}`;
          const resource_type = classifyResource(file);
          const storage_path = await uploadPrivateFile(file, slug, 'resources');
          const { error } = await supabase.from('lesson_resources').insert({
            lesson_id: lesson.id,
            resource_type,
            title: file.name.replace(/\.[^.]+$/, ''),
            storage_path,
            external_url: null,
            original_name: file.name,
            sort_order: (i + 1) * 10,
            active: true
          });
          if (error) throw error;
        }

        modalHost.classList.add('hidden');
        notify(`Contenido agregado correctamente a ${planName}.`);
        openMembershipContent(slug, planName);
      } catch (err) {
        state.textContent = `${err.message}${String(err.message).includes('youtube_url') || String(err.message).includes('lesson_resources') ? ' — Ejecuta primero el SQL incluido en el paquete.' : ''}`;
        state.className = 'notice error';
      } finally {
        saveBtn.disabled = false;
      }
    };
  }

  async function openMembershipContent(slug, planName) {
    showModal(`<div class="direct-modal-head"><div><div class="eyebrow">${esc(planName)}</div><h2>Contenido de la membresía</h2></div><button data-direct-close class="btn btn-dark btn-small">Cerrar</button></div><div class="notice">Cargando...</div>`);
    const { data: courses, error } = await supabase.from('courses').select('*,lessons(*,lesson_resources(*))').eq('plan_slug', slug).order('sort_order');
    if (error) {
      modalHost.querySelector('.direct-modal').innerHTML = `<button data-direct-close class="btn btn-dark btn-small" style="float:right">Cerrar</button><h2>No se pudo cargar</h2><div class="notice error">${esc(error.message)}. Si la tabla de recursos todavía no existe, ejecuta el SQL incluido en el paquete.</div>`;
      modalHost.querySelector('[data-direct-close]').onclick = () => modalHost.classList.add('hidden');
      return;
    }

    const body = (courses || []).map(c => {
      const lessons = [...(c.lessons || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      return `
        <section class="direct-course">
          <div class="direct-course-head">
            <div><span class="tag">Módulo</span><h3>${esc(c.title)}</h3><p>${esc(c.description || '')}</p></div>
            <button class="btn btn-primary btn-small direct-add-to-course" data-course="${esc(c.id)}">＋ Clase</button>
          </div>
          <div class="direct-lessons">
            ${lessons.length ? lessons.map(l => {
              const rcount = (l.lesson_resources || []).length;
              const video = l.video_path ? 'Video subido' : l.youtube_url ? 'YouTube' : 'Sin video';
              return `<div class="direct-lesson-row">
                <div><b>${esc(l.title)}</b><div class="admin-lesson-meta">${video} · ${rcount} material${rcount === 1 ? '' : 'es'} · ${l.published ? 'Publicada' : 'Oculta'}</div></div>
                <div class="toolbar"><button class="btn btn-dark btn-small direct-edit-lesson" data-id="${l.id}" data-course="${c.id}">Editar</button><button class="btn btn-primary btn-small direct-resources" data-id="${l.id}" data-title="${esc(l.title)}">Materiales</button><button class="btn btn-danger btn-small direct-delete-lesson" data-id="${l.id}">Eliminar</button></div>
              </div>`;
            }).join('') : '<div class="notice">Este módulo todavía no tiene clases.</div>'}
          </div>
        </section>`;
    }).join('');

    modalHost.querySelector('.direct-modal').innerHTML = `
      <div class="direct-modal-head"><div><div class="eyebrow">${esc(planName)}</div><h2>Contenido de la membresía</h2><p>Todo lo que verá el alumno en este nivel.</p></div><button data-direct-close class="btn btn-dark btn-small">Cerrar</button></div>
      <button id="directNewContent" class="btn btn-primary full" style="margin-bottom:16px">＋ AGREGAR NUEVO CONTENIDO</button>
      ${body || '<div class="notice">Todavía no hay módulos ni clases en esta membresía.</div>'}
    `;
    modalHost.querySelector('[data-direct-close]').onclick = () => modalHost.classList.add('hidden');
    modalHost.querySelector('#directNewContent').onclick = () => openAddContent(slug, planName);
    modalHost.querySelectorAll('.direct-add-to-course').forEach(b => b.onclick = () => openAddContent(slug, planName, b.dataset.course));
    modalHost.querySelectorAll('.direct-edit-lesson').forEach(b => {
      const course = (courses || []).find(c => c.id === b.dataset.course);
      const lesson = (course?.lessons || []).find(l => l.id === b.dataset.id);
      if (lesson) b.onclick = () => openEditLesson(slug, planName, course, lesson);
    });
    modalHost.querySelectorAll('.direct-resources').forEach(b => b.onclick = () => openResources(slug, planName, b.dataset.id, b.dataset.title));
    modalHost.querySelectorAll('.direct-delete-lesson').forEach(b => b.onclick = async () => {
      if (!confirm('¿Eliminar esta clase y todos sus materiales?')) return;
      const { error } = await supabase.from('lessons').delete().eq('id', b.dataset.id);
      if (error) return alert(error.message);
      notify('Clase eliminada.');
      openMembershipContent(slug, planName);
    });
  }

  function openEditLesson(slug, planName, course, lesson) {
    showModal(`
      <div class="direct-modal-head"><div><div class="eyebrow">${esc(planName)}</div><h2>Editar clase</h2></div><button data-direct-close class="btn btn-dark btn-small">Cerrar</button></div>
      <form id="directEditForm">
        <div class="field"><label>Título</label><input id="deTitle" required value="${esc(lesson.title || '')}"></div>
        <div class="field"><label>Descripción</label><textarea id="deDesc">${esc(lesson.description || '')}</textarea></div>
        <div class="field"><label>URL de YouTube</label><input id="deYoutube" type="url" value="${esc(lesson.youtube_url || '')}" placeholder="https://www.youtube.com/watch?v=..."></div>
        <div class="field"><label>Reemplazar / agregar video desde computadora</label><input id="deVideo" type="file" accept="video/*">${lesson.video_path ? '<small>Ya existe un video subido. Si eliges otro será reemplazado.</small>' : ''}</div>
        ${lesson.video_path ? '<div class="field"><label>Video subido actual</label><select id="deRemove"><option value="false">Conservar</option><option value="true">Eliminar</option></select></div>' : ''}
        <div class="grid-2"><div class="field"><label>Estado</label><select id="dePublished"><option value="true" ${lesson.published ? 'selected' : ''}>Publicada</option><option value="false" ${!lesson.published ? 'selected' : ''}>Oculta</option></select></div><div class="field"><label>Orden</label><input id="deOrder" type="number" value="${Number(lesson.sort_order || 10)}"></div></div>
        <button id="deSave" class="btn btn-primary full">GUARDAR CAMBIOS</button><div id="deState" class="notice hidden" style="margin-top:12px"></div>
      </form>
    `);
    document.querySelector('#directEditForm').onsubmit = async e => {
      e.preventDefault();
      const state = document.querySelector('#deState');
      const btn = document.querySelector('#deSave');
      btn.disabled = true; state.textContent = 'Guardando...'; state.className = 'notice';
      try {
        let video_path = lesson.video_path || null;
        const newVideo = document.querySelector('#deVideo').files[0];
        if (newVideo) {
          const newPath = await uploadPrivateFile(newVideo, slug, 'videos');
          if (video_path) await supabase.storage.from('academy-files').remove([video_path]);
          video_path = newPath;
        } else if (lesson.video_path && document.querySelector('#deRemove')?.value === 'true') {
          await supabase.storage.from('academy-files').remove([lesson.video_path]);
          video_path = null;
        }
        const youtube = document.querySelector('#deYoutube').value.trim();
        if (youtube) validateYoutube(youtube);
        const { error } = await supabase.from('lessons').update({
          title: document.querySelector('#deTitle').value.trim(),
          description: document.querySelector('#deDesc').value.trim(),
          youtube_url: youtube,
          video_path,
          published: document.querySelector('#dePublished').value === 'true',
          sort_order: Number(document.querySelector('#deOrder').value || 10)
        }).eq('id', lesson.id);
        if (error) throw error;
        notify('Clase actualizada.');
        openMembershipContent(slug, planName);
      } catch (err) {
        state.textContent = err.message; state.className = 'notice error';
      } finally { btn.disabled = false; }
    };
  }

  async function openResources(slug, planName, lessonId, lessonTitle) {
    const { data: resources, error } = await supabase.from('lesson_resources').select('*').eq('lesson_id', lessonId).order('sort_order');
    if (error) return alert(error.message);
    showModal(`
      <div class="direct-modal-head"><div><div class="eyebrow">${esc(planName)}</div><h2>Materiales</h2><p>${esc(lessonTitle)}</p></div><button data-direct-close class="btn btn-dark btn-small">Cerrar</button></div>
      <form id="directResourceForm" class="direct-resource-form">
        <div class="field"><label>Título del material</label><input id="drTitle" placeholder="Opcional: si está vacío se usa el nombre del archivo"></div>
        <div class="field"><label>Archivo</label><input id="drFile" type="file" required accept=".pdf,.doc,.docx,.zip,.apk,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></div>
        <button id="drSave" class="btn btn-primary full">＋ AGREGAR MATERIAL</button><div id="drState" class="notice hidden" style="margin-top:10px"></div>
      </form>
      <div class="direct-resource-list">
        ${(resources || []).map(r => `<div class="direct-resource-row"><div><span class="tag">${esc(r.resource_type)}</span><b>${esc(r.title || r.original_name || 'Material')}</b><small>${esc(r.original_name || '')}</small></div><button class="btn btn-danger btn-small drDelete" data-id="${r.id}" data-path="${esc(r.storage_path || '')}">Eliminar</button></div>`).join('') || '<div class="notice">No hay materiales todavía.</div>'}
      </div>
    `);
    document.querySelector('#directResourceForm').onsubmit = async e => {
      e.preventDefault();
      const state = document.querySelector('#drState'), btn = document.querySelector('#drSave');
      btn.disabled = true; state.textContent = 'Subiendo material...'; state.className = 'notice';
      try {
        const file = document.querySelector('#drFile').files[0];
        const resource_type = classifyResource(file);
        const storage_path = await uploadPrivateFile(file, slug, 'resources');
        const title = document.querySelector('#drTitle').value.trim() || file.name.replace(/\.[^.]+$/, '');
        const { error } = await supabase.from('lesson_resources').insert({ lesson_id: lessonId, resource_type, title, storage_path, original_name: file.name, sort_order: 10, active: true });
        if (error) throw error;
        notify('Material agregado.');
        openResources(slug, planName, lessonId, lessonTitle);
      } catch (err) { state.textContent = err.message; state.className = 'notice error'; }
      finally { btn.disabled = false; }
    };
    document.querySelectorAll('.drDelete').forEach(b => b.onclick = async () => {
      if (!confirm('¿Eliminar este material?')) return;
      const { error } = await supabase.from('lesson_resources').delete().eq('id', b.dataset.id);
      if (error) return alert(error.message);
      if (b.dataset.path) await supabase.storage.from('academy-files').remove([b.dataset.path]);
      notify('Material eliminado.');
      openResources(slug, planName, lessonId, lessonTitle);
    });
  }

  function injectStyles() {
    if (document.querySelector('#directMembershipStyles')) return;
    const style = document.createElement('style');
    style.id = 'directMembershipStyles';
    style.textContent = `
      .direct-content-tools{margin-top:18px;padding-top:18px;border-top:1px solid #303744;display:grid;gap:10px}
      .direct-content-tools .direct-content-title{font-size:11px;font-weight:900;letter-spacing:1.2px;color:#f2ca65}
      .direct-content-tools p{margin:0 0 3px!important;color:#8f99a8!important;font-size:12px!important}
      .direct-modal{width:min(880px,96vw)!important;max-height:92vh!important}
      .direct-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:15px;border-bottom:1px solid #2a3240}
      .direct-modal-head h2{margin:4px 0 4px}.direct-modal-head p{margin:0;color:#929cab}
      .direct-step{display:flex;align-items:center;gap:10px;margin:20px 0 12px;color:#f4d173;font-size:13px;text-transform:uppercase;letter-spacing:.6px}
      .direct-step span{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#241d0c;border:1px solid #70531b;color:#ffd46a}
      .direct-new-module{padding:14px;border:1px solid #303846;border-radius:12px;background:#090d13;margin-bottom:12px}
      .direct-file-preview{display:flex;flex-wrap:wrap;gap:7px;padding:10px 0;color:#8993a3;font-size:12px}.direct-file-preview span{padding:6px 9px;border:1px solid #303846;border-radius:999px;background:#0a0f16;color:#cbd2dc}
      .direct-course{border:1px solid #2c3542;border-radius:15px;background:#0a0e14;margin:13px 0;overflow:hidden}.direct-course-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:17px}.direct-course-head h3{margin:7px 0 3px}.direct-course-head p{margin:0;color:#8e98a7;font-size:13px}.direct-lessons{border-top:1px solid #252d39}.direct-lesson-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px 17px;border-bottom:1px solid #222936}.direct-lesson-row:last-child{border-bottom:0}
      .direct-resource-form{padding:14px;border:1px solid #2c3542;border-radius:14px;background:#090d13;margin-bottom:15px}.direct-resource-list{display:grid;gap:8px}.direct-resource-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 13px;background:#0a0f16;border:1px solid #293340;border-radius:12px}.direct-resource-row>div{display:grid;grid-template-columns:auto 1fr;gap:3px 9px;align-items:center}.direct-resource-row small{grid-column:2;color:#7f8998}
      @media(max-width:720px){.direct-modal-head,.direct-course-head,.direct-lesson-row,.direct-resource-row{flex-direction:column;align-items:stretch}.direct-lesson-row .toolbar{width:100%}.direct-lesson-row .toolbar .btn{flex:1}}
    `;
    document.head.appendChild(style);
  }
}
