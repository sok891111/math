import {createRequire} from 'node:module';import {questionFor} from '../math-challenge.js';
const require=createRequire(import.meta.url),model=require('../../creative/battle-model.js'),facto=require('../../creative/facto-puzzles.js');
export async function solveMath(page,{submit=true}={}){
 const dialog=page.locator('.math-dialog[open]');if(!await dialog.isVisible())return null;
 const c=await page.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge),q=questionFor(c,model,facto);
 await dialog.locator('.math-reset').click();
 if(q.type==='pattern'){for(const n of q.answer)await dialog.locator(`.rune-tool[data-value="${n}"]`).click()}
 else if(q.type==='mirror'){for(let i=0;i<q.answer.length;i++)if(q.answer[i])await dialog.locator(`.math-light[data-slot="${i}"]`).click()}
 else if(q.type==='path'){for(const n of q.solution.slice(1))await dialog.locator(`.math-path-cell[data-cell="${n}"]`).click()}
 else if(q.type==='logic'){for(let i=0;i<q.answer.length;i++){await dialog.locator(`.logic-rune[data-value="${q.answer[i]}"]`).click();await dialog.locator(`.math-slot[data-slot="${i}"]`).click()}}
 else if(q.subset){for(const n of q.answer)await dialog.locator(`.selection-piece[data-value="${n}"]`).click()}
 else if(q.paint){const current=await page.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')).battle.mathChallenge.input);for(let i=0;i<q.answer.length;i++)if(q.answer[i]!==current[i])await dialog.locator('.shape-preview.editable button').nth(i).click()}
 else{for(const n of q.answer)await dialog.getByRole('button',{name:q.type==='analogy'?`변환 조각 ${n}`:`답 조각 ${n}`,exact:true}).click()}
 if(submit)await dialog.locator('.math-submit').click();return q;
}
