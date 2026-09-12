import {test,expect} from '@playwright/test';
import {items} from '../src/storage-layout.js';

const activate=async(page,selector)=>{const target=page.locator(selector);await expect(target).toBeVisible();await expect(target).toBeEnabled();await target.focus();await page.keyboard.press('Enter');};
const settle=page=>page.waitForFunction(()=>window.__studio.state().flights===0);
async function boot(page,records=[]){
 await page.goto('/');await page.evaluate(records=>localStorage.setItem('little-order-free-v2',JSON.stringify({records})),records);await page.reload();await page.waitForFunction(()=>window.__studio?.ready());await expect(page.locator('#loading')).toBeHidden();
}
async function observe(page){await page.evaluate(()=>{
 window.collisionSamples={count:0,errors:[]};window.collisionTimer=setInterval(()=>{const snapshot=window.__studio.geometry();window.collisionSamples.count++;if(snapshot.errors.length)window.collisionSamples.errors.push(...snapshot.errors);},40);
});}
async function assertClear(page){
 await page.waitForTimeout(400);const result=await page.evaluate(()=>{clearInterval(window.collisionTimer);return window.collisionSamples;});expect(result.count).toBeGreaterThan(10);expect(result.errors).toEqual([]);expect(await page.evaluate(()=>window.__studio.geometry().errors)).toEqual([]);
}

test('actual fruit bounds clear dividers throughout fast packing, neighbour resizing and removal',async({page})=>{
 await boot(page);await observe(page);await activate(page,'[data-drawer="0"]');
 for(let i=0;i<6;i++){await activate(page,`[data-item="apple-${i}"]`);await activate(page,`[data-item="orange-${i}"]`);}await settle(page);
 await activate(page,'[data-drawer="1"]');
 for(let i=6;i<14;i++)await activate(page,`[data-item="orange-${i}"]`);await settle(page);
 await activate(page,'[data-drawer="0"]');
 for(let i=0;i<6;i++)await activate(page,`[data-item="apple-${i}"]`);await settle(page);
 for(const id of ['apple-6','milk-0','soda-0','yogurt-0','egg-0'])await activate(page,`[data-item="${id}"]`);await settle(page);
 await assertClear(page);const s=await page.evaluate(()=>window.__studio.state());expect(s.records).toHaveLength(19);expect(s.drawers[0].groups).toBe(6);
});

test('all four populated elevations stay separate when drawers open, close and the tower rotates',async({page})=>{
 await boot(page,items.map((item,i)=>({id:item.id,drawer:i%24})));await observe(page);
 for(let face=0;face<4;face++){
  for(const offset of [0,1,4,5]){await activate(page,`[data-drawer="${face*6+offset}"]`);await page.waitForTimeout(160);}
  await page.locator('#rotate-left').click();await page.waitForFunction(()=>Math.abs(window.__studio.state().angle-window.__studio.state().targetAngle)<.025);
 }
 await assertClear(page);expect((await page.evaluate(()=>window.__studio.geometry())).packed).toHaveLength(156);
});

test('filled adjacent faces restore without fruit, wall or shelf intersections on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const records=[...Array.from({length:16},(_,i)=>({id:`apple-${i}`,drawer:0})),...Array.from({length:16},(_,i)=>({id:`orange-${i}`,drawer:6})),...Array.from({length:16},(_,i)=>({id:`milk-${i}`,drawer:12})),...Array.from({length:16},(_,i)=>({id:`egg-${i}`,drawer:18}))];
 await boot(page,records);await observe(page);await activate(page,'[data-drawer="0"]');await page.waitForTimeout(500);await page.locator('#rotate-right').click();await page.waitForFunction(()=>Math.abs(window.__studio.state().angle-window.__studio.state().targetAngle)<.025);await activate(page,'[data-drawer="18"]');await assertClear(page);
});
