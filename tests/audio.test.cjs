const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
function harness({resume=Promise.resolve(),fetcher}={}){
 const requested=[],status={textContent:''};
 const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v}});
 const node=()=>({gain:param(),frequency:param(),pan:param(),threshold:param(),ratio:param(),connect(to){return to},disconnect(){},start(){},stop(){}});
 class Context{
  currentTime=0;
  destination=node();
  createGain(){return node()}
  createDynamicsCompressor(){return node()}
  createAnalyser(){return {...node(),fftSize:256,getByteTimeDomainData(){}}}
  createBufferSource(){return node()}
  createBiquadFilter(){return node()}
  createStereoPanner(){return node()}
  resume(){return resume}
  async decodeAudioData(){return {duration:1}}
 }
 const stops=[{id:'low',h:0,p:0},{id:'high',h:9000,p:10000},{id:'quiet',h:10000,p:11000}];
 const sounds={low:{track:'birds',gain:.2,kind:'context'},high:{track:'rotor',gain:.3,kind:'recording'},quiet:{kind:'quiet'}};
 const sandbox={window:{AudioContext:Context},document:{querySelector:()=>status},STOPS:stops,SOUNDSCAPES:sounds,fetch:async url=>{requested.push(url);return fetcher?fetcher(url):{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/audio.js'),'utf8')+'\nglobalThis.SoundWorld=SoundWorld;',sandbox);
 return {SoundWorld:sandbox.SoundWorld,stops,status,requested};
}
test('first enable loads only the current high scene and keeps it audible between anchors',async()=>{
 const {SoundWorld,stops,requested}=harness(),audio=new SoundWorld(9000,10000,stops[1]);
 await audio.setEnabled(true);
 assert.deepEqual(requested,['sounds/rotor.mp3']);
 audio.update(9450,10450,stops[1]);assert.equal(audio.layers.get('rotor').gain.gain.value,.3);
 audio.update(10000,11000,stops[2]);assert.equal(audio.layers.get('rotor').gain.gain.value,0);
});
test('off wins while resume is pending',async()=>{
 const gate=deferred(),{SoundWorld,stops,requested}=harness({resume:gate.promise});
 const audio=new SoundWorld(9000,10000,stops[1]);const enabling=audio.setEnabled(true);
 await audio.setEnabled(false);assert.equal(audio.enabled,false);assert.equal(audio.master.gain.value,0);
 gate.resolve();await enabling;assert.equal(audio.enabled,false);assert.deepEqual(requested,[]);
});
test('late recording cannot unmute after off and cached retry is immediate',async()=>{
 const gate=deferred(),{SoundWorld,stops}=harness({fetcher:()=>gate.promise});
 const audio=new SoundWorld(9000,10000,stops[1]);const enabling=audio.setEnabled(true);
 await Promise.resolve();await audio.setEnabled(false);
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await enabling;
 assert.equal(audio.master.gain.value,0);assert.equal(audio.enabled,false);
 await audio.setEnabled(true);assert.equal(audio.enabled,true);assert.equal(audio.layers.get('rotor').gain.gain.value,.3);
});
test('rapid on-off-on honors the final request',async()=>{
 const gate=deferred(),{SoundWorld,stops}=harness({resume:gate.promise}),audio=new SoundWorld(9000,10000,stops[1]);
 const a=audio.setEnabled(true),b=audio.setEnabled(false),c=audio.setEnabled(true);
 gate.resolve();await Promise.all([a,b,c]);assert.equal(audio.enabled,true);assert.equal(audio.master.gain.value,.35);
});
test('failed recordings show retry feedback and can recover',async()=>{
 let attempts=0;const {SoundWorld,stops,status}=harness({fetcher:async()=>({ok:++attempts>1,arrayBuffer:async()=>new ArrayBuffer(8)})});
 const audio=new SoundWorld(9000,10000,stops[1]);await audio.setEnabled(true);
 assert.match(status.textContent,/could not load/);await audio.setEnabled(false);await audio.setEnabled(true);
 assert.equal(attempts,2);assert.equal(status.textContent,'');assert.ok(audio.layers.has('rotor'));
});
test('a late load follows the latest scene instead of reviving the old one',async()=>{
 const gate=deferred(),started=deferred(),{SoundWorld,stops}=harness({fetcher:async url=>{if(url.includes('rotor')){started.resolve();return gate.promise}return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}}});
 const audio=new SoundWorld(9000,10000,stops[1]);const enabling=audio.setEnabled(true);await started.promise;
 audio.update(0,0,stops[0]);await audio.playCurrent();
 gate.resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await enabling;
 assert.equal(audio.current.id,'low');assert.equal(audio.layers.get('rotor').gain.gain.value,0);assert.equal(audio.layers.get('birds').gain.gain.value,.2);
});
