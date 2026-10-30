// Simplified preview. Existing localStorage keys and original app remain untouched.
const cacheKey="borderline-playlist-cache-v1",practiceKey="guitar-practice-songs";
const $=id=>document.getElementById(id);
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||"null")??fallback}catch{return fallback}};
const cache=read(cacheKey,null);
let songs=cache?.songs?.length?(cache.complete===false?[...cache.songs].reverse():cache.songs):[];
const practice=()=>read(practiceKey,[]);
const songId=s=>s.title+"::"+s.artist;
const selected={song:null,tab:"songs",origin:"songs"};
const chordsFor=s=>{const stored=localStorage.getItem("guitar-chords-v1:"+s.title+":"+s.artist);if(stored!==null)return stored?stored.split(","):[];return typeof akkordData!=="undefined"?(akkordData[s.title]||[]):[]};
const shapes={guitar:{E:[0,2,2,1,0,0],A:[-1,0,2,2,2,0],D:[-1,-1,0,2,3,2],Am:[-1,0,2,2,1,0],C:[-1,3,2,0,1,0],F:[1,3,3,2,1,1],Dm:[-1,-1,0,2,3,1],G:[3,2,0,0,0,3],Em:[0,2,2,0,0,0]},ukulele:{E:[4,4,4,2],A:[2,1,0,0],D:[2,2,2,0],Am:[2,0,0,0],C:[0,0,0,3],F:[2,0,1,0],Dm:[2,2,1,0],G:[0,2,3,2],Em:[0,4,3,2]}};
function diagram(chord){const frets=shapes[$("instrument").value][chord];const card=document.createElement("div");card.className="chord";const title=document.createElement("strong");title.textContent=chord;card.append(title);if(!frets){card.append(document.createTextNode(" · Grep mangler"));return card}const n=frets.length;const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 110 120");let markup="";const first=Math.max(1,Math.max(...frets)-3);for(let i=0;i<n;i++){const x=10+i*90/(n-1);markup+='<line x1="'+x+'" y1="20" x2="'+x+'" y2="116" stroke="#cbd5e1"/>';const f=frets[i];if(f<1)markup+='<text x="'+x+'" y="15" text-anchor="middle" fill="white" font-size="12">'+(f===0?"○":"×")+'</text>';else markup+='<circle cx="'+x+'" cy="'+(20+(f-first+.5)*24)+'" r="6" fill="#46e58a"/>'}for(let i=0;i<=4;i++)markup+='<line x1="10" y1="'+(20+i*24)+'" x2="100" y2="'+(20+i*24)+'" stroke="#cbd5e1"/>';svg.innerHTML=markup;card.append(svg);return card}
function renderChords(){const host=$("chords");host.replaceChildren();const chords=chordsFor(selected.song);if(!chords.length){host.textContent="Ingen akkorder lagret ennå. Lim inn egne akkorder nedenfor.";return}for(const chord of chords)host.append(diagram(chord))}
function renderList(host,items){host.replaceChildren();if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent=host.id==="learn-list"?"Ingen låter i Learn ennå.":"Ingen låter funnet. Importer en CSV-fil under Settings dersom listen er tom.";host.append(p);return}const fragment=document.createDocumentFragment();for(const s of items.slice(0,120)){const b=document.createElement("button");b.className="song";const content=document.createElement("span"),title=document.createElement("strong"),artist=document.createElement("small");title.textContent=s.title;artist.textContent=s.artist;content.append(title,artist);const arrow=document.createElement("span");arrow.className="arrow";arrow.textContent="›";b.append(content,arrow);b.onclick=()=>openSong(s);fragment.append(b)}host.append(fragment);if(items.length>120){const p=document.createElement("p");p.className="count";p.textContent="Viser 120 av "+items.length+" låter. Søk for å finne flere.";host.append(p)}}
function renderSongs(){const q=$("search").value.toLocaleLowerCase().trim();const filtered=songs.filter(s=>(s.title+" "+s.artist).toLocaleLowerCase().includes(q));$("song-count").textContent=songs.length+" songs";renderList($("songs-list"),filtered)}
function renderLearn(){renderList($("learn-list"),practice())}
function tab(name){selected.tab=name;for(const id of ["songs","learn","settings","detail"])$(id+"-view").classList.toggle("hidden",id!==name);document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));if(name==="learn")renderLearn();if(name==="songs")renderSongs();if(name==="settings")$("data-status").textContent=songs.length+" låter lagret lokalt i denne nettleseren."}
function openSong(s){selected.origin=selected.tab==="learn"?"learn":"songs";selected.song=s;$("detail-title").textContent=s.title;$("detail-artist").textContent=s.artist;$("chord-input").value=chordsFor(s).join(" ");$("chord-feedback").textContent="";$("instrument").value=localStorage.getItem("instrument")||"guitar";$("find-chords").href="https://www.ultimate-guitar.com/search.php?search_type=title&value="+encodeURIComponent(s.title+" "+s.artist+" chords");updateLearnButton();renderChords();tab("detail")}
function updateLearnButton(){$("learn-toggle").textContent=practice().some(s=>songId(s)===songId(selected.song))?"✓ I Learn":"+ Legg til i Learn"}
$("back").onclick=()=>tab(selected.origin);
$("learn-toggle").onclick=()=>{const list=practice();const exists=list.some(s=>songId(s)===songId(selected.song));localStorage.setItem(practiceKey,JSON.stringify(exists?list.filter(s=>songId(s)!==songId(selected.song)):[...list,selected.song]));updateLearnButton()};
$("instrument").onchange=()=>{localStorage.setItem("instrument",$("instrument").value);renderChords()};
$("save-chords").onclick=()=>{const input=$("chord-input").value;const tokens=input.replace(/\[([^\]]+)\]/g," $1 ").split(/[\s,|]+/).filter(Boolean);const valid=/^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:sus[24]|add[0-9]+|maj[0-9]+)?(?:\/[A-G](?:#|b)?)?$/;if(!tokens.length||!tokens.every(x=>valid.test(x))){$("chord-feedback").textContent="Skriv bare akkorder, for eksempel Am C G D.";return}const chords=[...new Set(tokens)];localStorage.setItem("guitar-chords-v1:"+selected.song.title+":"+selected.song.artist,chords.join(","));$("chord-feedback").textContent="Akkordene er lagret.";renderChords()};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("search").oninput=renderSongs;
$("import-csv").onclick=()=>$("csv-file").click();
$("csv-file").onchange=async e=>{const file=e.target.files[0];if(!file)return;const text=await file.text();const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/);const sep=lines[0].includes("\t")?"\t":lines[0].includes(";")?";":",";const headers=lines.shift().split(sep).map(x=>x.replace(/"/g,"").trim().toLowerCase());const t=headers.findIndex(x=>["track name","trackname","title","name"].includes(x));const a=headers.findIndex(x=>["artist name","artistname","artist","artist names"].includes(x));if(t<0||a<0){alert("Finner ikke kolonnene for sang og artist. Bruk en Spotify CSV-eksport.");return}const imported=lines.map(line=>line.split(sep)).filter(row=>row[t]&&row[a]).map(row=>({title:row[t].replace(/^"|"$/g,""),artist:row[a].replace(/^"|"$/g,"")}));if(!imported.length){alert("Ingen låter funnet.");return}localStorage.setItem(cacheKey,JSON.stringify({songs:imported,savedAt:Date.now(),complete:true,source:"csv"}));alert("Importerte "+imported.length+" låter. Siden oppdateres.");location.reload()};
$("export-json").onclick=()=>{if(!songs.length){alert("Ingen låter å eksportere.");return}const blob=new Blob([JSON.stringify({songs,complete:true},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="borderline-sangliste.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
renderSongs();
// Shared public playlist: no Spotify login or API requests required.
(async function loadPublicPlaylist(){
 try {
  const response=await fetch("./borderline-sangliste.json",{cache:"no-cache"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const data=await response.json();
  if(!Array.isArray(data.songs)||!data.songs.length)throw new Error("Ugyldig sangliste");
  songs=data.songs.filter(s=>typeof s.title==="string"&&typeof s.artist==="string");
  renderSongs();
  if(selected.tab==="settings")$("data-status").textContent=songs.length+" sanger i den delte Borderline-listen (ingen Spotify-innlogging).";
 }catch(error){
  console.info("Felles sangliste er ikke publisert ennå; bruker lokal kopi.",error);
 }
})();
