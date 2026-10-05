// Small, optional illustrated encounters. No invented recordings or scroll capture.
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.id='encounter-layer';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<div class="cave-torch"><div class="mineral-wall"></div></div><div class="sonar-ring"></div><div class="sonar-life"><i></i><i></i><i></i></div><div class="curious-visitor"><i></i></div><div class="crossing-wash"></div>';
 document.body.append(layer);
 const status=document.createElement('span');status.className='encounter-status';status.setAttribute('role','status');document.body.append(status);
 const cabin=document.querySelector('.cabin'),knock=document.querySelector('#cabin-knock');
 let habitat='',stopId='',pointer=null,lightTimer,down=null,lastPulse=-Infinity,lastKnock=-Infinity,lastSide=0,crossedAt=-Infinity,visitorTimer,replyTimer,visitorShown=new Set();
 function replay(el,name){el.classList.remove(name);void el.offsetWidth;el.classList.add(name);}
 function lightAt(x,y){layer.style.setProperty('--light-x',x+'px');layer.style.setProperty('--light-y',y+'px');}
 function pulse(x=innerWidth*.7,y=innerHeight*.35){
  if(habitat!=='ocean'||document.hidden||performance.now()-lastPulse<3200)return;
  lastPulse=performance.now();layer.style.setProperty('--sonar-x',x+'px');layer.style.setProperty('--sonar-y',y+'px');replay(layer,'sonar-playing');status.textContent='A visual sonar pulse reveals distant silhouettes.';
 }
 knock.addEventListener('click',()=>{
  if(performance.now()-lastKnock<1200)return;lastKnock=performance.now();
  replay(cabin,'knock-reply');status.textContent='A little tap back from your travelling companion.';
  clearTimeout(replyTimer);replyTimer=setTimeout(()=>cabin.classList.remove('knock-reply'),1800);
 });
 function explore(x,y,target){
  if(document.hidden||target.closest('button,a,input,dialog,.readout,header')){layer.classList.remove('torch-on');return;}
  if(habitat==='cave'){lightAt(x,y);layer.classList.add('torch-on');}
  else if(habitat==='ocean')pulse(x,y);
 }
 document.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||e.target.closest('button,a,input,dialog,.readout,header'))return;down={x:e.clientX,y:e.clientY,scroll:scrollY,time:performance.now()};},{passive:true});
 document.addEventListener('pointermove',e=>{
  if(e.pointerType==='touch')return;
  pointer={x:e.clientX,y:e.clientY};explore(e.clientX,e.clientY,e.target);
 },{passive:true});
 document.addEventListener('pointerup',e=>{
  if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<10&&Math.abs(scrollY-down.scroll)<4&&performance.now()-down.time<600){
   explore(e.clientX,e.clientY,e.target);
   if(e.pointerType==='touch'){clearTimeout(lightTimer);lightTimer=setTimeout(()=>layer.classList.remove('torch-on'),1800);}
  }
  down=null;
 },{passive:true});
 document.addEventListener('pointercancel',()=>{down=null;layer.classList.remove('torch-on');},{passive:true});
 document.documentElement.addEventListener('pointerleave',()=>{pointer=null;layer.classList.remove('torch-on');});
 // The illustrations themselves provide a keyboard equivalent, without extra controls.
 for(const stop of UNDERGROUND_STOPS){
  if(stop.environment!=='ocean'&&!(stop.environment==='ground'&&stop.h<=-50))continue;
  stop.frame.tabIndex=0;
  stop.frame.addEventListener('focus',()=>{const r=stop.frame.getBoundingClientRect();explore(r.left+r.width/2,r.top+r.height/2,stop.frame);});
  stop.frame.addEventListener('blur',()=>layer.classList.remove('torch-on'));
 }
 function sync(){
  const below=position< -600,environment=below?nearest.environment:'';
  const next=environment==='ocean'?'ocean':environment==='ground'&&nearest.h<=-50?'cave':'';
  const changed=next!==habitat||nearest.id!==stopId;
  if(next!==habitat){habitat=next;layer.dataset.habitat=next;layer.classList.remove('sonar-playing','torch-on');clearTimeout(lightTimer);status.textContent='';}
  if(changed&&pointer){const target=document.elementFromPoint(pointer.x,pointer.y);if(target)explore(pointer.x,pointer.y,target);}
  const atCentre=nearest.id==='under-centre'&&position<nearest.p+300;
  document.body.classList.toggle('at-earth-centre',atCentre);
  const side=position>180?1:position< -180?-1:0;
  if(side&&lastSide&&side!==lastSide&&performance.now()-crossedAt>5000){replay(layer,'surface-crossing');crossedAt=performance.now();}
  if(side)lastSide=side;
  if(nearest.id!==stopId){
   stopId=nearest.id;clearTimeout(visitorTimer);layer.classList.remove('visitor-arrived');
   cabin.dataset.reaction=['under-giant-squid','under-crystals','under-icecube'].includes(stopId)?'curious':stopId==='under-metro'?'listening':'';
  }
  clearTimeout(visitorTimer);
  if(stopId==='under-midnight'&&Math.abs(position-nearest.p)<250&&!visitorShown.has(stopId)&&!document.hidden){visitorTimer=setTimeout(()=>{if(nearest.id==='under-midnight'&&!document.hidden){visitorShown.add(stopId);replay(layer,'visitor-arrived');}},3500);}
 }
 let frame;addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);},{passive:true});
 addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{layer.classList.toggle('encounters-paused',document.hidden);if(document.hidden){clearTimeout(visitorTimer);down=null;}else sync();});
 motion.addEventListener('change',()=>{layer.classList.remove('sonar-playing','visitor-arrived','surface-crossing');});
 sync();
})();
