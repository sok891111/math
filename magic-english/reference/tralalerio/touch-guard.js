// iOS starts its text loupe before contextmenu/selectstart. Cancel the native
// single-finger gesture at touchstart, preserving game taps, drags and scrolling.
export function installTouchGuard(doc=document){
 let gesture=null;
 const scrollBy=(target,delta)=>{
  for(let el=target;el;el=el.parentElement){
   if(el.scrollHeight>el.clientHeight&&/(auto|scroll)/.test(getComputedStyle(el).overflowY)){
    const old=el.scrollTop;el.scrollTop+=delta;delta-=el.scrollTop-old;if(Math.abs(delta)<1)return;
   }
  }
  doc.scrollingElement.scrollTop+=delta;
 };
 doc.addEventListener('touchstart',e=>{
  if(e.touches.length!==1){gesture=null;return;}
  const target=e.target instanceof Element?e.target:e.target.parentElement;
  if(target.closest('input,textarea,select,[contenteditable="true"],[data-move],[data-drag]')){gesture=null;return;}
  e.preventDefault();doc.getSelection()?.removeAllRanges();
  const t=e.touches[0];gesture={target,x:t.clientX,y:t.clientY,lastY:t.clientY,moved:false,
   drag:!!target.closest('[data-drag],[data-move]')};
 },{passive:false});
 doc.addEventListener('touchmove',e=>{
  if(!gesture||e.touches.length!==1)return;e.preventDefault();
  const t=e.touches[0];if(Math.hypot(t.clientX-gesture.x,t.clientY-gesture.y)>6)gesture.moved=true;
  if(gesture.moved&&!gesture.drag)scrollBy(gesture.target,gesture.lastY-t.clientY);
  gesture.lastY=t.clientY;
 },{passive:false});
 doc.addEventListener('touchend',()=>{
  const g=gesture;gesture=null;if(!g||g.moved||!g.target.isConnected||g.target.closest('[data-move]'))return;
  const control=g.target.closest('button,a,[role="button"]');
  if(control&&!control.disabled)control.click();
 });
 doc.addEventListener('touchcancel',()=>{gesture=null;});
}
