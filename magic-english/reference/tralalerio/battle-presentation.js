// Replaying a saved log must show the monsters at that message, not the final turn state.
export function messageVisual(state,index){
 const events=state.animationEvents||[],event=events.find(e=>e.logIndex<=index&&index<e.endIndex);
 if(event)return index===event.logIndex?event.before:event.after;
 const next=events.find(e=>e.logIndex>index);
 return next?.before||state.visualAfter||null;
}
