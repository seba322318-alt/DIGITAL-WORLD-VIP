-- DIGITAL WORLD VIP — ACTUALIZACIÓN FINAL APROBADA
-- Ejecutar una sola vez en Supabase > SQL Editor ANTES de publicar esta actualización.
-- Es idempotente: usa IF NOT EXISTS y conserva los datos existentes.

create extension if not exists pgcrypto;

-- PORTADA PRINCIPAL
alter table public.site_settings add column if not exists hero_slogan text default 'TU MEJOR ALIADO';
alter table public.site_settings add column if not exists hero_video_enabled boolean default true;
alter table public.site_settings add column if not exists hero_video_url text default '';
alter table public.site_settings add column if not exists hero_poster_url text default '';

-- Conserva un título personalizado; si todavía está el valor inicial antiguo, mantiene la portada original.
update public.site_settings
set hero_title=coalesce(nullif(academy_name,''),'DIGITAL WORLD VIP')
where id=1 and (hero_title is null or btrim(hero_title)='' or hero_title='Aprende a crear y vender productos digitales');

-- CLASES + YOUTUBE + RECURSOS MÚLTIPLES
alter table public.lessons add column if not exists youtube_url text default '';
create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  resource_type text not null default 'file', title text default '', storage_path text,
  external_url text, original_name text default '', sort_order int default 10,
  active boolean default true, created_at timestamptz default now()
);
create index if not exists lesson_resources_lesson_idx on public.lesson_resources(lesson_id);
alter table public.lesson_resources enable row level security;

-- PÁGINAS EDITABLES: FOTO O VIDEO
create table if not exists public.site_pages (
  slug text primary key, label text default '', eyebrow text default '', title text default '', subtitle text default '',
  hero_image_url text default '', hero_bg_type text default 'foto', hero_video_url text default '',
  body_title text default '', body_text text default '', cta_title text default '', cta_text text default '',
  cta_button_text text default '', cta_button_url text default '', active boolean default true, updated_at timestamptz default now()
);
alter table public.site_pages add column if not exists label text default '';
alter table public.site_pages add column if not exists eyebrow text default '';
alter table public.site_pages add column if not exists title text default '';
alter table public.site_pages add column if not exists subtitle text default '';
alter table public.site_pages add column if not exists hero_image_url text default '';
alter table public.site_pages add column if not exists hero_bg_type text default 'foto';
alter table public.site_pages add column if not exists hero_video_url text default '';
alter table public.site_pages add column if not exists body_title text default '';
alter table public.site_pages add column if not exists body_text text default '';
alter table public.site_pages add column if not exists cta_title text default '';
alter table public.site_pages add column if not exists cta_text text default '';
alter table public.site_pages add column if not exists cta_button_text text default '';
alter table public.site_pages add column if not exists cta_button_url text default '';
alter table public.site_pages add column if not exists active boolean default true;
alter table public.site_pages add column if not exists updated_at timestamptz default now();

insert into public.site_pages(slug,label,eyebrow,title,subtitle,hero_bg_type,active) values
('home-marketing','Marketing de portada','ECOSISTEMA DIGITAL WORLD VIP','Conocimientos pensados para el mundo digital','Estrategia, contenido, ventas y herramientas para desarrollar proyectos digitales.','foto',true),
('viajes','Viajes e incentivos','EXPERIENCIAS DIGITAL WORLD VIP','Viajes, reconocimientos e incentivos','Conoce campañas y experiencias de reconocimiento.','foto',true),
('estilo-vida','Trabajo digital','LIBERTAD PARA CREAR','Aprende a trabajar y crear desde cualquier lugar','Herramientas y habilidades para crear desde cualquier lugar.','foto',true),
('ofertas-digitales','Accesos digitales','OFERTAS DIGITALES','Herramientas para potenciar tu mundo digital','Consulta opciones, precios y detalles.','foto',true)
on conflict(slug) do nothing;

create table if not exists public.site_cards (
  id uuid primary key default gen_random_uuid(), page_slug text not null references public.site_pages(slug) on delete cascade,
  badge text default '', title text default '', body text default '', image_url text default '', sort_order int default 10,
  active boolean default true, updated_at timestamptz default now()
);

-- ACCESOS DIGITALES
create table if not exists public.digital_offers (
  id uuid primary key default gen_random_uuid(), name text not null, subtitle text default '', image_url text default '',
  price_local numeric(12,2) default 0, price_usd numeric(12,2) default 0, details text[] default '{}',
  whatsapp_number text default '', whatsapp_message text default '', sort_order int default 10,
  active boolean default true, updated_at timestamptz default now()
);

-- TRADING: FOTO O VIDEO DE FONDO
create table if not exists public.trading_settings (
  id int primary key default 1 check(id=1), active boolean default true, eyebrow text default 'NUEVA ERA',
  title text default 'TRADING — LA ERA DIGITAL', subtitle text default '', description text default '',
  cover_url text default '', cover_bg_type text default 'foto', cover_video_url text default '',
  price_local numeric(12,2) default 0, price_usd numeric(12,2) default 0, whatsapp_number text default '',
  whatsapp_message text default '', button_text text default 'Información y pago por WhatsApp',
  login_title text default 'Acceso privado Trading', login_text text default '', disclaimer text default '', updated_at timestamptz default now()
);
insert into public.trading_settings(id) values(1) on conflict do nothing;
alter table public.trading_settings add column if not exists cover_bg_type text default 'foto';
alter table public.trading_settings add column if not exists cover_video_url text default '';

-- BUCKET PÚBLICO PARA IMÁGENES Y VIDEOS DEL DISEÑO
insert into storage.buckets(id,name,public) values('site-media','site-media',true)
on conflict(id) do update set public=true;

-- RLS PÚBLICO + ADMINISTRADOR
alter table public.site_pages enable row level security;
alter table public.site_cards enable row level security;
alter table public.digital_offers enable row level security;
alter table public.trading_settings enable row level security;

drop policy if exists "public site pages read" on public.site_pages;
create policy "public site pages read" on public.site_pages for select using(true);
drop policy if exists "admin site pages write" on public.site_pages;
create policy "admin site pages write" on public.site_pages for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "public site cards read" on public.site_cards;
create policy "public site cards read" on public.site_cards for select using(active=true or public.is_admin());
drop policy if exists "admin site cards write" on public.site_cards;
create policy "admin site cards write" on public.site_cards for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "public digital offers read" on public.digital_offers;
create policy "public digital offers read" on public.digital_offers for select using(active=true or public.is_admin());
drop policy if exists "admin digital offers write" on public.digital_offers;
create policy "admin digital offers write" on public.digital_offers for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "public trading settings read" on public.trading_settings;
create policy "public trading settings read" on public.trading_settings for select using(true);
drop policy if exists "admin trading settings write" on public.trading_settings;
create policy "admin trading settings write" on public.trading_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "admin site media all" on storage.objects;
create policy "admin site media all" on storage.objects for all to authenticated
using(bucket_id='site-media' and public.is_admin()) with check(bucket_id='site-media' and public.is_admin());

-- ACCESO ACUMULATIVO BRONCE -> ORO -> DIAMANTE
-- Sustituye las políticas de lectura por nivel máximo del alumno.
drop policy if exists "course access" on public.courses;
create policy "course access" on public.courses for select to authenticated using(
  public.is_admin() or exists(
    select 1 from public.plans requested join public.plans owned on owned.slug=public.my_plan()
    where requested.slug=courses.plan_slug and requested.level<=owned.level
  )
);
drop policy if exists "lesson access" on public.lessons;
create policy "lesson access" on public.lessons for select to authenticated using(
  public.is_admin() or exists(
    select 1 from public.courses c join public.plans requested on requested.slug=c.plan_slug
    join public.plans owned on owned.slug=public.my_plan()
    where c.id=lessons.course_id and requested.level<=owned.level
  )
);
drop policy if exists "lesson resources access" on public.lesson_resources;
create policy "lesson resources access" on public.lesson_resources for select to authenticated using(
  public.is_admin() or exists(
    select 1 from public.lessons l join public.courses c on c.id=l.course_id
    join public.plans requested on requested.slug=c.plan_slug join public.plans owned on owned.slug=public.my_plan()
    where l.id=lesson_resources.lesson_id and requested.level<=owned.level
  )
);
drop policy if exists "lesson resources admin write" on public.lesson_resources;
create policy "lesson resources admin write" on public.lesson_resources for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "student storage read" on storage.objects;
create policy "student storage read" on storage.objects for select to authenticated using(
  bucket_id='academy-files' and (
    public.is_admin() or exists(
      select 1 from public.plans requested join public.plans owned on owned.slug=public.my_plan()
      where requested.slug=(storage.foldername(storage.objects.name))[1] and requested.level<=owned.level
    )
  )
);

-- SOLO DOS FUNDADORES
with ordenados as (
  select id,row_number() over(order by sort_order asc nulls last,id asc) rn from public.founders
)
delete from public.founders f using ordenados o where f.id=o.id and o.rn>2;

-- Permisos necesarios
 grant select on public.site_pages,public.site_cards,public.digital_offers,public.trading_settings to anon,authenticated;
 grant insert,update,delete on public.site_pages,public.site_cards,public.digital_offers,public.trading_settings,public.lesson_resources to authenticated;
 grant select on public.lesson_resources to authenticated;
