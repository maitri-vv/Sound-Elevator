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
