// Public song list: no Spotify credentials are required.
const sharedSongs=[
 {title:"Space Oddity",artist:"David Bowie"},
 {title:"Ziggy Stardust",artist:"David Bowie"},
 {title:"The Man Who Sold The World",artist:"David Bowie"}
];
function renderPublicSongs(){
 const host=document.getElementById("public-songs");if(!host)return;
 host.replaceChildren();
 const query=document.getElementById("sok-lat").value.toLowerCase().trim();
 const level=document.getElementById("filter-nivaa").value;
 const songs=sharedSongs.filter(song=>{
  const matches=(song.title+" "+song.artist).toLowerCase().includes(query);
  const chords=chordsForSong(song);
  const beginner=chords.length>0&&chords.every(ch=>allowedBeginnerChords.has(ch));
  const saved=localStorage.getItem("nivaa_"+song.title+"_"+song.artist)||"";
  return matches&&(level==="alle"||(level==="forslag"&&beginner)||(level==="uten"&&!saved)||saved===level);
 });
 const count=document.createElement("p");count.textContent=songs.length+" åpne eksempel-låter. Hele Borderline-listen er ennå ikke tilgjengelig uten innlogging.";host.append(count);
 for(const song of songs){
  const card=document.createElement("div");card.className="song-card";
  const name=document.createElement("strong");name.textContent=song.title+" – "+song.artist;
  const link=document.createElement("a");link.href="https://www.ultimate-guitar.com/search.php?search_type=title&value="+encodeURIComponent(song.title+" "+song.artist+" chords");link.textContent="Finn akkorder";link.target="_blank";link.rel="noopener noreferrer";link.style.marginLeft="12px";
  const add=document.createElement("button");add.type="button";add.textContent="+ Legg til i Learn";add.style.marginLeft="12px";add.onclick=()=>{const list=getPracticeSongs();if(!list.some(item=>practiceId(item)===practiceId(song)))savePracticeSongs([...list,song]);add.textContent="✓ I Learn";};
  card.append(name,link,add,makeChordEditor(song),chordDiagrams(song));host.append(card);
 }
}
document.getElementById("sok-lat").addEventListener("input",renderPublicSongs);
document.getElementById("filter-nivaa").addEventListener("change",renderPublicSongs);
renderPublicSongs();
document.getElementById("export-playlist")?.addEventListener("click",()=>{
 const cache=readPlaylistCache();
 if(!cache?.songs?.length){alert("Ingen Spotify-låter er lagret i denne nettleseren ennå. Hent spillelisten først.");return;}
 const payload=JSON.stringify({songs:cache.songs,complete:cache.complete!==false},null,2);
 const blob=new Blob([payload],{type:"application/json"});const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="borderline-sangliste.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
