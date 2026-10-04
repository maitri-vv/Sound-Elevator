// Real recordings. Fades are editorial listening transitions, not calibrated sound-pressure predictions.
const SOUNDSCAPES={};
function recording(ids,track,label,reach=25,gain=.25,mode='loop'){
 ids.split(' ').forEach(id=>SOUNDSCAPES[id]={track,label,reach,gain,mode,kind:'recording'});
}
function context(ids,track,label,gain=.16){
 recording(ids,track,label,1,gain);
 ids.split(' ').forEach(id=>SOUNDSCAPES[id].kind='context');
}
function quiet(ids,label='Quiet · no sound is attributed to this subject'){
 ids.split(' ').forEach(id=>SOUNDSCAPES[id]={kind:'quiet',label});
}
context('soil horizon','bird','Outdoor habitat · real birdsong recorded near a window',.13);
quiet('flea wadlow','Quiet · no invented jump or human sound effect');
context('clock','clock','Mechanical clock demonstration · the experiment used optical clocks',.16);
context('seed hummingbird sunflower sherman redwood','forest-wind','Woodland wind · habitat ambience recorded in Bourne Woods, UK',.13);
recording('city-window','piano','Piano phrase · slide the glass to muffle it',3,.30);
recording('owl','owl','Barn owl call · Dapoli, India',4,.23);
recording('elephant','elephant','African elephant rumble · original-speed research recording',15,.28);
recording('bee','bees','Honeybees buzzing at a hive',4,.20);
recording('giraffe','giraffe','Giraffe hum · original recording from the 2015 study',5,.30);
recording('bat','bat-slow','Big brown bat feeding buzz · slowed 10× to make ultrasound audible',7,.24);
context('windmast','forest-wind','Wind through trees · a real wind recording, not sound made by the meter',.16);
quiet('diver shibam geyser opera c11 pyramid insects lituya burj','Quiet · no unrelated event or species recording substituted');
recording('migrant-calls','night-flight','Black-crowned night-heron flight calls · Dresden',30,.23);
recording('city-tower','bell','Samariter Church bell III · the pictured church’s real bell',35,.24);
recording('turbine','turbine','Siemens SWT-2.3-101 wind turbine · recorded at the 99.5 m hub-height installation',100,.22);
quiet('dunes','Quiet · the available beach-sand squeak is not a Kelso dune boom');
quiet('droplet','Quiet · floating cloud droplets have no audible voice');
context('eiffel taipei bridge','taxi','Distant city traffic · a Berlin street recording used as urban ambience',.10);
recording('rain-cloud','rain','Rain falling · a real rain recording heard beneath a rain cloud',180,.20);
recording('falls','waterfall','Waterfall roar · representative waterfall, recorded elsewhere',140,.28);
recording('thunder-delay','thunder','Thunder · real ground recording from Darwin, Australia',300,.22);
context('table uv sphinx chimborazo death-zone half-air','wind-snow','Mountain-weather ambience · real wind and snow recorded in Abisko, Sweden',.13);
quiet('longjump titicaca dust spider alma mouse bacteria','Quiet · no unrelated recording substituted for the pictured subject');
recording('swift','swift','Common swift calls · recorded at a nest box, not during the high ascent',200,.22);
recording('helicopter','helicopter','Helicopter rotor · representative aircraft, not the Everest landing recording',600,.22);
quiet('mach concorde','Quiet · an A320 takeoff does not represent Concorde or sound speed at cruise altitude');
quiet('armstrong','Quiet · no ground-pressure kettle sound used for low-pressure boiling');
context('hot-balloon','burner','Hot-air balloon burner · real recording from a different flight',.20);
context('mars-air','mars','NASA Ingenuity rotor on Mars · filtered mission recording for the pressure comparison',.24);
quiet('ozone skydiver record-balloon tonga space-dust space-line mesopause laser e12','Quiet · no invented sounds in the thin upper atmosphere');

// Underground scenes: distinguish field recordings from listening illustrations.
context('under-roots under-worm','rain','Rain at the surface, filtered as an illustrative soil listening scene',.12);
SOUNDSCAPES['under-roots'].cutoff=1200;SOUNDSCAPES['under-worm'].cutoff=650;
context('under-cicada','cicada','Adult cicada recording as a preview of emergence; not an underground nymph sound',.12);
context('under-metro','underground-train','Real London Underground train arriving; illustrative tunnel depth',.24);
context('under-cave under-echo under-crystals','cave-drips','Real water drips in Treak Cliff Cavern, England; illustrative scene depths',.28);
quiet('under-aquifer under-microbes under-borehole','Quiet scene: no unsupported underground recording substituted');

UNDERGROUND_STOPS.filter(s=>s.illustration&&s.id!=="under-echo").forEach(s=>quiet(s.id,s.listening));

context("under-twilight under-snow under-midnight","whale","NOAA blue whale recording from the northeast Pacific; ocean listening example, not recorded at the displayed depth",.20);
