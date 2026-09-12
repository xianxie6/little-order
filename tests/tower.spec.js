import {test,expect} from '@playwright/test';
import {makeFoley} from '../src/foley.js';
test.setTimeout(60000);
const settle=p=>p.waitForFunction(()=>window.__studio.state().flights===0);
const turn=p=>p.waitForFunction(()=>Math.abs(window.__studio.state().angle-window.__studio.state().targetAngle)<.025);
const activate=async(p,selector)=>{await p.locator(selector).focus();await p.keyboard.press('Enter');};
test.beforeEach(async({page})=>{await page.goto('/');await page.waitForFunction(()=>window.__studio?.ready());await expect(page.locator('#loading')).toBeHidden();});

test('click a packed object, toss it out, reflow, undo, and mute all contact audio',async({page})=>{
 await activate(page,'[data-drawer="0"]');for(let i=0;i<4;i++)await activate(page,`[data-item="milk-${i}"]`);await settle(page);
 const target=page.locator('[data-item="milk-0"]');await expect(target).toBeEnabled();await target.evaluate(el=>el.scrollIntoView({block:'center'}));const r=await target.boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
 const hit=await page.evaluate(({x,y})=>window.__studio.pick(x,y),{x,y});expect(hit?.packed).toBeTruthy();
 await page.mouse.click(x,y);await settle(page);let state=await page.evaluate(()=>window.__studio.state());expect(state.records).toHaveLength(3);expect(state.records.some(r=>r.id===hit.packed)).toBe(false);expect(state.slots).toHaveLength(3);expect(state.audio.plays).toBeGreaterThan(0);
 await page.locator('#undo').click();expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(4);
 await page.locator('#sound').click();const plays=await page.evaluate(()=>window.__studio.state().audio.plays);await activate(page,'[data-item="milk-1"]');await settle(page);state=await page.evaluate(()=>window.__studio.state());expect(state.records).toHaveLength(3);expect(state.audio.plays).toBe(plays);
 await page.reload();await page.waitForFunction(()=>window.__studio?.ready());expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(3);
});

test('full drawers accept no overflow; another drawer accepts the same type; all four sides work',async({page})=>{
 await activate(page,'[data-drawer="0"]');for(let i=0;i<16;i++)await activate(page,`[data-item="egg-${i}"]`);await settle(page);
 await activate(page,'[data-item="egg-16"]');expect((await page.evaluate(()=>window.__studio.state())).records).toHaveLength(16);
 await activate(page,'[data-drawer="1"]');await activate(page,'[data-item="egg-16"]');await settle(page);expect((await page.evaluate(()=>window.__studio.state())).records.at(-1)).toEqual({id:'egg-16',drawer:1});
 await page.locator('#rotate-right').click();await turn(page);expect((await page.evaluate(()=>window.__studio.state())).face).toBe(3);await expect(page.locator('[data-drawer="0"]')).toBeHidden();await expect(page.locator('[data-drawer="18"]')).toBeVisible();
 await activate(page,'[data-drawer="18"]');await activate(page,'[data-item="milk-0"]');await settle(page);expect((await page.evaluate(()=>window.__studio.state())).records.at(-1)).toEqual({id:'milk-0',drawer:18});
 for(let i=0;i<3;i++){await page.locator('#rotate-right').click();await turn(page);}const s=await page.evaluate(()=>window.__studio.state());expect(s.face).toBe(0);expect(s.records).toHaveLength(18);expect(Math.abs(s.angle-Math.PI*2)).toBeLessThan(.025);
});

test('dragging rotates the cabinet without accidentally throwing or selecting',async({page})=>{
 const r=await page.locator('[data-drawer="0"]').boundingBox();await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.4+180,r.y+r.height*.5,{steps:14});await page.mouse.up();await turn(page);const s=await page.evaluate(()=>window.__studio.state());expect(s.face).not.toBe(0);expect(s.active).toBe(-1);expect(s.records).toHaveLength(0);
});

test('material sounds contain bounded, non-silent transient audio',async()=>{
 const signatures=[];for(const type of ['milk','soda','apple','orange','yogurt','egg'])for(const kind of ['place','drop','drawer','arrange','throw']){const pcm=makeFoley(kind,type,22050,3);let energy=0,peak=0;for(const v of pcm){energy+=v*v;peak=Math.max(peak,Math.abs(v));}expect(peak).toBeLessThan(1);expect(energy/pcm.length).toBeGreaterThan(.000001);if(kind==='place')signatures.push(energy);}
 expect(new Set(signatures).size).toBe(6);
});
