// Recorded audio only. Scene envelopes are editorial; vertical attenuation is illustrative.
class SoundWorld {
 constructor(){
  const c=this.ctx=new(window.AudioContext||window.webkitAudioContext)();
  this.master=c.createGain();this.master.gain.value=0;
  const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;
  this.analyser=c.createAnalyser();this.analyser.fftSize=256;
  this.master.connect(limiter).connect(this.analyser).connect(c.destination);
  this.samples=new Uint8Array(this.analyser.fftSize);this.layers=new Map();this.played=new Map();this.oneShots=new Set();this.volume=.35;this.enabled=false;
  this.height=0;this.position=0;this.current=STOPS[0];this.ready=this.load();
 }
 async load(){
  const ordered=STOPS.slice().sort((a,b)=>Math.abs(a.p-this.position)-Math.abs(b.p-this.position));
  const ids=[...new Set(ordered.map(s=>SOUNDSCAPES[s.id]?.track).filter(Boolean))];let cursor=0;
  const worker=async()=>{while(cursor<ids.length){const id=ids[cursor++];try{
   const r=await fetch('sounds/'+id+'.mp3');if(!r.ok)throw Error('Recording unavailable');
   const buffer=await this.ctx.decodeAudioData(await r.arrayBuffer()),c=this.ctx;
   const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),pan=c.createStereoPanner();
   source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=14000;gain.gain.value=0;
   filter.connect(gain).connect(pan).connect(this.master);if(!Object.values(SOUNDSCAPES).some(a=>a.track===id&&a.mode==='once')){source.connect(filter);source.start();}
   this.layers.set(id,{source,buffer,filter,gain,pan});this.update(this.height,this.position,this.current);
  }catch(e){document.querySelector('#audio-status').textContent='One recording could not load. Other recordings remain available.'}}};
  await Promise.all([worker(),worker(),worker()]);
 }
 async setEnabled(on){await this.ctx.resume();this.enabled=on;if(on)this.played.clear();else for(const n of this.oneShots){try{n.stop()}catch(e){}}this.setVolume(this.volume);this.update(this.height,this.position,this.current)}
 setVolume(v){this.volume=Math.max(0,Math.min(1,v));this.master.gain.setTargetAtTime(this.enabled?this.volume:0,this.ctx.currentTime,.2)}
 waveform(){this.analyser.getByteTimeDomainData(this.samples);return this.samples}
 update(h,p,current){
  this.height=h;this.position=p;this.current=current;const targets=new Map();
  for(const s of STOPS){const a=SOUNDSCAPES[s.id];if(!a||!a.track)continue;
   // One pictured environment at a time: crossfade nearby scenes, not a literal shared geography.
   const index=STOPS.indexOf(s),before=s.p-(STOPS[index-1]?.p??0),after=(STOPS[index+1]?.p??s.p+900)-s.p;
   const span=p<s.p?before:after,phase=Math.min(1,Math.abs(p-s.p)/Math.max(500,span));
   const envelope=Math.cos(phase*Math.PI/2)**2;
   const distance=Math.hypot(a.reach,h-s.h),attenuation=a.kind==='context'?1:a.reach/distance;
   const opening=s.gesture==='window'?(s.open??1):1;
   const level=a.gain*envelope*attenuation*(.08+.92*opening)*(1+(s.energy||0)*.12);
   const cutoff=(800+12500*attenuation)*(.07+.93*opening);
   if(a.mode==='once'&&envelope<.1)this.played.delete(s.id);
   if(a.mode==='once'&&this.enabled&&envelope>.8&&this.layers.has(a.track)&&!this.played.has(s.id)){
    const layer=this.layers.get(a.track),shot=this.ctx.createBufferSource();shot.buffer=layer.buffer;shot.connect(layer.filter);shot.start();this.oneShots.add(shot);this.played.set(s.id,this.ctx.currentTime);shot.onended=()=>{this.oneShots.delete(shot);shot.disconnect()};
   }
   const old=targets.get(a.track);if(!old||level>old.level)targets.set(a.track,{level,cutoff,pan:(s.side||0)*.28});
  }
  for(const [id,v] of this.layers){const a=targets.get(id),t=this.ctx.currentTime;
   v.gain.gain.setTargetAtTime((current && SOUNDSCAPES[current.id]?.kind==='quiet')?0:(a?.level||0),t,.55);
   v.filter.frequency.setTargetAtTime(a?.cutoff||800,t,.45);v.pan.pan.setTargetAtTime(a?.pan||0,t,.4);
  }
 }
}
