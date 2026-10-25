export function currentLandmark(catalog,map){return catalog.landmarks.find(p=>p.id===catalog.maps[map])||null;}
export function createTownMapUI(getGame){
 const root=document.createElement('dialog');root.id='town-map';root.tabIndex=-1;root.className='town-map';root.setAttribute('aria-label','포켓몬 지도');document.body.append(root);
 let catalog,promise,region='johto',selected,current,opener;
 const node=(tag,copy,cls)=>{const n=document.createElement(tag);if(copy!==undefined)n.textContent=copy;if(cls)n.className=cls;return n;};
 const button=(copy,fn)=>{const b=node('button',copy);b.type='button';b.onclick=fn;return b;};
 function close(){root.close();opener?.focus({preventScroll:true});}
 const locations=()=>catalog.landmarks.filter(p=>p.region===region);
 function choose(index){const list=locations();selected=list[(index+list.length)%list.length];render();}
 function step(delta){choose(locations().findIndex(p=>p.id===selected.id)+delta);}
 function setRegion(value){region=value;selected=current?.region===region?current:locations()[0];render();}
 function render(){
  root.replaceChildren();root.append(node('p','POKéGEAR · MAP','eyebrow'),node('h2','지도'));
  if(!catalog){root.append(node('p','지도를 불러오고 있어요.'),button('닫기',close));return;}
  const tabs=node('nav',undefined,'town-map-tabs');for(const [id,name] of [['johto','성도'],['kanto','관동']]){const b=button(name,()=>setRegion(id));b.setAttribute('aria-pressed',String(region===id));tabs.append(b);}root.append(tabs);
  root.append(node('p',`현재 위치: ${current?.name||getGame().map.name}`,'town-map-current'));
  const frame=node('div',undefined,'town-map-frame');frame.dataset.region=region;
  const image=node('img');image.src=`./assets/town-map/${region}.png?v=20261018-map25`;image.alt=`포켓몬 골드 ${region==='johto'?'성도':'관동'} 지방 지도`;image.width=160;image.height=144;image.draggable=false;frame.append(image);
  if(current?.region===region){const player=node('span',undefined,'town-map-player');player.style.left=current.x/160*100+'%';player.style.top=current.y/144*100+'%';player.setAttribute('role','img');player.setAttribute('aria-label','내 위치: '+current.name);frame.append(player);}
  const cursor=node('img',undefined,'town-map-cursor');cursor.src='./assets/town-map/cursor.png?v=20261018-cursor26';cursor.alt='선택한 장소: '+selected.name;cursor.style.left=selected.x/160*100+'%';cursor.style.top=selected.y/144*100+'%';frame.append(cursor);
  let touchStart;frame.onpointerdown=e=>{touchStart={x:e.clientX,y:e.clientY}};frame.onpointerup=e=>{if(!touchStart||Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8)return;const rect=frame.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*160,y=(e.clientY-rect.top)/rect.height*144;selected=locations().reduce((a,b)=>Math.hypot(a.x-x,a.y-y)<Math.hypot(b.x-x,b.y-y)?a:b);render();};root.append(frame);
  const label=node('h3',selected.name,'town-map-name');label.setAttribute('aria-live','polite');root.append(label);
  const select=node('select');select.setAttribute('aria-label','지도에서 장소 선택');for(const p of locations()){const opt=node('option',p.name);opt.value=p.id;opt.selected=p.id===selected.id;select.append(opt);}select.onchange=()=>{selected=locations().find(p=>p.id===select.value);render();root.querySelector('select')?.focus();};root.append(select);
  const controls=node('div',undefined,'town-map-buttons');controls.append(button('▲ 이전 장소',()=>step(-1)),button('▼ 다음 장소',()=>step(1)),button('내 위치',()=>{region=current?.region||'johto';selected=current||locations()[0];render();}),button('닫기',close));root.append(controls,node('p','↑↓ 장소 선택 · 지도 터치로 살펴보기 · B / Esc 닫기','town-map-help'));root.focus({preventScroll:true});
 }
 root.addEventListener('cancel',e=>{e.preventDefault();close();});root.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'||['x','b'].includes(e.key.toLowerCase())){e.preventDefault();close();return;}if(!catalog||e.target.tagName==='SELECT')return;const delta={ArrowUp:-1,ArrowDown:1}[e.key];if(delta){e.preventDefault();step(delta);}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setRegion(region==='johto'?'kanto':'johto');}});
 return {active:()=>root.open,async open(){if(root.open)return;opener=document.activeElement;root.showModal();render();try{catalog=await(promise??=fetch('./assets/town-map/map.json?v=20261025-third1').then(r=>{if(!r.ok)throw Error('지도 로딩 실패');return r.json();}).catch(e=>{promise=null;throw e;}));if(!root.open)return;current=currentLandmark(catalog,getGame().state.map);region=current?.region||'johto';selected=current||locations()[0];render();root.querySelector('button')?.focus();}catch{if(root.open)root.replaceChildren(node('p','지도를 불러오지 못했어요. 다시 열어 주세요.'),button('닫기',close));}}};
}
