// Small, optional illustrated encounters. No invented recordings or scroll capture.
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.id='encounter-layer';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<div class="cave-torch"><div class="mineral-wall"></div></div><div class="sonar-ring"></div><div class="sonar-life"><i></i><i></i><i></i></div><div class="curious-visitor"><i></i></div><div class="crossing-wash"></div>';
 document.body.append(layer);
 const action=document.createElement('button');action.id='depth-action';action.hidden=true;document.body.append(action);
 const status=document.createElement('span');status.className='encounter-status';status.setAttribute('role','status');document.body.append(status);
 const cabin=document.querySelector('.cabin'),knock=document.querySelector('#cabin-knock');
 let habitat='',stopId='',torch=false,down=null,lastPulse=-Infinity,lastKnock=-Infinity,lastSide=0,crossedAt=-Infinity,visitorTimer,replyTimer,visitorShown=new Set();
 const blocked=target=>!!target.closest('button,a,input,dialog,.readout,.narrative,.object,.intro,.finish,.deep-finish,header');
 function replay(el,name){el.classList.remove(name);void el.offsetWidth;el.classList.add(name);}
 function lightAt(x,y){layer.style.setProperty('--light-x',x+'px');layer.style.setProperty('--light-y',y+'px');}
 function pulse(x=innerWidth*.7,y=innerHeight*.35){
  if(habitat!=='ocean'||document.hidden||performance.now()-lastPulse<1800)return;
  lastPulse=performance.now();layer.style.setProperty('--sonar-x',x+'px');layer.style.setProperty('--sonar-y',y+'px');replay(layer,'sonar-playing');status.textContent='A visual sonar pulse reveals distant silhouettes.';
 }
 knock.addEventListener('click',()=>{
  if(performance.now()-lastKnock<1200)return;lastKnock=performance.now();
  replay(cabin,'knock-reply');status.textContent='A little tap back from your travelling companion.';
  clearTimeout(replyTimer);replyTimer=setTimeout(()=>cabin.classList.remove('knock-reply'),1800);
 });
 action.addEventListener('click',()=>{
  if(habitat==='ocean')pulse();
  else{torch=!torch;action.setAttribute('aria-pressed',String(torch));action.textContent=torch?'Light on · explore the walls':'Light up the cave';layer.classList.toggle('torch-on',torch);lightAt(innerWidth*.75,innerHeight*.4);}
 });
 action.addEventListener('keydown',e=>{
  if(habitat!=='cave'||!torch||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
  e.preventDefault();const x=parseFloat(layer.style.getPropertyValue('--light-x'))||innerWidth*.75,y=parseFloat(layer.style.getPropertyValue('--light-y'))||innerHeight*.4;
  lightAt(Math.max(0,Math.min(innerWidth,x+(e.key==='ArrowRight'?35:e.key==='ArrowLeft'?-35:0))),Math.max(0,Math.min(innerHeight,y+(e.key==='ArrowDown'?35:e.key==='ArrowUp'?-35:0))));
 });
 document.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0||blocked(e.target))return;down={x:e.clientX,y:e.clientY,scroll:scrollY,time:performance.now()};},{passive:true});
 document.addEventListener('pointermove',e=>{if(habitat==='cave'&&torch&&!blocked(e.target))lightAt(e.clientX,e.clientY);},{passive:true});
 document.addEventListener('pointerup',e=>{if(down&&!blocked(e.target)&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<10&&Math.abs(scrollY-down.scroll)<4&&performance.now()-down.time<600)pulse(e.clientX,e.clientY);down=null;},{passive:true});
 document.addEventListener('pointercancel',()=>down=null,{passive:true});
 function sync(){
  const below=position< -600,environment=below?nearest.environment:'';
  const next=environment==='ocean'?'ocean':environment==='ground'&&nearest.h<=-50?'cave':'';
  if(next!==habitat){habitat=next;layer.dataset.habitat=next;layer.classList.remove('sonar-playing','torch-on');torch=false;action.hidden=!next;action.textContent=next==='ocean'?'Send a sonar pulse':'Light up the cave';if(next==='cave')action.setAttribute('aria-pressed','false');else action.removeAttribute('aria-pressed');status.textContent='';}
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
