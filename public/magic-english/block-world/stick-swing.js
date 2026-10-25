const keyframes=[
 {at:0,p:[.44,-.3,-.7],r:[0,0,-.48]},
 {at:.16,p:[.58,-.14,-.62],r:[-.4,-.1,.22]},
 {at:.52,p:[-.42,-.43,-.92],r:[.7,.35,-2.1]},
 {at:1,p:[.44,-.3,-.7],r:[0,0,-.48]},
];
// Wind up on the right, sweep across the screen, then return more slowly.
export function stickSwingPose(progress){
 progress=Math.max(0,Math.min(1,progress));const index=keyframes.findIndex((frame,i)=>i>0&&progress<=frame.at),b=keyframes[index<0?3:index],a=keyframes[Math.max(0,(index<0?3:index)-1)],t=(progress-a.at)/(b.at-a.at),eased=t*t*(3-2*t);
 return {position:a.p.map((value,i)=>value+(b.p[i]-value)*eased),rotation:a.r.map((value,i)=>value+(b.r[i]-value)*eased)};
}
