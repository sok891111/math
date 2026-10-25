/* Same reward conventions as platformer: named rarity, a large reveal,
   persistent collection, a wallet, and a single grant per completed run. */
(function(root){
 const badges=[
  {icon:'🌿',name:'크리퍼의 첫 다리',rarity:'새싹',color:'#8cb856'},
  {icon:'🧱',name:'차곡차곡 건축가',rarity:'희귀',color:'#69a7c8'},
  {icon:'🌈',name:'세 빛깔 탐험가',rarity:'희귀',color:'#69a7c8'},
  {icon:'🔍',name:'숨은 규칙 탐정',rarity:'영웅',color:'#ad88ce'},
  {icon:'💠',name:'반짝 규칙 마법사',rarity:'영웅',color:'#ad88ce'},
  {icon:'👑',name:'전설의 다리 수호자',rarity:'전설',color:'#e4b74f'}
 ];
 function grant(completed,index){const fresh=!completed.includes(index);return {index,fresh,gems:fresh?(index===5?30:10):3,points:fresh?(index===5?300:100):30};}
 root.CreativeRewards={badges,grant};
})(window);
