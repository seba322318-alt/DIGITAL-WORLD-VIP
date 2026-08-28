import { supabase, configured } from './supabase-client.js';

if(configured){
  const path=location.pathname.replace(/\/+$/,'')||'/';
  const slug=path==='/'||path.endsWith('/index.html')?'home':
    path.endsWith('/viajes.html')?'viajes':
    path.endsWith('/estilo-vida.html')?'estilo-vida':
    path.endsWith('/ofertas.html')?'ofertas':
    path.endsWith('/trading.html')?'trading':null;

  if(slug){
    const {data}=await supabase.from('seo_settings').select('*').eq('page_slug',slug).maybeSingle();
    if(data){
      if(data.seo_title) document.title=data.seo_title;
      let desc=document.querySelector('meta[name="description"]');
      if(!desc){desc=document.createElement('meta');desc.name='description';document.head.appendChild(desc)}
      if(data.seo_description) desc.content=data.seo_description;

      let canonical=document.querySelector('link[rel="canonical"]');
      if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical)}
      canonical.href=data.canonical_url||location.origin+location.pathname;

      function metaProp(prop,value){
        if(!value)return;
        let el=document.querySelector(`meta[property="${prop}"]`);
        if(!el){el=document.createElement('meta');el.setAttribute('property',prop);document.head.appendChild(el)}
        el.content=value;
      }
      metaProp('og:title',data.seo_title);
      metaProp('og:description',data.seo_description);
      metaProp('og:url',data.canonical_url||location.href);
    }
  }
}