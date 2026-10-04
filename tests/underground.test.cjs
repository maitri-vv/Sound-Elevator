const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function route(){
 const context=vm.createContext({ASSETS:{}});
 for(const file of ['stops.js','underground.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist',file),'utf8'),context);
 vm.runInContext(`SKY_STOPS.forEach((s,i)=>s.p=1000+i*800);UNDERGROUND_STOPS.forEach((s,i)=>s.p=-1100-i*900);POINTS.splice(0,POINTS.length,...STOPS,{h:0,p:0});POINTS.sort((a,b)=>a.h-b.h||a.p-b.p);globalThis.route={STOPS,UNDERGROUND_STOPS,SKY_STOPS,POINTS,interpolate};`,context);
 return context.route;
}
test('surface is zero, with anchors strictly ordered in both directions',()=>{
 const r=route();assert.equal(r.interpolate(0,'h','p'),0);assert.equal(r.interpolate(0,'p','h'),0);
 for(let i=1;i<r.POINTS.length;i++)assert.ok(r.POINTS[i].p>r.POINTS[i-1].p);
 assert.equal(r.SKY_STOPS.length,66);assert.equal(r.UNDERGROUND_STOPS.length,10);
});
test('depths round-trip through the signed logarithmic mapping',()=>{
 const r=route();
 for(const h of [-12262,-5000,-2800,-600,-90,-25,-2,-.25,-.01,.18,3,300,8849,100000]){
  const result=r.interpolate(r.interpolate(h,'h','p'),'p','h');
  assert.ok(Math.abs(result-h)<.000001,`${h} became ${result}`);
 }
});
test('scrolling down crosses the surface continuously and reaches every underground stop',()=>{
 const r=route();
 let previous=0;
 for(let p=-1;p>=r.UNDERGROUND_STOPS.at(-1).p;p-=31){const h=r.interpolate(p,'p','h');assert.ok(h<previous);previous=h;}
 for(const stop of r.UNDERGROUND_STOPS)assert.ok(Math.abs(r.interpolate(stop.p,'p','h')-stop.h)<.000001);
});
test('underground content has unique IDs, source links, depth labels and valid sprite cells',()=>{
 const r=route();assert.equal(new Set(r.STOPS.map(s=>s.id)).size,r.STOPS.length);
 for(const s of r.UNDERGROUND_STOPS){assert.match(s.source,/^https:\/\//);assert.ok(s.depthNote);assert.ok(s.listening);assert.ok(s.sprite>=0&&s.sprite<=8);}
});
