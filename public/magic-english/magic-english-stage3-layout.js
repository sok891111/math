// Furniture footprints are shared by drawing and collision. Coordinates stay in tiles.
export const SCHOOL_DESKS = [6,10].flatMap(y=>[4,8,12].map(x=>({x,y,w:2,h:1})));
export const SCHOOL_OBSTACLES={
 SchoolYard:[{x:3,y:1,w:14,h:4},{x:2,y:6,w:2,h:2},{x:16,y:6,w:2,h:2},{x:4,y:10,w:3,h:1},{x:13,y:11,w:6,h:2}],
 SchoolHall:[{x:9,y:5,w:3,h:1},{x:1,y:1,w:18,h:1},{x:7,y:2,w:2,h:2},{x:4,y:11,w:2,h:1},{x:2,y:3,w:2,h:9},{x:16,y:3,w:3,h:9}],
 Classroom:[{x:1,y:1,w:18,h:1},...SCHOOL_DESKS,{x:2,y:12,w:3,h:1},{x:8,y:4,w:3,h:1},{x:4,y:1,w:8,h:2},{x:14,y:2,w:2,h:2},{x:14,y:10,w:1,h:1},{x:17,y:2,w:2,h:11}],
 CocoRoom:[{x:1,y:1,w:18,h:1},{x:3,y:2,w:6,h:2},{x:15,y:2,w:4,h:3},{x:6,y:5,w:2,h:1},{x:12,y:5,w:2,h:2},{x:16,y:9,w:2,h:3}],
};
const openings={SchoolHall:['16,6'],Classroom:['17,6']};
export function stage3Floor(map,x,y){
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>18||y>13)return false;
 if(openings[map]?.includes(x+','+y))return true;
 return !(SCHOOL_OBSTACLES[map]||[]).some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
}
