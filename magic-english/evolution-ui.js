import {commitEvolution,cancelEvolution,finishEvolution,learnEvolutionMove,queueBattleEvolutions} from './evolution.js?v=20261018-boss-math32';
export function createEvolutionUI({getGame,onSave,onChange,onDone}){
 const root=document.createElement('dialog');root.id='evolution-screen';root.setAttribute('aria-label','포켓몬 진화');document.body.append(root);let generation=0;
 const el=(tag,copy,cls)=>{const e=document.createElement(tag);if(copy!==undefined)e.textContent=copy;if(cls)e.className=cls;return e;};
 const button=(copy,fn)=>{const b=el('button',copy);b.type='button';b.onclick=fn;return b;};
 function next(){const g=getGame();if(!finishEvolution(g))return;queueBattleEvolutions(g);onSave();onChange();if(g.state.evolution)open();else{root.close();onDone();}}
 function render(){const g=getGame(),m=g.state.evolution;if(!m)return;root.replaceChildren();const old=g.battleData.species[m.from].name,name=g.battleData.species[m.to].name;const message=el('p',m.phase==='intro'?`어라… ${old}의 모습이…!`:m.cancelled?`${old}의 진화가 멈췄다!`:`축하합니다! ${old}${(old.charCodeAt(old.length-1)-44032)%28?'은':'는'} ${name}${((name.charCodeAt(name.length-1)-44032)%28)&&((name.charCodeAt(name.length-1)-44032)%28)!==8?'으로':'로'} 진화했다!`,'evolution-message');
 const stage=el('div',undefined,'evolution-stage');for(const [which,species]of [['old',m.from],['new',m.to]]){const image=el('img');image.src=`assets/battle/${species}-front.png`;image.alt=g.battleData.species[species].name;image.className='evolution-'+which;stage.append(image);}root.append(stage,message);
 if(m.phase==='intro'){if(m.trigger==='level')root.append(button('진화 멈추기 (B)',()=>{generation++;if(cancelEvolution(g)){onSave();render();}}));}
 else if(m.learn.length){const p=g.state.party[m.index],id=m.learn[0];root.append(el('p',`${name}는 ${g.battleData.moves[id].name}를 배우려고 한다! 잊을 기술을 골라 주세요.`));p.moves.forEach((move,i)=>root.append(button(g.battleData.moves[move.id].name,()=>{learnEvolutionMove(g,i);onSave();render();})));root.append(button('배우지 않는다',()=>{learnEvolutionMove(g,-1);onSave();render();}));}
 else root.append(button('다음 ▼',next));
 stage.dataset.phase=m.phase;stage.dataset.cancelled=String(m.cancelled);root.querySelector('button')?.focus({preventScroll:true});
 }
 async function open(){const g=getGame(),m=g?.state.evolution;if(!m)return;const token=++generation;render();if(!root.open)root.showModal();if(m.phase!=='intro')return;
 const images=[...root.querySelectorAll('img')];await Promise.all(images.map(im=>im.decode().catch(()=>{})));if(token!==generation)return;
 const stage=root.querySelector('.evolution-stage'),old=stage.querySelector('.evolution-old'),fresh=stage.querySelector('.evolution-new'),wait=ms=>new Promise(r=>setTimeout(r,ms));
 await wait(650);
 // Gold alternates the old and new white silhouettes at increasing speed.
 stage.classList.add('silhouette');for(const delay of [260,240,210,180,150,120,100,80,60,50]){if(token!==generation)return;old.style.opacity='0';fresh.style.opacity='1';await wait(delay);if(token!==generation)return;old.style.opacity='1';fresh.style.opacity='0';await wait(delay);}
 if(token!==generation)return;if(commitEvolution(g)){onSave();onChange();render();}else{root.replaceChildren(el('p','진화 조건이 달라졌어요. 동료와 도구를 다시 확인해 주세요.'),button('돌아가기',()=>{delete g.state.evolution;onSave();root.close();onDone();}));}
 }
 root.addEventListener('cancel',e=>{e.preventDefault();if(cancelEvolution(getGame())){generation++;onSave();render();}});
 root.addEventListener('keydown',e=>{e.stopPropagation();if(['b','B','x','X'].includes(e.key)){e.preventDefault();if(cancelEvolution(getGame())){generation++;onSave();render();}else if(getGame().state.evolution?.phase==='done'&&!getGame().state.evolution.learn.length)next();}});
 return {open,active:()=>root.open,close(){generation++;if(root.open)root.close();}};
}
