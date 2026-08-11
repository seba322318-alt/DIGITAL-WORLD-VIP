import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.DWV_CONFIG || {};
export const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !String(cfg.SUPABASE_URL).startsWith('REEMPLAZAR'));
export const supabase = configured ? createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

export function requireConfig(){
  if(!configured) throw new Error('Supabase todavía no está configurado. Edita config.js.');
}
