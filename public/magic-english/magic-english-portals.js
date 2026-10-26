import {stage4Portal} from './magic-english-stage4.js';
import {stage3Portal} from './magic-english-stage3.js';
// Entrances are entered by walking; investigation targets still use A/Space.
const gates={
 BusStop:[['s2_board',10,2],['s2_airport',3,13]],
 BusInterior:[['s2_alight',10,12]],
 NextStop:[['s2_back',3,13],['s2_next',10,2]],
};
export function walkingPortal(state,x,y){
 const kitchen=stage4Portal(state,x,y);if(kitchen)return kitchen;
 const school=stage3Portal(state,x,y);if(school)return school;
 if(state.map==='AirportHall'&&x===10&&y===1)return {id:'airport_exit',x,y,ready:Boolean(state.rewardReceipts?.['stage-1-first-clear'])};
 const gate=gates[state.map]?.find(([,gx,gy])=>gx===x&&gy===y);if(!gate)return null;
 const s=state.stage2||{},id=gate[0];let ready=true;
 if(id==='s2_board')ready=['bus','bag','big'].every(w=>s.words?.[w]);
 if(id==='s2_alight')ready=Boolean(s.driver);
 if(id==='s2_next')ready=Boolean(s.bagRecovered);
 return {id,x,y,ready};
}
