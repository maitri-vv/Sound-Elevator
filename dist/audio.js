// Recorded audio only. The selected scene plays at its illustrative listening level.
class SoundWorld {
 static recordings=new Map();
 static preload(track){
  if(!track)return Promise.resolve();
  if(!this.recordings.has(track)){
   const request=fetch('sounds/'+track+'.mp3').then(r=>{if(!r.ok)throw Error('Recording unavailable');return r.arrayBuffer()}).catch(error=>{this.recordings.delete(track);throw error});
   this.recordings.set(track,request);
  }
  return this.recordings.get(track);
 }
 constructor(h=0,p=0,current=STOPS[0]){
  const c=this.ctx=new(window.AudioContext||window.webkitAudioContext)();
  this.master=c.createGain();this.master.gain.value=0;
  const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;
  this.analyser=c.createAnalyser();this.analyser.fftSize=256;
  this.master.connect(limiter).connect(this.analyser).connect(c.destination);
  this.samples=new Uint8Array(this.analyser.fftSize);this.layers=new Map();this.played=new Map();this.oneShots=new Set();this.volume=.35;this.enabled=false;
  this.height=h;this.position=p;this.current=current;this.loading=new Map();this.toggleVersion=0;
 }
 loadTrack(id){
  if(this.layers.has(id))return Promise.resolve();
  if(this.loading.has(id))return this.loading.get(id);
  const request=(async()=>{try{
   const bytes=await SoundWorld.preload(id);
   const buffer=await this.ctx.decodeAudioData(bytes.slice(0)),c=this.ctx;
   const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),pan=c.createStereoPanner();
   source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=14000;gain.gain.value=0;
   filter.connect(gain).connect(pan).connect(this.master);if(!Object.values(SOUNDSCAPES).some(a=>a.track===id&&a.mode==='once')){source.connect(filter);source.start();}
   this.layers.set(id,{source,buffer,filter,gain,pan});this.update(this.height,this.position,this.current);
  }finally{this.loading.delete(id)}})();
  this.loading.set(id,request);return request;
 }
 async setEnabled(on){
  const version=++this.toggleVersion;this.enabled=on;
  if(on)this.played.clear();else{for(const n of this.oneShots){try{n.stop()}catch(e){}}this.oneShots.clear();}
  this.setVolume(this.volume);
  if(!on)return;
  try{await this.ctx.resume();if(version!==this.toggleVersion)return;await this.playCurrent();}
  catch(error){if(version!==this.toggleVersion)return;this.enabled=false;this.setVolume(this.volume);throw error;}
 }
 async playCurrent(){
  const current=this.current,a=SOUNDSCAPES[current.id];
  if(!this.enabled)return;
  const status=document.querySelector('#audio-status');
  if(!a?.track){status.textContent='Sound is on. This stop has no recording.';this.update(this.height,this.position,current);return;}
  if(!this.layers.has(a.track))status.textContent='Loading this stop’s recording…';
  try{await this.loadTrack(a.track);}catch(error){if(this.enabled&&this.current===current)status.textContent='This recording could not load. Toggle sound to retry.';return;}
  if(!this.enabled||this.current!==current)return;
  status.textContent='';this.update(this.height,this.position,current);
 }
 setVolume(v){this.volume=Math.max(0,Math.min(1,v));const gain=this.master.gain,t=this.ctx.currentTime;gain.cancelScheduledValues(t);gain.setValueAtTime(gain.value,t);gain.linearRampToValueAtTime(this.enabled?this.volume:0,t+.008)}
 waveform(){this.analyser.getByteTimeDomainData(this.samples);return this.samples}
 update(h,p,current){
  const changed=this.current!==current;
  this.height=h;this.position=p;this.current=current;const targets=new Map();
  if(changed&&this.enabled){this.played.clear();void this.playCurrent();}
  for(const s of STOPS){const a=SOUNDSCAPES[s.id];if(!a||!a.track)continue;
   // Play the selected scene at its listening level, including between anchors.
   const envelope=s===current?1:0;
   const attenuation=1;
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
   v.gain.gain.setTargetAtTime(a?.level||0,t,.025);
   v.filter.frequency.setTargetAtTime(a?.cutoff||800,t,.025);v.pan.pan.setTargetAtTime(a?.pan||0,t,.025);
  }
 }
}
