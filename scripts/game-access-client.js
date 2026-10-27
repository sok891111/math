(function(){
 'use strict';
 const id=document.currentScript?.dataset.user||window.__BLOCK_USER__?.id;if(!/^[A-Za-z0-9]{4,10}$/.test(id||''))return;
 if(window.BlockGameAccess)return;
 let denied=false,pending=null;
 function stop(reason){
  if(denied)return;denied=true;
  document.documentElement.inert=true;
  document.querySelectorAll('audio,video').forEach(el=>el.pause());
  window.BlockLearning?.flush?.();
  location.replace('/'+id+'/paused'+(reason==='connection'?'?reason=connection':''));
 }
 async function check(){
  if(denied)return false;if(pending)return pending;
  pending=(async()=>{try{const response=await fetch('/api/user/'+id+'/access',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(7000)});if(!response.ok)throw Error('Access unavailable');const result=await response.json();if(result.blocked){stop('blocked');return false;}return true;}catch{stop('connection');return false;}finally{pending=null;}})();return pending;
 }
 const ready=check();window.BlockGameAccess={ready,check};
 setInterval(()=>void check(),10000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
 window.addEventListener('online',()=>void check());window.addEventListener('offline',()=>stop('connection'));
 window.addEventListener('pageshow',event=>{if(event.persisted){document.documentElement.inert=true;void check().then(ok=>{if(ok)document.documentElement.inert=false;});}});
})();
