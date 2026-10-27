/* Durable attempt log; personal-code write access matches existing game saves. */
(function(){
 'use strict';
 const user=document.currentScript?.dataset.user||window.__BLOCK_USER__?.id;if(!/^[A-Za-z0-9]{4,10}$/.test(user||''))return;
 const path=location.pathname,game=path.includes('tralalerio')?'tralalerio':path.includes('magic-english')?(path.includes('block-world')?'magic-english-world':'magic-english'):null;
 if((!game&&!path.endsWith('/parent'))||window.BlockLearning)return;
 const uuid=()=>crypto.randomUUID(),prefix='block-learning-pending-v1:'+user+':',endpoint='/api/user/'+encodeURIComponent(user)+'/learning';
 let busy=false,last=performance.now(),lastInteraction=Date.now(),fraction=0,seconds=0;
 const session=uuid(),leaseKey='block-learning-active-v1:'+user;
 function pending(){const rows=[];try{for(const key of Object.keys(localStorage).filter(k=>k.startsWith(prefix))){try{const value=JSON.parse(localStorage.getItem(key));if(value?.id&&value?.at)rows.push({key,value});}catch{/* One damaged entry must not prevent other attempts from syncing. */}}}catch{}return rows.sort((a,b)=>a.value.at.localeCompare(b.value.at));}
 async function flush(){
  if(busy||!navigator.onLine)return;const batch=[];let size=0;for(const entry of pending()){const length=JSON.stringify(entry.value).length;if(batch.length&&(batch.length>=30||size+length>180000))break;batch.push(entry);size+=length;}if(!batch.length)return;busy=true;
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch.map(e=>e.value)}),keepalive:JSON.stringify(batch).length<16000,signal:AbortSignal.timeout(15000)});if(response.ok){const {acknowledged}=await response.json();for(const e of batch)if(acknowledged.includes(e.value.id))localStorage.removeItem(e.key);}}
  catch{/* Keep every pending record for reconnect/reload. */}finally{busy=false;}
 }
 function record(data){try{const event={...data,...(data.kind==='speech'?{game,sessionId:session}:data.kind==='usage'?{sessionId:session}:{}),id:data.id||uuid(),at:data.at||new Date().toISOString()};localStorage.setItem(prefix+event.id,JSON.stringify(event));void flush();return event.id;}catch{return null;}}
 function visible(){return document.visibilityState==='visible'&&Date.now()-lastInteraction<120000;}
 function ownsLease(){try{const raw=JSON.parse(localStorage.getItem(leaseKey)||'null');if(raw&&raw.session!==session&&Date.now()-raw.at<12000)return false;localStorage.setItem(leaseKey,JSON.stringify({session,at:Date.now()}));return true;}catch{return false;}}
 function saveTime(){if(seconds){const count=seconds;seconds=0;record({kind:'usage',game,seconds:count});}}
 function tick(){const now=performance.now(),elapsed=Math.max(0,Math.min(5,(now-last)/1000));last=now;if(visible()&&ownsLease()){fraction+=elapsed;const whole=Math.floor(fraction);seconds+=whole;fraction-=whole;}if(seconds>=15)saveTime();}
 function pause(){tick();saveTime();try{if(JSON.parse(localStorage.getItem(leaseKey)||'null')?.session===session)localStorage.removeItem(leaseKey);}catch{}last=performance.now();}
 for(const name of ['pointerdown','keydown','touchstart'])window.addEventListener(name,()=>{if(Date.now()-lastInteraction>=120000)last=performance.now();lastInteraction=Date.now();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'){if(game)pause();}else{last=performance.now();lastInteraction=Date.now();void flush();}});
 if(game)window.addEventListener('pagehide',pause);window.addEventListener('online',()=>void flush());
 if(game)setInterval(tick,1000);setInterval(()=>void flush(),15000);void flush();
 window.BlockLearning={record,flush,pendingCount:()=>pending().length};
})();
