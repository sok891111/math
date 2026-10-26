// Keep game controls from triggering browser pinch, double-tap or keyboard zoom.
export const WORLD_FOV=75;
export function installZoomLock(doc=document){
 const cancel=event=>{if(event.cancelable)event.preventDefault();};
 for(const name of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(name,cancel,{passive:false,capture:true});
 doc.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey)cancel(event);},{passive:false,capture:true});
 doc.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&(['Equal','Minus','NumpadAdd','NumpadSubtract','Digit0','Numpad0'].includes(event.code)||['+','-','=','0'].includes(event.key))){cancel(event);event.stopImmediatePropagation();}},{capture:true});
 // Do not stop pointer events: walking and looking must still work together.
 doc.addEventListener('touchmove',event=>{if(event.touches.length>1)cancel(event);},{passive:false,capture:true});
 doc.addEventListener('dblclick',event=>{if(!event.target.closest('input,textarea'))cancel(event);},{passive:false,capture:true});
}
installZoomLock();
