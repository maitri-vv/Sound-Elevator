const $=s=>document.querySelector(s),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
let altitude=0,position=0,nearest=STOPS[0],audio,enabled=false,lastY=0,pending=false,seen=new Set(),noticeTimer;
const ambientSky=new AmbientSky($('#backdrop'));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const imgURL=id=>ASSETS[id];
const escapeText=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motionFor=s=>s.motion||'still';
const gestureFor=s=>s.gesture||'';
function factText(s){return escapeText(s.text.replace(/<br\s*\/?>/g,' '));}
const pictureElements=[];
STOPS.forEach((s,i)=>{
 const el=document.createElement('section');el.className='stop motion-'+motionFor(s)+(s.h>=10000?' high':'');el.dataset.id=s.id;el.dataset.gesture=s.gesture||'';s.gesture=gestureFor(s);s.open=1;s.reveal=0;s.energy=0;s.focus=0;s.crossed=false;
 const hint={window:'Slide sideways to close the glass',mist:'Brush across the mist',water:'Trace the water',breeze:'Brush past to stir the air'}[s.gesture]||'';
 el.innerHTML=(s.chapter?'<div class="chapter">'+escapeText(s.chapter)+'</div>':'')+'<figure class="object"><div class="art-frame"'+(s.gesture?' tabindex="0"'+(s.gesture==='window'?' role="slider" aria-label="Window opening" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"':' aria-label="'+escapeText(hint)+'. Arrow keys explore this illustration."'):'')+'><div class="art-depth"><img class="art-image" width="360" height="320" draggable="false" alt="'+escapeText(s.title)+'"></div><div class="art-atmosphere" aria-hidden="true"></div><div class="touch-trace" aria-hidden="true"></div></div><figcaption><span class="height-note">'+s.h.toLocaleString()+' <small>m</small></span></figcaption>'+(s.gesture==='window'?'<span class="gesture-hint">'+hint+'</span>':'')+'</figure><div class="narrative"><h2>'+escapeText(s.title)+'</h2><p class="fact-copy">'+factText(s)+'</p></div>';

 const img=el.querySelector('img');img.decoding='async';img.loading='eager';img.fetchPriority=i<5?'high':'low';img.dataset.src=imgURL(s.art||s.id);pictureElements.push(img);s.el=el;s.img=img;s.frame=el.querySelector('.art-frame');s.state=false;$('#discoveries').append(el);wireGesture(s);
});
const interludes=[];
STOPS.slice(0,-1).forEach((s,i)=>{
 const next=STOPS[i+1],el=document.createElement('aside');el.className='interlude'+(s.h>=10000?' high':'')+(i%2?' offset-left':' offset-right');
 const note=s.trail||'',mini=s.detail;
 el.innerHTML='<span class="trail-line" aria-hidden="true"></span>'+(mini?'<img class="trail-detail" data-src="'+imgURL(mini)+'" alt="" width="76" height="64" loading="eager" decoding="async">':'')+(note?'<p>'+note+'</p>':'<span class="trail-mark" aria-hidden="true">· &nbsp; · &nbsp; ·</span>');
 el.dataset.position=(s.p+next.p)/2;$('#discoveries').append(el);interludes.push(el);
});
$('#elevator-art').src=imgURL('elevator');$('#elevator-art').fetchPriority='high';$('#ground-art').src=imgURL('ground');$('#ground-art').fetchPriority='high';$('#distant-city').src=imgURL('city-skyline');document.querySelectorAll('.cloud').forEach(i=>i.src=imgURL('d06'));$('#ice-clouds').src=imgURL('e01');$('#aurora-art').src=imgURL('e08');
// Load the current scene and its neighbours; keep decoded images when revisiting.
function loadNearby(index){
 for(let i=Math.max(0,index-2);i<=Math.min(STOPS.length-1,index+2);i++){
  const img=STOPS[i].img;
  if(!img.getAttribute('src')){img.fetchPriority=i===index?'high':'low';img.src=img.dataset.src;}
  for(const note of [interludes[i-1],interludes[i]]){const detail=note?.querySelector('img[data-src]');if(detail&&!detail.getAttribute('src'))detail.src=detail.dataset.src;}
 }
}
pictureElements.forEach(img=>img.addEventListener('error',()=>notice('An illustration could not load. Refresh to retry.')));
let savedJourney=null;
try{savedJourney=JSON.parse(localStorage.getItem('sound-elevator-journey'));}catch(e){}
if(savedJourney&&typeof savedJourney==='object'){
 if(Number.isFinite(savedJourney.volume))$('#volume').value=clamp(savedJourney.volume,0,100);
 if(Array.isArray(savedJourney.seen))seen=new Set(savedJourney.seen.filter(id=>STOPS.some(s=>s.id===id)));
}else savedJourney=null;
let saveTimer;
function saveJourney(){
 try{savedJourney={stop:position>350?nearest.id:savedJourney?.stop,volume:Number($('#volume').value),seen:[...seen]};localStorage.setItem('sound-elevator-journey',JSON.stringify(savedJourney));}catch(e){}
 refreshContinue();
}
function journeyUI(){
 document.body.classList.toggle('exploring',position>350);
 loadNearby(STOPS.indexOf(nearest));
 clearTimeout(saveTimer);saveTimer=setTimeout(saveJourney,400);
}
[0,2,5,10,20,30,50,80,120,200,320,500,850,1200,2400,4200,6000,9000,14000,20000,35000,65000,82000,100000].forEach(h=>{const t=document.createElement('span');t.className='tick';t.textContent=h.toLocaleString()+' m';t.dataset.height=h;$('.ruler').append(t)});
function layout(){
 // One common band length grows only when text size demands more reading space.
 let gap=720;
 for(let i=1;i<STOPS.length;i++){const a=STOPS[i-1],b=STOPS[i],note=interludes[i-1];gap=Math.max(gap,Math.max(a.el.offsetHeight,a.el.scrollHeight,b.el.offsetHeight,b.el.scrollHeight)+note.offsetHeight+64);}
 const counts=CHAPTERS.map((_,b)=>STOPS.filter(s=>s.band===b).length);
 BAND_LENGTH=Math.max(...counts)*gap;
 STOPS.forEach(s=>s.p=550+(s.band+(s.bandIndex+.5)/counts[s.band])*BAND_LENGTH);
 STOPS.at(-1).p=550+5*BAND_LENGTH;
 // Actual scene anchors take precedence at chapter boundaries.
 const boundaries=[10,100,1000,10000].filter(h=>!STOPS.some(s=>s.h===h)).map(h=>({h,p:550+Math.log10(h)*BAND_LENGTH}));
 POINTS.splice(0,POINTS.length,{h:0,p:0},...STOPS,...boundaries);POINTS.sort((a,b)=>a.h-b.h);
 interludes.forEach((el,i)=>el.dataset.position=(STOPS[i].p+STOPS[i+1].p)/2);
 TOP=STOPS.at(-1).p+1100;
 $('#world').style.height=(TOP+innerHeight)+'px';
 STOPS.forEach(s=>s.el.style.bottom=(innerHeight/2+s.p-s.el.offsetHeight/2)+'px');
 interludes.forEach(el=>el.style.bottom=(innerHeight/2+Number(el.dataset.position)-el.offsetHeight/2)+'px');
 document.querySelectorAll('.tick').forEach(t=>t.style.bottom=(innerHeight/2+interpolate(Number(t.dataset.height),'h','p'))+'px');
 $('.finish').style.top=Math.max(120,innerHeight/2-180)+'px';
}
function atmosphereReadout(){
 const a=Atmosphere.at(altitude),pct=a.pressurePercent;
 $('#horizon-value').textContent=(a.horizon<10?a.horizon.toFixed(1):Math.round(a.horizon).toLocaleString())+' km';
 $('#pressure-value').textContent=(pct>=1?pct.toFixed(1):pct>=.01?pct.toFixed(3):pct.toExponential(1))+'%';
 $('#boil-value').textContent=a.boiling===null?'No liquid':a.boiling.toFixed(1)+'°C';
 $('#sound-value').textContent=Math.round(a.sound)+' m/s';
 $('#temperature-value').textContent=a.temperature.toFixed(1)+'°C';
}
function goPosition(p,smooth=true){scrollTo({top:TOP-clamp(p,0,TOP),behavior:smooth&&!reduced?'smooth':'instant'})}
function go(h,smooth=true){goPosition(interpolate(h,'h','p'),smooth)}
function notice(t){$('#audio-status').textContent=t;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#audio-status').textContent='',5000)}
const skyColors=[[0,[215,240,234]],[30,[157,218,233]],[300,[106,185,219]],[3000,[91,157,200]],[11000,[73,119,170]],[25000,[30,55,95]],[65000,[10,20,42]],[100000,[3,8,19]]];
function colorAt(h){let i=skyColors.findIndex(x=>x[0]>=h);if(i<=0)return skyColors[0][1];const a=skyColors[i-1],b=skyColors[i],t=(h-a[0])/(b[0]-a[0]);return a[1].map((n,k)=>Math.round(n+(b[1][k]-n)*t))}
function lowerScenery(){
 const ground=1-clamp((altitude-5)/25),canopy=clamp((altitude-7)/23)*(1-clamp((altitude-600)/900));
 const meadow=$('#meadow-layer'),trees=$('#canopy-layer');
 meadow.style.opacity=ground*.72;trees.style.opacity=canopy*.62;
 meadow.style.visibility=ground>0?'visible':'hidden';trees.style.visibility=canopy>0?'visible':'hidden';
 meadow.style.setProperty('--rise',Math.min(altitude,30)*1.8+'px');
 trees.style.setProperty('--rise',clamp(altitude/1500)*170+'px');
 meadow.classList.toggle('scenery-active',ground>0);trees.classList.toggle('scenery-active',canopy>0);
}
function scenery(){ambientSky.update(altitude,position);lowerScenery();const rgb=colorAt(altitude),linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}),luminance=.2126*linear[0]+.7152*linear[1]+.0722*linear[2],night=luminance<.179;document.body.style.setProperty('--hud-ink',night?'#ffffff':'#000000');document.body.style.setProperty('--meter-bg',night?'#152b43':'#fffef4');document.body.style.setProperty('--meter-ink',night?'#f2f8ff':'#203a45');document.body.classList.toggle('night',night);document.body.style.setProperty('--sky',`rgb(${colorAt(altitude).join(',')})`);const groundMotion=clamp(position/950);$('#ground-art').style.transform=`translateY(${Math.min(position*.65,900)}px)`;$('#ground-art').style.opacity=1-clamp(position/750);const cabin=$('.cabin'),ch=$('#elevator-art').getBoundingClientRect().height||164,start=innerHeight-105-ch,target=innerHeight*.5-ch*.5;cabin.style.top=(start+(target-start)*clamp(position/950))+'px';cabin.classList.toggle('sealed',altitude>=1200);$('#cabin-state').textContent=altitude>=1200?'FIELD NOTES':'';const city=clamp((altitude-15)/35)*(1-clamp((altitude-500)/600));$('#distant-city').style.opacity=city*.3;$('#distant-city').style.transform=`translateY(${clamp(altitude/1000)*180}px) scale(${1-clamp(altitude/1400)*.5})`;const clouds=clamp((altitude-650)/650)*(1-clamp((altitude-12000)/5000));$('#cloud-layer').style.opacity=clouds*.65;$('#cloud-layer').style.transform=`translateY(${Math.sin(position/2400)*70}px)`;$('#ice-clouds').style.opacity=clamp((altitude-7000)/7000)*(1-clamp((altitude-22000)/12000))*.35;$('.star-field').style.opacity=clamp((altitude-20000)/45000);$('#aurora-art').style.opacity=clamp((altitude-83000)/15000)*.35;$('#mist').style.opacity=nearest.gesture==='mist'?clamp(1-Math.abs(position-nearest.p)/850)*.22*(1-nearest.reveal):0;$('#rain-effect').classList.toggle('active',nearest.sound==='rain'&&!nearest.state&&Math.abs(position-nearest.p)<800);}
function formatHeight(h){const places=h<1?5:h<10?3:h<100?2:h<1000?1:0;return h.toFixed(places).padStart(6,'0');}
function updateCounter(){const p=clamp(TOP-scrollY,0,TOP);$('#digits').textContent=formatHeight(interpolate(p,'p','h'));}
function update(){position=clamp(TOP-scrollY,0,TOP);altitude=interpolate(position,'p','h');nearest=STOPS.reduce((a,s)=>Math.abs(s.p-position)<Math.abs(a.p-position)?s:a,STOPS[0]);$('#digits').textContent=formatHeight(altitude);$('.progress i').style.height=position/TOP*100+'%';$('#current').textContent=position<350?'The world at your feet':position>TOP-500?'Everything, all the way below':nearest.title;$('#moving').textContent=position<15?'AT THE SURFACE':Math.abs(scrollY-lastY)>2?(scrollY<lastY?'GOING UP':'GOING DOWN'):'LISTENING';lastY=scrollY;if(Math.abs(nearest.p-position)<430)seen.add(nearest.id);$('#discovered').textContent=seen.size+' / '+STOPS.length;$('#finish-count').textContent=`You discovered ${seen.size} of ${STOPS.length} little scenes.`;$('#previous').disabled=position<20;$('#next').disabled=position>TOP-20;STOPS.forEach(s=>{const distance=s.p-position;s.focus=clamp(1-Math.abs(distance)/(innerHeight*.8));s.el.classList.toggle('in-view',Math.abs(distance)<innerHeight);s.el.classList.toggle('arrived',s.focus>.58);s.el.style.setProperty('--focus',s.focus.toFixed(3));s.el.style.setProperty('--pass',clamp((position-s.p+innerHeight*.55)/innerHeight).toFixed(3));s.el.style.setProperty('--drift',reduced?'0px':clamp(distance*.035,-24,24)+'px');if(Math.abs(distance)<90&&!s.crossed){s.crossed=true;s.el.classList.remove('encounter');void s.el.offsetWidth;s.el.classList.add('encounter')}if(Math.abs(distance)>700)s.crossed=false;});journeyUI();scenery();atmosphereReadout();void SoundWorld.preload(SOUNDSCAPES[nearest.id]?.track).catch(()=>{});if(audio)audio.update(altitude,position,nearest);pending=false}
let soundRequest=0;
function soundControls(){
 $('#sound').textContent=enabled?'\u266b Sound on':'\u266b Sound off';
 $('#sound').setAttribute('aria-pressed',String(enabled));
 $('#start').textContent=enabled?'Begin the climb':'\u266b Turn on & explore';
}
async function enableSound(on){
 const request=++soundRequest;enabled=on;soundControls();clearTimeout(noticeTimer);$('#audio-status').textContent='';
 try{
  update();
  if(!audio){if(!on)return;audio=new SoundWorld(altitude,position,nearest);audio.setVolume(Number($('#volume').value)/100)}
  await audio.setEnabled(on);
 }catch(e){if(request===soundRequest){enabled=false;soundControls();notice('Sound could not start. Tap Sound to try again.')}}
}

function wireGesture(s){
 const f=s.frame;let drag=null;
 const show=(x,y)=>{f.style.setProperty('--finger-x',x*100+'%');f.style.setProperty('--finger-y',y*100+'%');f.style.setProperty('--look-x',(x-.5)*10+'px');f.style.setProperty('--look-y',(y-.5)*8+'px');f.classList.add('touched');};
 const adjust=(x,y,amount=.07)=>{show(x,y);s.energy=clamp(s.energy+amount);if(s.gesture==='mist')s.reveal=clamp(s.reveal+amount);f.style.setProperty('--reveal',s.reveal);if(audio)audio.update(altitude,position,nearest);};
 const windowValue=v=>{s.open=clamp(v);s.state=s.open<.5;f.style.setProperty('--closed',1-s.open);f.setAttribute('aria-valuenow',Math.round(s.open*100));f.setAttribute('aria-valuetext',Math.round(s.open*100)+' percent open');s.el.classList.toggle('window-shut',s.state);if(audio)audio.update(altitude,position,nearest);};
 f.addEventListener('pointerdown',e=>{if(!s.gesture)return;const r=f.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,open:s.open};if(e.pointerType==='touch')adjust(clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height),.16);});
 f.addEventListener('pointermove',e=>{if(reduced&&!s.gesture)return;const r=f.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width),y=clamp((e.clientY-r.top)/r.height);if(drag&&s.gesture==='window'){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>5){windowValue(drag.open+dx/Math.max(130,r.width*.7));if(f.setPointerCapture)f.setPointerCapture(e.pointerId);}}else adjust(x,y,.025);});
 const release=()=>{drag=null;};f.addEventListener('pointerup',release);f.addEventListener('pointercancel',release);f.addEventListener('pointerleave',()=>{f.classList.remove('touched');f.style.setProperty('--look-x','0px');f.style.setProperty('--look-y','0px');});
 f.addEventListener('keydown',e=>{if(!s.gesture||!['ArrowLeft','ArrowRight','Home','End',' '].includes(e.key))return;e.preventDefault();if(s.gesture==='window')windowValue(e.key==='Home'?0:e.key==='End'?1:s.open+(e.key==='ArrowLeft'?-.15:.15));else adjust(.5,.5,.35);});
}
$('#sound').onclick=()=>enableSound(!enabled);$('#start').onclick=()=>{goPosition(STOPS[0].p);if(!enabled)void enableSound(true)};$('#volume').oninput=()=>{if(audio)audio.setVolume(Number($('#volume').value)/100);saveJourney()};$('#restart').onclick=returnToSurface;$('#home').onclick=e=>{e.preventDefault();returnToSurface()};$('#next').onclick=()=>{const s=STOPS.find(s=>s.p>position+120);goPosition(s?s.p:TOP)};$('#previous').onclick=()=>{const s=[...STOPS].reverse().find(s=>s.p<position-120);goPosition(s?s.p:0)};$('#about').onclick=()=>$('#info').showModal();$('#close-info').onclick=()=>$('#info').close();
addEventListener('scroll',()=>{updateCounter();if(!pending){pending=true;requestAnimationFrame(update)}},{passive:true});addEventListener('resize',()=>{const h=altitude;layout();go(h,false);update()});document.addEventListener('visibilitychange',()=>{if(audio){if(document.hidden)audio.ctx.suspend();else if(enabled)audio.ctx.resume()}});
const mobileReadout=matchMedia('(max-width:650px)');
function sizeReadout(){document.querySelector('.atmosphere-details').open=!mobileReadout.matches}
mobileReadout.addEventListener('change',sizeReadout);sizeReadout();
function returnToSurface(){saveJourney();history.replaceState(null,'',location.pathname+location.search);goPosition(0,false);update()}
function linkedStop(){return STOPS.find(s=>location.hash==='#stop='+s.id)}
function openLinkedStop(){const stop=linkedStop();if(stop){goPosition(stop.p,false);update();return true}return false}
history.scrollRestoration='manual';layout();if(!openLinkedStop()){goPosition(0,false);update();}
function refreshContinue(){
 const resumeStop=STOPS.find(s=>s.id===savedJourney?.stop);
 $('#continue').hidden=!resumeStop;
 if(resumeStop){$('#continue').textContent='Continue at '+resumeStop.h.toLocaleString()+' m';$('#continue').onclick=()=>{goPosition(resumeStop.p,false);update()};}
}
refreshContinue();
addEventListener('hashchange',openLinkedStop);
addEventListener('pagehide',saveJourney);
$('#share-stop').onclick=async()=>{
 const url=new URL(location.href);url.hash='stop='+nearest.id;
 try{await navigator.clipboard.writeText(url.href);notice('Link to this discovery copied.');}
 catch(e){$('#share-url').value=url.href;$('#share-dialog').showModal();$('#share-url').select();}
};
$('#close-share').onclick=()=>$('#share-dialog').close();
let interacted=false;['wheel','touchstart','keydown','pointerdown'].forEach(e=>addEventListener(e,()=>interacted=true,{once:true,passive:true}));addEventListener('load',()=>{const h=altitude;layout();if(!interacted&&!linkedStop())goPosition(0,false);else go(h,false);update()});if(document.fonts)document.fonts.ready.then(()=>{const h=altitude;layout();go(h,false);update()});
const c=$('#wave').getContext('2d');let lastFrame=0,lastAudioFrame=0;
function draw(t){const dt=Math.min(.05,(t-lastFrame)/1000||.016);lastFrame=t;
 c.clearRect(0,0,130,30);c.strokeStyle=altitude>=10000?'#eef7ff':'#284a59';c.lineWidth=1.6;c.beginPath();const data=audio?.waveform();
 for(let x=0;x<130;x++){const y=enabled&&data&&!reduced?15+(data[Math.floor(x/130*data.length)]-128)*.13:15;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
 for(const s of STOPS){if(s.focus<=0)continue;s.energy=Math.max(0,s.energy-dt*.24);s.reveal=Math.max(0,s.reveal-dt*.025);s.el.style.setProperty('--breeze',(1+s.energy*1.8).toFixed(2));s.frame.style.setProperty('--reveal',s.reveal.toFixed(3));}
 if(audio?.enabled&&t-lastAudioFrame>120){audio.update(altitude,position,nearest);lastAudioFrame=t;}
 requestAnimationFrame(draw);
}requestAnimationFrame(draw);
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'navigate_sound_elevator',description:'Navigate the illustrated climb to a height between 0 and 100000 meters.',inputSchema:{type:'object',properties:{height:{type:'number',minimum:0,maximum:100000}},required:['height'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({height})=>{if(!Number.isFinite(height)||height<0||height>100000)throw Error('Height must be between 0 and 100000');go(height,false);update();return {height:Math.round(altitude),scene:nearest.title}}})).catch(()=>{})}catch(e){}}
