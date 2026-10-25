export class RewardClient {
 constructor(userId,onRewards,onError=()=>{}){this.userId=userId;this.onRewards=onRewards;this.onError=onError;this.controller=null;this.timer=null;this.generation=0;}
 start(){this.stop();this.timer=setInterval(()=>this.sync(),10000);void this.sync();}
 stop(){this.generation++;clearInterval(this.timer);this.timer=null;this.controller?.abort();this.controller=null;}
 async sync(){
  if(this.controller)return;const generation=this.generation,controller=new AbortController();this.controller=controller;const timeout=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch('/api/magic-english/block-world/rewards?userId='+encodeURIComponent(this.userId),{signal:controller.signal,cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error('보상 서버에 연결하지 못했습니다.');const value=await response.json();if(value.version!==1||value.userId!==this.userId||!Array.isArray(value.rewards))throw Error('보상 응답이 올바르지 않습니다.');if(generation===this.generation)this.onRewards(value.rewards);}catch(error){if(generation===this.generation&&error.name!=='AbortError')this.onError(error);}finally{clearTimeout(timeout);if(this.controller===controller)this.controller=null;}
 }
}
