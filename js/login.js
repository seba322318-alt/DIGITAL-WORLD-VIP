import { supabase,configured } from './supabase-client.js';
if(!configured) document.querySelector('#configWarning').classList.remove('hidden');
const msg=document.querySelector('#msg');
document.querySelector('#loginForm').addEventListener('submit',async e=>{
 e.preventDefault(); if(!configured) return;
 const email=document.querySelector('#email').value.trim(); const password=document.querySelector('#password').value;
 const {data,error}=await supabase.auth.signInWithPassword({email,password});
 if(error){msg.textContent=error.message;msg.className='notice error';return}
 const {data:profile}=await supabase.from('profiles').select('*').eq('id',data.user.id).maybeSingle();
 if(!profile||!profile.active){await supabase.auth.signOut();msg.textContent='Tu cuenta no está activa. Contacta con la academia.';msg.className='notice error';return}
 location.href=profile.role==='admin'?'/admin.html':'/dashboard.html';
});
