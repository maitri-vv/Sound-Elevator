// Small, optional illustrated encounters. No invented recordings or scroll capture.
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.id='encounter-layer';layer.setAttribute('aria-hidden','true');
 layer.innerHTML='<div class="cave-torch"><div class="mineral-wall"></div></div><div class="water-ripples"><i></i><i></i><i></i></div><div class="ocean-life"><div class="water-animal lantern one"><img data-src="images/ambient-lanternfish.png" alt=""></div><div class="water-animal lantern two"><img data-src="images/ambient-lanternfish.png" alt=""></div><div class="water-animal jelly"><img data-src="images/ambient-jelly.png" alt=""></div><div class="water-animal coral"><img data-src="images/ambient-coral.png" alt=""></div></div><div class="crossing-wash"></div>';
 document.body.append(layer);
 const status=document.createElement('span');status.className='encounter-status';status.setAttribute('role','status');document.body.append(status);
 const cabin=document.querySelector('.cabin'),knock=document.querySelector('#cabin-knock');
 let habitat='',stopId='',pointer=null,lightTimer,down=null,lastPulse=-Infinity,lastKnock=-Infinity,lastSide=0,crossedAt=-Infinity,replyTimer;
 function replay(el,name){el.classList.remove(name);void el.offsetWidth;el.classList.add(name);}
 function lightAt(x,y){layer.style.setProperty('--light-x',x+'px');layer.style.setProperty('--light-y',y+'px');}
 function pulse(x=innerWidth*.7,y=innerHeight*.35){
  if(habitat!=='ocean'||document.hidden||performance.now()-lastPulse<4800)return;
  lastPulse=performance.now();layer.style.setProperty('--sonar-x',x+'px');layer.style.setProperty('--sonar-y',y+'px');replay(layer,'water-playing');
  if(!motion.matches){
   for(const animal of layer.querySelectorAll('.water-animal')){
    if(getComputedStyle(animal).opacity<.05)continue;
    const r=animal.getBoundingClientRect(),dx=r.left+r.width/2-x,dy=r.top+r.height/2-y,distance=Math.hypot(dx,dy),strength=Math.max(0,1-distance/850);
    if(!strength)continue;
    animal.getAnimations().forEach(a=>a.cancel());
    const coral=animal.classList.contains('coral'),shiftX=coral?0:dx/Math.max(1,distance)*35*strength,shiftY=coral?0:dy/Math.max(1,distance)*20*strength;
    animal.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${shiftX}px,${shiftY}px) rotate(${(dx>0?1:-1)*4*strength}deg)`,offset:.35},{transform:'translate(0,0) rotate(0deg)'}],{duration:2200,delay:Math.min(3500,distance/140*1000),easing:'ease-in-out'});
   }
  }
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
 // Keep one set of creatures alive across stops; never restart their travel phase.
 let oceanAmount=0,travel=0,lifeFrame=0,lastLifeTime=0;
 const animals=[...layer.querySelectorAll('.water-animal')];
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 function paintLife(){
  const depth=Math.max(0,-altitude),mobile=innerWidth<=650;
  layer.querySelector('.ocean-life').style.opacity=oceanAmount.toFixed(4);
  animals.forEach((el,i)=>{
   const coral=el.classList.contains('coral');
   let opacity,x,y;
   if(coral){
    const anchor=STOPS.find(s=>s.id==='under-brine');
    const distance=position-anchor.p;
    opacity=(1-smooth(800,2400,Math.abs(distance)))*.55;
    x=innerWidth-(mobile?50:115);y=innerHeight*.83+distance*.16;
   }else{
    const jelly=el.classList.contains('jelly');
    opacity=jelly?smooth(300,800,depth)*(1-smooth(2200,4200,depth))*.5:smooth(120,350,depth)*(1-smooth(1000,2000,depth))*.6;
    const phase=((travel/(jelly?95000:65000)+i*.37-position/85000)%1+1)%1;
    const progress=motion.matches?.25+i*.22:phase;
    opacity*=smooth(0,.12,progress)*(1-smooth(.88,1,progress));
    const left=i===1;
    x=left?(mobile?5:innerWidth*.13):innerWidth-(mobile?42:100);
    x+=Math.sin(travel/17000+i*2+position/6500)*(mobile?10:32);
    y=innerHeight*(.1+progress*.75);
   }
   el.style.opacity=opacity.toFixed(4);
   el.style.translate=x.toFixed(2)+'px '+y.toFixed(2)+'px';
  });
 }
 function tickLife(now){
  lifeFrame=0;if(document.hidden||motion.matches||oceanAmount<.001){lastLifeTime=0;return;}
  if(lastLifeTime)travel+=Math.min(80,now-lastLifeTime);lastLifeTime=now;paintLife();lifeFrame=requestAnimationFrame(tickLife);
 }
 function startLife(){if(!lifeFrame&&!document.hidden&&!motion.matches&&oceanAmount>.001)lifeFrame=requestAnimationFrame(tickLife);}
 function sync(){
  const below=position< -600,environment=below?nearest.environment:'';
  const next=environment==='ocean'?'ocean':environment==='ground'&&nearest.h<=-50?'cave':'';
  oceanAmount=ambientDepth.update(position,altitude).weights.ocean;
  if(oceanAmount>.001){for(const img of layer.querySelectorAll('img[data-src]')){if(!img.src)img.src=img.dataset.src;}}
  paintLife();startLife();
  const changed=next!==habitat;
  if(next!==habitat){habitat=next;layer.dataset.habitat=next;layer.classList.remove('water-playing','torch-on');layer.querySelectorAll('.water-animal').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));clearTimeout(lightTimer);status.textContent='';}
  if(next!==''&&changed&&pointer){const target=document.elementFromPoint(pointer.x,pointer.y);if(target)explore(pointer.x,pointer.y,target);}
  const atCentre=nearest.id==='under-centre'&&position<nearest.p+300;
  document.body.classList.toggle('at-earth-centre',atCentre);
  const side=position>180?1:position< -180?-1:0;
  if(side&&lastSide&&side!==lastSide&&performance.now()-crossedAt>5000){replay(layer,'surface-crossing');crossedAt=performance.now();}
  if(side)lastSide=side;
  if(nearest.id!==stopId){
   stopId=nearest.id;
   cabin.dataset.reaction=['under-giant-squid','under-crystals','under-icecube'].includes(stopId)?'curious':stopId==='under-metro'?'listening':'';
  }

 }
 let frame;addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);},{passive:true});
 addEventListener('resize',sync);document.addEventListener('visibilitychange',()=>{layer.classList.toggle('encounters-paused',document.hidden);layer.querySelectorAll('.water-animal').forEach(el=>el.getAnimations().forEach(a=>document.hidden?a.pause():a.play()));if(document.hidden){down=null;}else sync();});
 motion.addEventListener('change',()=>{layer.querySelectorAll('.water-animal').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));layer.classList.remove('water-playing','surface-crossing');paintLife();startLife();});
 sync();
})();
