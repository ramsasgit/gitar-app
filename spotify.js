
const clientId = "b27e90e779de42e8a80bee4e12c50c7d";
const redirectUri = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5500/callback.html"
    : "https://ramsasgit.github.io/gitar-app/callback.html";

const spotifyButton = document.getElementById("spotify-login");

function randomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(randomValues, value =>
    characters[value % characters.length]
  ).join("");
}

async function createCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

spotifyButton.addEventListener("click", async () => {
  const verifier = randomString(64);
  const challenge = await createCodeChallenge(verifier);
  const state = randomString(32);

  sessionStorage.setItem("spotify_verifier", verifier);
  sessionStorage.setItem("spotify_state", state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "playlist-read-private playlist-read-collaborative",
    redirect_uri: redirectUri,
    state: state,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  window.location.href =
    "https://accounts.spotify.com/authorize?" + params.toString();
});







const acousticIcon = "<svg class=\"acoustic-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\" role=\"img\" aria-label=\"Kassegitar\"><g transform=\"rotate(42 18 18)\"><path d=\"M15 3 Q18 1 21 3 L20.5 8 L20 20 Q25 21 25 27 Q25 34 18 34 Q11 34 11 27 Q11 21 16 20 L15.5 8 Z\" fill=\"#d99549\" stroke=\"#7b4928\" stroke-width=\"1.4\"/><path d=\"M16 3 L20 3 L20 20 L16 20 Z\" fill=\"#7b4928\"/><circle cx=\"18\" cy=\"25\" r=\"3.4\" fill=\"#38251d\"/><path d=\"M14 30 H22\" stroke=\"#523522\" stroke-width=\"2\"/><path d=\"M17 4 V30 M18 4 V30 M19 4 V30\" stroke=\"#f7e3bf\" stroke-width=\".45\"/><path d=\"M14 5 H22 M14 7 H22\" stroke=\"#f5cf93\" stroke-width=\".8\"/></g></svg>";
function parsePastedChords(input) {
  const found = [];
  const valid = /^(?:[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|M)?[0-9]*(?:sus[24]|add[0-9]+|maj[0-9]+)?(?:\/[A-G](?:#|b)?)?)$/;
  const add = value => { if (valid.test(value) && !found.includes(value)) found.push(value); };
  // [Am]lyrics and [Chorus: Am] chord sheets
  for (const match of input.matchAll(/\[([A-G](?:#|b)?[a-zA-Z0-9/#]*)\]/g)) add(match[1]);
  for (const line of input.split(/\r?\n/)) {
    const clean = line.replace(/\[[^\]]+\]/g, "").trim();
    if (!clean) continue;
    const parts = clean.split(/[\s,|]+/).filter(Boolean);
    // Only parse whole lines of chords, never guess chords from lyric words.
    if (parts.length && parts.length <= 24 && parts.every(part => valid.test(part))) parts.forEach(add);
  }
  return found;
}
function makeChordEditor(song) {
  const details = document.createElement("details");
  details.className = "chord-editor";
  const summary = document.createElement("summary");
  const saved = chordsForSong(song);
  summary.textContent = saved.length ? "Akkorder: " + saved.join(", ") + " · Endre" : "+ Lim inn akkorder";
  const textarea = document.createElement("textarea");
  textarea.rows = 5;
  textarea.placeholder = "Lim inn akkordlinjer, f.eks. Am  C  G  D, eller tekst med [Am] og [C].";
  textarea.value = saved.join(" ");
  textarea.setAttribute("aria-label", "Lim inn akkorder for " + song.title);
  const result = document.createElement("p");
  result.className = "chord-feedback";
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Finn og lagre akkorder";
  save.onclick = () => {
    const chords = parsePastedChords(textarea.value);
    if (!chords.length) { result.textContent = "Fant ingen sikre akkorder. Lim inn akkordlinjer eller akkorder i hakeparenteser."; return; }
    localStorage.setItem(chordStorageKey(song), chords.join(","));
    summary.textContent = "Akkorder: " + chords.join(", ") + " · Endre";
    result.textContent = chords.every(chord => allowedBeginnerChords.has(chord))
      ? "✓ " + chords.join(", ") + " – passer dine ni nybegynnerakkorder."
      : chords.join(", ") + " – inneholder også akkorder utenfor de ni nybegynnerakkordene.";
    renderPracticeSongs();
  };
  details.append(summary, textarea, save, result);
  return details;
}
const practiceKey = "guitar-practice-songs";
function getPracticeSongs() {
  try { const value = JSON.parse(localStorage.getItem(practiceKey) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function practiceId(song) { return song.title + "::" + song.artist; }
function savePracticeSongs(songs) {
  localStorage.setItem(practiceKey, JSON.stringify(songs));
  renderPracticeSongs();
}
function renderPracticeSongs() {
  const list = document.getElementById("song-list");
  if (!list) return;
  list.replaceChildren();
  const allSongs = getPracticeSongs();
  const onlyBeginner = document.getElementById("learn-beginner-only")?.checked;
  const songs = onlyBeginner ? allSongs.filter(song => isBeginnerSong(song)) : allSongs;
  if (!songs.length) {
    const p = document.createElement("p");
    p.textContent = onlyBeginner ? "Ingen Learn-låter med bekreftede nybegynnerakkorder ennå. Lim inn akkorder på låtene dine og prøv igjen." : "Ingen lagrede låter ennå. Legg til låter fra Borderline.";
    list.appendChild(p);
  }
  for (const song of songs) {
    const card = document.createElement("div");
    card.className = "song-card";
    const name = document.createElement("strong");
    name.textContent = song.title + " – " + song.artist;
    const link = document.createElement("a");
    link.href = "https://www.ultimate-guitar.com/search.php?search_type=title&value=" + encodeURIComponent(song.title + " " + song.artist + " chords");
    link.innerHTML = acousticIcon + " Find chords";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.marginLeft = "12px";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.style.marginLeft = "12px";
    remove.onclick = () => savePracticeSongs(getPracticeSongs().filter(item => practiceId(item) !== practiceId(song)));
    card.append(name, link, remove, makeChordEditor(song), chordDiagrams(song));
    list.appendChild(card);
  }
}
document.getElementById("learn-beginner-only")?.addEventListener("change", renderPracticeSongs);
renderPracticeSongs();

const hentKnapp = document.getElementById("hent-spilleliste");
const spotifyStatus = document.getElementById("spotify-status");

const allowedBeginnerChords = new Set(["E","A","D","Am","C","F","Dm","G","Em"]);
function isBeginnerSong(song) { const chords = chordsForSong(song); return chords.length > 0 && chords.every(chord => allowedBeginnerChords.has(chord)); }
function chordStorageKey(song) { return "guitar-chords-v1:" + song.title + ":" + song.artist; }
function chordsForSong(song) {
  const saved = localStorage.getItem(chordStorageKey(song));
  if (saved !== null) return saved ? saved.split(",") : [];
  const title = song.title.replace(/\s*-\s*\d{4}\s+Remaster(?:ed)?(?:\s+Version)?.*$/i, "").trim();
  return akkordData[title] || [];
}
const playlistCacheKey = "borderline-playlist-cache-v1";
const playlistCacheHours = 12;
let loadingPlaylist = false;
function readPlaylistCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(playlistCacheKey) || "null");
    return cache && Array.isArray(cache.songs) ? cache : null;
  } catch { return null; }
}
function showCacheStatus() {
  let status = document.getElementById("playlist-cache-status");
  if (!status) {
    status = document.createElement("p");
    status.id = "playlist-cache-status";
    status.setAttribute("role", "status");
    spotifyStatus.insertAdjacentElement("beforebegin", status);
  }
  const cache = readPlaylistCache();
  if (!cache || !cache.songs.length) {
    status.textContent = "Lokalt lagret: 0 låter. Ingen spilleliste lagret ennå.";
  } else {
    const count = cache.songs.length;
    status.textContent = "Lokalt lagret: " + count + " låter. " +
      (cache.complete === false ? "Innlasting ikke fullført – resten kan hentes senere." : "Hele spillelisten er lagret.");
  }
}
showCacheStatus();
function waitForSpotify(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function fetchSpotifyPage(url, token) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (response.status !== 429) {
      if (!response.ok) throw new Error("Spotify svarte med feil " + response.status);
      return response.json();
    }
    let details = "";
    try { const body = await response.clone().json(); details = [body.error?.reason, body.error?.message, body.message].filter(Boolean).join(" – "); } catch {}
    console.warn("Spotify HTTP 429", { retryAfter: response.headers.get("Retry-After"), details });
    const retryAfter = Number(response.headers.get("Retry-After"));
    const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30 * (attempt + 1);
    if (attempt === 2) { const error = new Error("Spotify avviser forespørselen (429). " + (details || "Ingen detaljert årsak oppgitt.") + " Se også utviklerkonsollen for Retry-After."); error.status = 429; throw error; }
    spotifyStatus.textContent = "Spotify svarer 429" + (details ? " (" + details + ")" : "") + ". Venter " + Math.ceil(seconds) + " sekunder før nytt forsøk...";
    await waitForSpotify(Math.min(seconds, 120) * 1000);
  }
}
hentKnapp.addEventListener("click", async () => {
  if (loadingPlaylist) return;
  loadingPlaylist = true;
  hentKnapp.disabled = true;
  const cache = readPlaylistCache();
  let songs = cache ? (cache.complete === false ? [...cache.songs].reverse() : cache.songs) : null;
  let fromCache = Boolean(songs);
  try {
    const cacheFresh = cache && cache.complete !== false && Date.now() - cache.savedAt < playlistCacheHours * 60 * 60 * 1000;
    if (!cacheFresh) {
      let token = localStorage.getItem("spotify_access_token");
      const expires = Number(localStorage.getItem("spotify_token_expires") || 0);
      if (!token || Date.now() >= expires - 60000) token = await fornySpotifyToken();
      if (!token) {
        if (!songs) throw new Error("Du må koble til Spotify først.");
      } else {
        spotifyStatus.textContent = "Henter låtene fra Borderline...";
        const playlistId = "482R3Wqd7Z5g7uJZ1trjJk";
        const baseUrl = "https://api.spotify.com/v1/playlists/" + playlistId + "/items?limit=10";
        // Partial caches retain Spotify's original page order, so downloads can resume.
        const partial = cache && cache.complete === false && typeof cache.nextUrl === "string" ? cache : null;
        let url = partial ? partial.nextUrl : baseUrl;
        const freshSongs = partial ? [...partial.songs] : [];
        try {
          while (url) {
            const data = await fetchSpotifyPage(url, token);
            for (const entry of data.items || []) {
              const song = entry.item || entry.track;
              if (song && song.type === "track" && song.artists) {
                freshSongs.push({ title: song.name, artist: song.artists.map(a => a.name).join(", ") });
              }
            }
            url = data.next || null;
            // Save after every successful page, including the URL to resume from.
            try {
              localStorage.setItem(playlistCacheKey, JSON.stringify({
                savedAt: Date.now(),
                songs: url ? freshSongs : [...freshSongs].reverse(),
                nextUrl: url,
                complete: !url
              }));
            } catch (storageError) { console.warn("Could not save playlist cache", storageError); }
            spotifyStatus.textContent = "Hentet " + freshSongs.length + " låter fra Borderline...";
            showCacheStatus();
            if (url) await waitForSpotify(1200);
          }
          songs = [...freshSongs].reverse();
          fromCache = false;
        } catch (fetchError) {
          if (fetchError.status === 429) spotifyStatus.textContent = fetchError.message;
          if (freshSongs.length) {
            songs = [...freshSongs].reverse();
            fromCache = true;
            spotifyStatus.textContent = fetchError.message + " Viser lagrede låter.";
          } else if (!songs) {
            throw fetchError;
          }
        }
      }
    }
    showCacheStatus();
    if (!songs) throw new Error("Ingen låter tilgjengelige.");
    spotifyStatus.textContent = "Found " + songs.length + " songs in Borderline!" +
      (fromCache ? (cache && cache.complete === false ? " (delvis lagret kopi – resten hentes ved neste forsøk)" : " (lagret kopi)") : "");
const songList = document.createElement("ol");
spotifyStatus.appendChild(songList);

const sokefelt = document.getElementById("sok-lat");

function visLatter(soketekst = "") {
    songList.innerHTML = "";


const valgtNivaa = document.getElementById("filter-nivaa").value;

const filtrerteLatter = songs.filter(song => {
    const tekst = `${song.title} ${song.artist}`.toLowerCase();
    const passerSok = tekst.includes(soketekst.toLowerCase().trim());

    const nokkel = "nivaa_" + song.title + "_" + song.artist;
    const nivaa = localStorage.getItem(nokkel) || "";

    const originalTittel = song.title.replace(/\\s*-\\s*\\d{4}\\s+Remaster(?:ed)?(?:\\s+Version)?.*$/i, "").trim();
    const kjenteAkkorder = chordsForSong(song);
    const enkleAkkorder = isBeginnerSong(song);
    const passerNivaa = (valgtNivaa === "forslag" && enkleAkkorder) ||
        valgtNivaa === "alle" ||
        nivaa === valgtNivaa ||
        (valgtNivaa === "uten" && nivaa === "");

    return passerSok && passerNivaa;
});


if (valgtNivaa === "forslag") {
    const note = document.createElement("p");
    note.textContent = filtrerteLatter.length
      ? "Disse låtene bruker bare dine ni akkorder, basert på akkordene som er registrert. Andre låter kan også passe, men er ikke undersøkt ennå."
      : "Ingen låter med bekreftede nybegynnerakkorder ennå. Lim inn akkordene på en låt, så kan den komme med her.";
    songList.appendChild(note);
}
for (const song of filtrerteLatter) {
    const row = document.createElement("li");

    row.classList.add("song-card");

    const navn = document.createElement("span");
    navn.textContent = `${song.title} – ${song.artist} `;

    const lenke = document.createElement("a");
    const sok = `${song.title} ${song.artist} chords`;

    lenke.href =
        "https://www.ultimate-guitar.com/search.php?search_type=title&value="
        + encodeURIComponent(sok);

    
lenke.innerHTML = acousticIcon + " Find chords";

    lenke.target = "_blank";
    lenke.rel = "noopener noreferrer";
    lenke.style.marginLeft = "12px";
    lenke.style.color = "#1db954";

    row.appendChild(navn);
    row.appendChild(lenke);




const originalTittel = song.title
    .replace(/\s*-\s*\d{4}\s+Remaster(?:ed)?(?:\s+Version)?.*$/i, "")
    .trim();


const akkorder = chordsForSong(song);

if (akkorder.length) {
    const forslag = beregnVanskelighet(akkorder);

    const merke = document.createElement("span");


merke.textContent =
    forslag === "enkel" ? " 🟢 Suggested: Easy" :
    forslag === "middels" ? " 🟡 Suggested: Medium" :
    " 🔴 Suggested: Hard";



    merke.style.marginLeft = "10px";
    row.appendChild(merke);
}


const vanskelighet = document.createElement("select");


vanskelighet.innerHTML = `
    <option value="">Choose level</option>
    <option value="enkel">🟢 Easy</option>
    <option value="middels">🟡 Medium</option>
    <option value="vanskelig">🔴 Hard</option>
`;


vanskelighet.style.marginLeft = "12px";
vanskelighet.style.padding = "5px";


const lagringsnokkel = "nivaa_" + song.title + "_" + song.artist;

vanskelighet.value =
    localStorage.getItem(lagringsnokkel) || "";

vanskelighet.addEventListener("change", () => {
    localStorage.setItem(lagringsnokkel, vanskelighet.value);
});


row.appendChild(vanskelighet);
row.appendChild(makeChordEditor(song));
row.appendChild(chordDiagrams(song));
const practiceButton = document.createElement("button");
practiceButton.type = "button";
practiceButton.style.marginLeft = "12px";
function updatePracticeButton() {
  practiceButton.textContent = getPracticeSongs().some(item => practiceId(item) === practiceId(song)) ? "✓ In Learn" : "+ Add to Learn";
}
updatePracticeButton();
practiceButton.onclick = () => {
  const saved = getPracticeSongs();
  if (saved.some(item => practiceId(item) === practiceId(song))) {
    savePracticeSongs(saved.filter(item => practiceId(item) !== practiceId(song)));
  } else {
    savePracticeSongs([...saved, { title: song.title, artist: song.artist }]);
  }
  updatePracticeButton();
};
row.appendChild(practiceButton);

    songList.appendChild(row);
}

}

sokefelt.oninput = () => {
    visLatter(sokefelt.value);
};


document.getElementById("filter-nivaa").onchange = () => {
    visLatter(sokefelt.value);
};


visLatter(sokefelt.value);


    } catch (error) {
        spotifyStatus.textContent = error.status === 429
            ? "⏳ " + error.message + " Låtene i Learn er fortsatt tilgjengelige."
            : error.message === "Du må koble til Spotify først."
              ? "Koble til Spotify for å hente Borderline. Låtene i Learn er fortsatt tilgjengelige."
              : "Kunne ikke laste Borderline akkurat nå. " + error.message + " Learn-listen din er fortsatt tilgjengelig.";
    }
});


async function fornySpotifyToken() {
    const refreshToken = localStorage.getItem("spotify_refresh_token");

    if (!refreshToken) {
        return null;
    }

    const svar = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId
        })
    });

    if (!svar.ok) {
        console.error("Kunne ikke fornye Spotify-tilgangen");
        return null;
    }

    const data = await svar.json();

    localStorage.setItem("spotify_access_token", data.access_token);

    localStorage.setItem(
        "spotify_token_expires",
        String(Date.now() + data.expires_in * 1000)
    );

    if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
    }

    return data.access_token;
}



// Spotify playlist loading is manual only; refreshing the page never contacts Spotify.


// Import a Spotify/Exportify CSV without making any Spotify API requests.
const importButton = document.getElementById("import-playlist");
const importFile = document.getElementById("import-playlist-file");
function parsePlaylistCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  function readRows(delimiter) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (c === delimiter && !quoted) { row.push(cell); cell = ""; }
      else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); if (row.some(v => v.trim())) rows.push(row);
        row = []; cell = "";
      } else cell += c;
    }
    if (quoted) throw new Error("CSV-filen har et uavsluttet anførselstegn.");
    row.push(cell); if (row.some(v => v.trim())) rows.push(row);
    return rows;
  }
  const normalize = value => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  function columns(headers) {
    const names = headers.map(normalize);
    const title = names.findIndex(h => ["trackname","tracktitle","title","name","song","songname","track"].includes(h));
    const artist = names.findIndex(h => ["artistname","artistnames","artist","artists","artistss"].includes(h) || /^artistnames?/.test(h));
    return { title, artist };
  }
  let rows, titleCol = -1, artistCol = -1;
  for (const delimiter of [",", ";", "\t"]) {
    const candidate = readRows(delimiter);
    if (!candidate.length) continue;
    const found = columns(candidate[0]);
    if (found.title >= 0 && found.artist >= 0) {
      rows = candidate; titleCol = found.title; artistCol = found.artist; break;
    }
  }
  if (!rows) {
    const firstLine = text.split(/\r?\n/, 1)[0].slice(0, 200);
    throw new Error("Fant ikke kolonner for sang og artist. Første linje i filen: " + firstLine);
  }
  rows.shift();
  const songs = [], seen = new Set();
  for (const fields of rows) {
    const title = (fields[titleCol] || "").trim();
    const artist = (fields[artistCol] || "").trim();
    if (!title || !artist) continue;
    const key = (title + "::" + artist).normalize("NFKC").toLocaleLowerCase();
    if (!seen.has(key)) { seen.add(key); songs.push({ title, artist }); }
  }
  if (!songs.length) throw new Error("Fant ingen låter i CSV-filen.");
  return { songs, duplicates: rows.length - songs.length };
}
importButton?.addEventListener("click", () => importFile.click());
importFile?.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    const parsed = parsePlaylistCsv(await file.text());
    const existing = readPlaylistCache()?.songs || [];
    const existingIds = new Set(existing.map(song => (song.title + "::" + song.artist).normalize("NFKC").toLocaleLowerCase()));
    const added = parsed.songs.filter(song => !existingIds.has((song.title + "::" + song.artist).normalize("NFKC").toLocaleLowerCase())).length;
    // Preserve the CSV's order, with newest playlist items displayed first.
    localStorage.setItem(playlistCacheKey, JSON.stringify({
      songs: parsed.songs, savedAt: Date.now(), complete: true, nextUrl: null, source: "csv"
    }));
    showCacheStatus();
    hentKnapp.click(); // Uses the fresh local cache; no Spotify request.
    spotifyStatus.insertAdjacentText("afterbegin", "Importert " + parsed.songs.length + " unike låter fra CSV (" + added + " nye, " + parsed.duplicates + " duplikater fjernet). ");
  } catch (error) {
    spotifyStatus.textContent = "Kunne ikke importere CSV: " + error.message;
  } finally { importFile.value = ""; }
});
