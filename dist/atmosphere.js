// ISA-compatible lower layers, extended by US Standard Atmosphere 1976 (COESA).
// Geometric metres -> geopotential metres; dry, mean atmosphere, not live weather.
const Atmosphere=(()=>{
 const R=287.05287,g=9.80665,earth=6356766;
 const levels=[0,11000,20000,32000,47000,51000,71000,84852];
 const lapse=[-.0065,0,.001,.0028,0,-.0028,-.002];
 const bases=[{t:288.15,p:101325}];
 for(let i=0;i<7;i++){const a=bases[i],dh=levels[i+1]-levels[i],L=lapse[i],t=a.t+L*dh;
  bases.push({t,p:L?a.p*Math.pow(a.t/t,g/(R*L)):a.p*Math.exp(-g*dh/(R*a.t))});}
 // COESA Table I p.68: 1 km geometric samples (86–100 km), Pa and kg/m³.
 const upperP=[.37338,.31259,.26173,.21919,.18359,.15381,.12867,.10801,.090560,.075966,.063765,.053711,.045057,.037946,.032011];
 const upperRho=[6.958e-6,5.824e-6,4.870e-6,4.081e-6,3.416e-6,2.860e-6,2.393e-6,2.000e-6,1.670e-6,1.393e-6,1.162e-6,9.685e-7,8.071e-7,6.725e-7,5.604e-7];
 const logMix=(a,b,f)=>Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*f);
 // IAPWS SR1-86(1992) saturation pressure; valid from triple point to critical point.
 function saturation(T){const tau=1-T/647.096;return 22064000*Math.exp(647.096/T*(-7.85951783*tau+1.84408259*tau**1.5-11.7866497*tau**3+22.6807411*tau**3.5-15.9618719*tau**4+1.80122502*tau**7.5))}
 function boiling(p){if(p<611.657)return null;let low=273.16,high=373.16;for(let i=0;i<34;i++){const t=(low+high)/2;if(saturation(t)>p)high=t;else low=t;}return(low+high)/2-273.15;}
 function at(height){const z=Math.max(0,Math.min(100000,height)),H=earth*z/(earth+z);let T,P,sound;
  if(z<86000){let i=0;while(i<6&&H>=levels[i+1])i++;const b=bases[i],L=lapse[i],dh=H-levels[i],Tm=b.t+L*dh;
   P=L?b.p*Math.pow(b.t/Tm,g/(R*L)):b.p*Math.exp(-g*dh/(R*b.t));
   // Molecular-weight correction at 80–86 km; <0.08 K, retained for continuity.
   const ratio=z<=80000?1:1-(1-.9995788)*((z-80000)/6000)**2;
   T=Tm*ratio;sound=Math.sqrt(1.4*R*Tm);
  }else{const k=Math.min(13,Math.floor((z-86000)/1000)),f=(z-86000)/1000-k;
   P=logMix(upperP[k],upperP[k+1],f);const rho=logMix(upperRho[k],upperRho[k+1],f);
   T=z<=91000?186.8673:263.1905-76.3232*Math.sqrt(1-((z/1000-91)/19.9429)**2);
   sound=Math.sqrt(1.4*P/rho);
  }
  // Exact spherical straight-line geometric horizon; no terrain or refraction.
  return {height:z,temperature:T-273.15,pressure:P,pressurePercent:P/101325*100,boiling:boiling(P),sound,horizon:Math.sqrt(2*6371000*z+z*z)/1000,gravityPercent:100*(6371000/(6371000+z))**2};
 }
 return{at,boiling,saturation};
})();
