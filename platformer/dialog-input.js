'use strict';
// Activate modal buttons on a completed tap. Some iPad Safari transitions drop
// the compatibility click; cancelling touchend avoids also activating it twice.
(() => {
 let tap=null;
 document.addEventListener('touchstart',event=>{
  const button=event.target.closest?.('dialog[open] button:not(:disabled)');
  // Movable blocks have their own pointer/drag handling.
  if(event.touches.length!==1||!button||button.matches('.move-block')){tap=null;return;}
  const t=event.touches[0];
  tap={button,id:t.identifier,x:t.clientX,y:t.clientY};
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(!tap)return;
  const t=[...event.touches].find(t=>t.identifier===tap.id);
  if(!t||Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>10)tap=null;
 },{passive:true});
 document.addEventListener('touchcancel',()=>{tap=null;},{passive:true});
 document.addEventListener('touchend',event=>{
  const pending=tap;tap=null;
  if(!pending||event.touches.length||!event.cancelable)return;
  const t=[...event.changedTouches].find(t=>t.identifier===pending.id);
  if(!t||Math.hypot(t.clientX-pending.x,t.clientY-pending.y)>10)return;
  const button=pending.button;
  if(button.disabled||!button.closest('dialog[open]')||!button.contains(document.elementFromPoint(t.clientX,t.clientY)))return;
  event.preventDefault();
  button.click();
 },{passive:false});
})();
