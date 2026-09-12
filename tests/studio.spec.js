import {test,expect} from '@playwright/test';
import {foods,items,drawerDimensions,layoutDrawer,cleanRecords} from '../src/storage-layout.js';
test.setTimeout(60000);
const settle=page=>page.waitForFunction(()=>window.__studio.state().flights===0);
const put=async(page,id)=>{await page.locator(`[data-item="${id}"]`).focus();await page.keyboard.press('Enter');};
test.beforeEach(async({page})=>{await page.goto('/');await page.waitForFunction(()=>window.__studio?.ready());await expect(page.locator('#loading')).toBeHidden();});

test('only button copy is visible; 156 objects and unlabelled drawers',async({page})=>{
 await expect(page.locator('[data-item]')).toHaveCount(156);await expect(page.locator('[data-drawer]')).toHaveCount(48);
 const stray=await page.evaluate(()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n,result=[];while(n=walker.nextNode()){const p=n.parentElement;if(!n.textContent.trim()||p.closest('button,script,style,.sr-only'))continue;if(p.getClientRects().length&&getComputedStyle(p).visibility!=='hidden')result.push(n.textContent.trim());}return result;});expect(stray).toEqual([]);
 await expect(page.locator('[data-drawer="0"]')).toHaveText('');
});

test('any drawer accepts new types; same types regroup and existing pieces reflow',async({page})=>{
 await page.locator('[data-drawer="4"]').click();await put(page,'milk-0');await settle(page);
 const first=await page.evaluate(()=>window.__studio.state());expect(first.records[0]).toEqual({id:'milk-0',drawer:4});
 await put(page,'apple-0');await put(page,'milk-1');await put(page,'apple-1');await settle(page);
 let state=await page.evaluate(()=>window.__studio.state());expect(state.records).toHaveLength(4);expect(state.drawers[4].groups).toBe(2);expect(state.drawers[4].width).toBeGreaterThan(first.drawers[4].width);
 await page.locator('[data-drawer="2"]').click();await put(page,'milk-2');await settle(page);state=await page.evaluate(()=>window.__studio.state());expect(state.active).toBe(2);expect(state.records.at(-1).drawer).toBe(2);
 await page.locator('#undo').click();expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(4);
 await page.reload();await page.waitForFunction(()=>window.__studio?.ready());expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(4);
});

test('rapid collection, resized compartments, completion, compare and replay',async({page})=>{
 await page.locator('[data-drawer="0"]').click();
 for(let i=0;i<18;i++)await put(page,`milk-${i}`);await settle(page);
 let state=await page.evaluate(()=>window.__studio.state());expect(state.records).toHaveLength(16);expect(new Set(state.slots.map(s=>`${s.x}:${s.z}`)).size).toBe(16);
 await page.screenshot({path:'/tmp/free-packed.png',fullPage:true});
 // Resume a complete saved run to exercise the full-size layout and completion UI.
 await page.evaluate(records=>localStorage.setItem('little-order-free-v2',JSON.stringify({records})),items.map(i=>({id:i.id,drawer:foods.findIndex(f=>f.type===i.type)})));
 await page.reload();await page.waitForFunction(()=>window.__studio?.ready());await expect(page.locator('#completion')).toBeVisible();expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(156);
 await page.locator('#compare').click();await expect(page.locator('#return-now')).toBeVisible();await expect(page.locator('[data-item="milk-0"]')).toBeVisible();await page.locator('#return-now').click();
 await page.screenshot({path:'/tmp/free-completed.png',fullPage:true});await page.locator('#replay').click();expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(0);
});

test('mobile layout and actual ray-picked item click',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(600);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('[data-drawer="3"]').click();
 const target=page.locator('[data-item="orange-0"]');await target.evaluate(el=>el.scrollIntoView({block:'center'}));const rect=await target.boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);await settle(page);expect((await page.evaluate(()=>window.__studio.state())).records.length).toBeGreaterThan(0);
 await page.screenshot({path:'/tmp/free-mobile.png',fullPage:true});
});

test('layout keeps every piece inside its compartment for all collection sizes',async()=>{
 for(let n=1;n<=items.length;n++){
  const records=items.slice(0,n).map(i=>({id:i.id,drawer:0})),dims=drawerDimensions(records),layout=layoutDrawer(records,dims[0].width,dims[0].depth);expect(layout.positions.size).toBe(n);
  for(const [id,p] of layout.positions){const f=foods.find(f=>id.startsWith(f.type+'-'));expect(p.scale).toBeGreaterThan(0);expect(Math.abs(p.x)+f.size[0]*p.scale/2).toBeLessThan(dims[0].width/2);expect(Math.abs(p.z)+f.size[1]*p.scale/2).toBeLessThan(dims[0].depth/2);}
 }
 expect(cleanRecords([{id:'milk-0',drawer:1},{id:'milk-0',drawer:1},{id:'milk-1',drawer:2},{id:'no',drawer:0}])).toEqual([{id:'milk-0',drawer:1},{id:'milk-1',drawer:2}]);
});
