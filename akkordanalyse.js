(()=>{"use strict";
const $=id=>document.getElementById(id),file=$("audio-file"),btn=$("analyze"),status=$("status"),results=$("results");
let url=null;
file.onchange=()=>{if(url)URL.revokeObjectURL(url);url=file.files[0]?URL.createObjectURL(file.files[0]):null;$("player").src=url||"";btn.disabled=!url;results.hidden=true;status.textContent=url?"Klar til analyse.":"Velg en lydfil."};
const names=["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];
const templates=[];for(let root=0;root<12;root++)for(const [quality,third] of [["",4],["m",3]]){const mask=new Float64Array(12);for(const p of [root,(root+third)%12,(root+7)%12])mask[p]=1;templates.push({name:names[root]+quality,mask})}
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let j=0;j<len/2;j++){const x=i+j,y=x+len/2,vr=re[y]*cr-im[y]*ci,vi=re[y]*ci+im[y]*cr;re[y]=re[x]-vr;im[y]=im[x]-vi;re[x]+=vr;im[x]+=vi;const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr}}}}
function analyze(data,sr){const size=8192,hop=Math.round(sr*.35),chromas=[];for(let start=0;start+size<=data.length;start+=hop){const re=new Float64Array(size),im=new Float64Array(size),chroma=new Float64Array(12);let energy=0;for(let i=0;i<size;i++){const v=data[start+i];energy+=v*v;re[i]=v*(.5-.5*Math.cos(2*Math.PI*i/(size-1)))}if(energy/size<.0000005){chromas.push(null);continue}fft(re,im);for(let k=Math.max(1,Math.ceil(75*size/sr));k<Math.min(size/2,Math.floor(1800*size/sr));k++){const hz=k*sr/size;const midi=69+12*Math.log2(hz/440);const pc=((Math.round(midi)%12)+12)%12;const magnitude=Math.hypot(re[k],im[k]);chroma[pc]+=Math.pow(magnitude,.7)}const total=chroma.reduce((a,b)=>a+b,0);if(total)for(let i=0;i<12;i++)chroma[i]/=total;chromas.push(chroma)}
const raw=chromas.map(ch=>{if(!ch)return null;let best=null,score=-Infinity;for(const t of templates){let inside=0,outside=0;for(let i=0;i<12;i++)(t.mask[i]?inside+=ch[i]:outside+=ch[i]);const s=inside/3-outside/9;if(s>score){score=s;best=t.name}}return best});
const smooth=raw.map((v,i)=>{const votes=new Map();for(let j=Math.max(0,i-2);j<=Math.min(raw.length-1,i+2);j++){const k=raw[j];if(k)votes.set(k,(votes.get(k)||0)+1)}return [...votes].sort((a,b)=>b[1]-a[1])[0]?.[0]||null});
const events=[];for(let i=0;i<smooth.length;i++){const name=smooth[i];if(!name)continue;if(events.length&&events[events.length-1].name===name){events[events.length-1].end=(i+1)*hop/sr}else events.push({name,start:i*hop/sr,end:(i+1)*hop/sr})}return events.filter(e=>e.end-e.start>=.55)}
btn.onclick=async()=>{btn.disabled=true;results.hidden=true;status.textContent="Leser og analyserer lydfilen …";try{const audioContext=new (window.AudioContext||window.webkitAudioContext)();const buffer=await audioContext.decodeAudioData(await file.files[0].arrayBuffer());const maxSeconds=180,limit=Math.min(buffer.length,Math.floor(buffer.sampleRate*maxSeconds));const mono=new Float32Array(limit);for(let c=0;c<buffer.numberOfChannels;c++){const channel=buffer.getChannelData(c);for(let i=0;i<limit;i++)mono[i]+=channel[i]/buffer.numberOfChannels}const events=analyze(mono,buffer.sampleRate);await audioContext.close();const host=$("events");host.replaceChildren();for(const e of events){const row=document.createElement("div");row.className="event";const time=document.createElement("time");time.textContent=e.start.toFixed(1)+"–"+e.end.toFixed(1)+" s";const name=document.createElement("strong");name.textContent=e.name;row.append(time,name);host.append(row)}const unique=[...new Set(events.map(e=>e.name))];$("summary").textContent=events.length?"Fant "+events.length+" segmenter. Akkorder: "+unique.join(", "):"Ingen tydelige akkorder funnet.";status.textContent="Analyse ferdig"+(buffer.duration>maxSeconds?" (kun første 3 minutter).":".");results.hidden=false}catch(err){status.textContent="Kunne ikke analysere filen: "+err.message}finally{btn.disabled=!file.files.length}};
let micStream=null,micContext=null,micSource=null,micProcessor=null,micTimer=null,micSilentGain=null;
const micStart=$("mic-start"),micStop=$("mic-stop"),micStatus=$("mic-status"),micCurrent=$("mic-current"),micFound=$("mic-found"),micMeter=$("mic-meter"),micLevel=$("mic-level");
let micSeen=new Map(),micHistory=[],micCandidate=null,micCandidateCount=0,micConfirmed=null;
micStart.onclick=async()=>{
try{
if(!navigator.mediaDevices?.getUserMedia)throw Error("Mikrofon krever HTTPS og en nettleser som støtter opptak.");
micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
micContext=new (window.AudioContext||window.webkitAudioContext)();
await micContext.resume();
micSource=micContext.createMediaStreamSource(micStream);
micProcessor=micContext.createAnalyser();micProcessor.fftSize=8192;micProcessor.smoothingTimeConstant=.65;
micSource.connect(micProcessor);
// Hold lydgrafen aktiv uten å sende mikrofonlyd til høyttalerne.
micSilentGain=micContext.createGain();micSilentGain.gain.value=0;micProcessor.connect(micSilentGain);micSilentGain.connect(micContext.destination);
micSeen=new Map();micHistory=[];micCandidate=null;micCandidateCount=0;micConfirmed=null;micFound.textContent="Oppdagede akkorder: –";micStart.disabled=true;micStop.disabled=false;micStatus.textContent="Lytter … lydmåleren skal bevege seg når du spiller.";
const samples=new Float32Array(micProcessor.fftSize);
micTimer=setInterval(()=>{
if(!micProcessor)return;
micProcessor.getFloatTimeDomainData(samples);
const energy=samples.reduce((s,v)=>s+v*v,0)/samples.length;
const rms=Math.sqrt(energy);const level=Math.min(100,Math.round(rms*2500));micMeter.style.width=level+"%";micLevel.textContent="Nivå: "+level+" % (RMS "+rms.toFixed(5)+", lydmotor "+micContext.state+")";
if(micContext.state!=="running"){micStatus.textContent="Lydmotoren er "+micContext.state+". Trykk Stopp og Start igjen.";return}
if(micStream.getAudioTracks()[0]?.muted){micStatus.textContent="Mikrofonsporet er dempet av nettleseren eller operativsystemet.";return}
micStatus.textContent=rms<.0005?"Mikrofon tilkoblet, men nesten ingen lyd registreres. Sjekk valgt mikrofon i Chrome.":"Mikrofonen mottar lyd – analyserer akkorder.";
if(energy<.00000025){micCurrent.textContent="Akkord: – (venter på lyd)";micHistory=[];micCandidate=null;micCandidateCount=0;return}
const re=new Float64Array(samples.length),im=new Float64Array(samples.length),chroma=new Float64Array(12);
for(let i=0;i<samples.length;i++)re[i]=samples[i]*(.5-.5*Math.cos(2*Math.PI*i/(samples.length-1)));
fft(re,im);
for(let k=Math.max(1,Math.ceil(75*samples.length/micContext.sampleRate));k<Math.min(samples.length/2,Math.floor(1800*samples.length/micContext.sampleRate));k++){
const hz=k*micContext.sampleRate/samples.length,pc=((Math.round(69+12*Math.log2(hz/440))%12)+12)%12;
chroma[pc]+=Math.pow(Math.hypot(re[k],im[k]),.7);
}
const total=chroma.reduce((a,b)=>a+b,0);if(!total)return;
for(let i=0;i<12;i++)chroma[i]/=total;
let chord=null,bestScore=-Infinity;
for(const t of templates){let inside=0,outside=0;for(let i=0;i<12;i++)(t.mask[i]?inside+=chroma[i]:outside+=chroma[i]);const score=inside/3-outside/9;if(score>bestScore){bestScore=score;chord=t.name}}
if(!chord)return;
if(chord===micCandidate)micCandidateCount++;else{micCandidate=chord;micCandidateCount=1}
if(micCandidateCount>=2){micCurrent.textContent="Mulig akkord: "+chord;if(chord!==micConfirmed){micConfirmed=chord;micSeen.set(chord,(micSeen.get(chord)||0)+1);micFound.textContent="Oppdagede akkorder: "+[...micSeen.keys()].join(", ")}}
},180);
}catch(e){micStatus.textContent="Kunne ikke starte mikrofonen: "+e.message;micStream?.getTracks().forEach(t=>t.stop());micStream=null;micContext?.close();micContext=null}
};
micStop.onclick=()=>{clearInterval(micTimer);micTimer=null;micSource?.disconnect();micProcessor?.disconnect();micSilentGain?.disconnect();micSilentGain=null;micStream?.getTracks().forEach(t=>t.stop());micContext?.close();micStream=null;micSource=null;micProcessor=null;micContext=null;micStart.disabled=false;micStop.disabled=true;micStatus.textContent="Mikrofonen er stoppet.";micMeter.style.width="0%";micLevel.textContent="Nivå: 0 %";};
window.addEventListener("pagehide",()=>{if(micStream)micStop.click()});
})();