// Shared travel rules: keep saves intact and treat stock across all block types.
export function worldEntry(saved,readError){return readError?{action:'blocked'}:saved?{action:'resume',save:saved}:{action:'create',terrain:'flat'};}
export function adventureURL(value,origin,user=''){
 const fallback='/magic-english'+(user?'?user='+encodeURIComponent(user):'');
 try{const url=new URL(value||fallback,origin);return url.origin===origin&&!url.pathname.startsWith('/block-world')&&!url.pathname.startsWith('/magic-english/block-world')?url.pathname+url.search:fallback;}catch{return fallback;}
}
export function blocksEmpty(inventory){return !Object.values(inventory?.counts||{}).some(count=>Number.isFinite(count)&&count>0);}
export function createTravel({save,navigate,animate}){
 let busy=false;
 return async(url,label)=>{if(busy)return false;busy=true;try{if(save()===false)return false;await animate(label);navigate(url);return true;}finally{busy=false;}};
}
function overlay(label){
 const el=document.createElement('div');el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:radial-gradient(circle,#416b62,#172d30);color:#fff7da;font:700 clamp(20px,4vw,32px) system-ui;text-align:center;padding:24px;pointer-events:all;';
 const text=document.createElement('div');text.textContent=label;el.append(text);document.body.append(el);return el;
}
export async function departure(label){
 const el=overlay(label),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?100:520;
 try{await el.animate([{opacity:0,clipPath:'circle(0% at 50% 50%)'},{opacity:1,clipPath:'circle(150% at 50% 50%)'}],{duration,easing:'ease-in-out',fill:'forwards'}).finished;}catch{el.style.opacity='1';}
}
export async function arrival(label){
 const el=overlay(label),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?100:420;
 try{await el.animate([{opacity:1},{opacity:0}],{duration,easing:'ease-out',fill:'forwards'}).finished;}catch{/* Still remove the overlay on unsupported browsers. */}finally{el.remove();}
}

export function shouldShowEmptyNotice({started,active,empty,acknowledged,ready,open}){
 return Boolean(started&&active&&empty&&!acknowledged&&ready&&!open);
}
