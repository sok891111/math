(function(root){
 const blocks=[{id:'leaf',name:'풀 블록',symbol:'♣',color:'#8cb856',dark:'#50753a'},{id:'sun',name:'해 블록',symbol:'✦',color:'#edbd58',dark:'#ab7734'},{id:'water',name:'물 블록',symbol:'≈',color:'#76b9d0',dark:'#417b96'}];
 const levels=[
  {title:'두 가지가 번갈아',pattern:['leaf','sun'],length:8,holes:[5,7]},
  {title:'같은 블록 두 개와 하나',pattern:['leaf','leaf','sun'],length:9,holes:[6,7,8]},
  {title:'세 가지가 차례차례',pattern:['leaf','sun','water'],length:9,holes:[6,7,8]},
  {title:'가운데 끊어진 다리',pattern:['sun','water'],length:8,holes:[3,6]},
  {title:'새로운 재료, 익숙한 규칙',pattern:['water','water','leaf'],length:9,holes:[2,6,8]},
  {title:'마지막 다리의 비밀',pattern:['sun','leaf','water'],length:9,holes:[3,7,8]}
 ];
 function expected(level,index){return level.pattern[index%level.pattern.length];}
 function validate(level,placements){const missing=level.holes.filter(i=>!placements[i]);const wrong=level.holes.filter(i=>placements[i]&&placements[i]!==expected(level,i));return {missing,wrong,solved:missing.length===0&&wrong.length===0};}
 const api={blocks,levels,expected,validate};if(typeof module==='object')module.exports=api;else root.CreativePuzzles=api;
})(typeof window==='undefined'?globalThis:window);
