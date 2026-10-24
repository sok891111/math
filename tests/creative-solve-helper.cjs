async function solveCurrent(page,{drag=false,touch=false}={}){
 const {puzzle:q}=await page.evaluate(()=>CreativeExpedition.snapshot());
 async function drop(source,target){const a=await source.boundingBox(),b=await target.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});await page.mouse.up();await page.waitForTimeout(380);}
 if(q.type==='pattern'){for(let i=0;i<q.answer.length;i++){const source=page.locator(`[data-drag="pattern"][data-value="${q.answer[i]}"]`);if(drag)await drop(source,page.locator('.future-runes button').nth(i));else await source.click();}}
 else if(q.type==='mirror'){for(let i=0;i<q.answer.length;i++)if(q.answer[i]){if(drag)await drop(page.locator('.light-tool'),page.locator('.mirror-grid button').nth(i));else await page.locator('.mirror-grid button').nth(i).click();}}
 else if(q.type==='logic'){for(let i=0;i<q.answer.length;i++){const source=page.locator(`[data-drag="logic"][data-value="${q.answer[i]}"]`);if(drag)await drop(source,page.locator('.logic-slot').nth(i));else{await source.click();await page.locator('.logic-slot').nth(i).click();}}}
 else if(q.type==='path'){if(drag){const first=await page.locator(`[data-cell="${q.start}"]`).boundingBox();await page.mouse.move(first.x+first.width/2,first.y+first.height/2);await page.mouse.down();for(const cell of q.solution.slice(1)){const box=await page.locator(`[data-cell="${cell}"]`).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:6});}await page.mouse.up();await page.waitForTimeout(380);}else for(const cell of q.solution.slice(1))await page.locator(`[data-cell="${cell}"]`).click();}
 else if(q.subset){for(const id of q.answer){const source=page.locator(`.selection-piece[data-value="${id}"]`);if(drag)await drop(source,page.locator('.selection-basket'));else await source.click();}}
 else if(q.paint){for(let i=0;i<q.answer.length;i++)if(q.answer[i]){if(drag)await drop(page.locator('[data-drag="facto"]'),page.locator('.shape-preview.editable button').nth(i));else await page.locator('.shape-preview.editable button').nth(i).click();}}
 else{for(let i=0;i<q.answer.length;i++){const source=page.locator(`[data-drag="facto"][data-value="${q.answer[i]}"]`);if(drag)await drop(source,page.locator('[data-drop="facto"]').nth(i));else await source.click();}}
 await page.locator('#attack').click();await page.waitForFunction(()=>!document.querySelector('#hint').disabled||!document.querySelector('#capture-panel').hidden||!document.querySelector('#result-panel').hidden);
 return q;
}
module.exports={solveCurrent};
