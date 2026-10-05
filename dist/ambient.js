// Decorative altitude bands, not a simulation of weather or animal flight records.
class AmbientSky {
 constructor(root){
  this.root=document.createElement('div');
  this.root.className='ambient-sky';this.root.setAttribute('aria-hidden','true');
  const bands=[
   ['pollen',8,0,0,12,35],
   ['leaves',5,3,12,65,180],
   ['birds',4,15,60,600,1600],
   ['wisps',4,650,1800,6500,12000],
   ['ice',6,8000,12000,18000,24000],
   ['glints',9,24000,42000,100000,110000],
   ['veil',2,75000,85000,100000,110000]
  ];
  this.layers=bands.map(([name,count,start,enter,leave,end])=>{
   const el=document.createElement('div');el.className='ambient-band ambient-'+name;
   for(let i=0;i<count;i++){
    const particle=document.createElement('i');
    particle.style.setProperty('--i',i);
    particle.style.setProperty('--x',((i%2?77:6)+(i*7)%17)+'%');
    particle.style.setProperty('--y',(12+(i*19)%65)+'%');
    el.append(particle);
   }
   this.root.append(el);return {el,start,enter,leave,end};
  });
  root.append(this.root);
  const visibility=()=>this.root.classList.toggle('ambient-paused',document.hidden);
  document.addEventListener('visibilitychange',visibility);visibility();
 }
 update(height,position){
  this.root.hidden=height<0;
  if(height<0){for(const {el} of this.layers)el.classList.remove('is-active');return;}
  const clamp=n=>Math.max(0,Math.min(1,n));
  for(const {el,start,enter,leave,end} of this.layers){
   const amount=(enter===start?1:clamp((height-start)/(enter-start)))*(1-clamp((height-leave)/(end-leave)));
   el.style.opacity=(amount*.48).toFixed(3);
   el.classList.toggle('is-active',amount>.005);
  }
  // Bounded scroll parallax: background detail moves gently with the elevator.
  this.root.style.setProperty('--ambient-rise',(-Math.sin(position/2200)*22).toFixed(1)+'px');
 }
}

// Decorative depth habitats. Blend between scene anchors, not nearest-stop switches.
class AmbientDepth {
 constructor(root){
  this.root=root;root.replaceChildren();this.layers={};
  for(const name of ['soil','cave','ocean','ice','interior']){
   const el=document.createElement('div');el.className='depth-habitat depth-'+name;
   const wash=document.createElement('div');wash.className='depth-wash';el.append(wash);
   for(let i=0;i<12;i++){const particle=document.createElement('i');particle.style.setProperty('--i',i);particle.style.setProperty('--x',(i%2?82+(i*3)%15:2+(i*5)%17)+'%');particle.style.setProperty('--y',((i*23)%100)+'%');el.append(particle);}
   root.append(el);this.layers[name]=el;
  }
  document.addEventListener('visibilitychange',()=>root.classList.toggle('depth-paused',document.hidden));
 }
 habitat(stop){return stop.environment==='ground'?(stop.h>-50?'soil':'cave'):stop.environment;}
 update(position,height){
  const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
  const entry=smooth(-position/1200),weights={soil:0,cave:0,ocean:0,ice:0,interior:0};
  let a=UNDERGROUND_STOPS[0],b=a;
  for(let i=0;i<UNDERGROUND_STOPS.length-1;i++){
   if(position<=UNDERGROUND_STOPS[i].p){a=UNDERGROUND_STOPS[i];b=UNDERGROUND_STOPS[i+1];}else break;
  }
  const t=a===b?0:smooth((a.p-position)/(a.p-b.p));
  weights[this.habitat(a)]+=1-t;weights[this.habitat(b)]+=t;
  const palettes={soil:[65,56,43],cave:[30,35,41],ocean:[5,23,38],ice:[24,58,78],interior:[52,29,29]};
  const rgb=[215,240,234].map((v,k)=>Math.round(v*(1-entry)+entry*Object.keys(weights).reduce((sum,key)=>sum+weights[key]*palettes[key][k],0)));
  this.root.style.opacity=entry.toFixed(4);
  this.root.style.setProperty('--depth-shift',(Math.sin(position/3500)*24).toFixed(2)+'px');
  this.root.style.setProperty('--sunbeams',Math.max(0,1-(-height-200)/1100).toFixed(3));
  this.root.style.setProperty('--core-warmth',smooth((-height-35000)/2900000).toFixed(3));
  for(const [key,el] of Object.entries(this.layers)){el.style.opacity=weights[key].toFixed(4);el.classList.toggle('depth-active',weights[key]*entry>.005);}
  return {entry,rgb,weights};
 }
}
