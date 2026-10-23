
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
  const songs = getPracticeSongs();
  if (!songs.length) {
    const p = document.createElement("p");
    p.textContent = "No songs saved yet. Add songs from Borderline below.";
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
    card.append(name, link, remove);
    list.appendChild(card);
  }
}
renderPracticeSongs();

const hentKnapp = document.getElementById("hent-spilleliste");
const spotifyStatus = document.getElementById("spotify-status");

const playlistCacheKey = "borderline-playlist-cache-v1";
const playlistCacheHours = 12;
let loadingPlaylist = false;
function readPlaylistCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(playlistCacheKey) || "null");
    return cache && Array.isArray(cache.songs) ? cache : null;
  } catch { return null; }
}
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
    const retryAfter = Number(response.headers.get("Retry-After"));
    const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30 * (attempt + 1);
    if (attempt === 2) throw new Error("Spotify begrenser antall forespørsler. Prøv igjen senere.");
    spotifyStatus.textContent = "Spotify ber oss vente " + Math.ceil(seconds) + " sekunder før vi fortsetter...";
    await waitForSpotify(Math.min(seconds, 120) * 1000);
  }
}
hentKnapp.addEventListener("click", async () => {
  if (loadingPlaylist) return;
  loadingPlaylist = true;
  hentKnapp.disabled = true;
  const cache = readPlaylistCache();
  let songs = cache ? cache.songs : null;
  let fromCache = Boolean(songs);
  try {
    const cacheFresh = cache && Date.now() - cache.savedAt < playlistCacheHours * 60 * 60 * 1000;
    if (!cacheFresh) {
      let token = localStorage.getItem("spotify_access_token");
      const expires = Number(localStorage.getItem("spotify_token_expires") || 0);
      if (!token || Date.now() >= expires - 60000) token = await fornySpotifyToken();
      if (!token) {
        if (!songs) throw new Error("Du må koble til Spotify først.");
      } else {
        spotifyStatus.textContent = "Henter låtene fra Borderline...";
        const playlistId = "482R3Wqd7Z5g7uJZ1trjJk";
        let url = "https://api.spotify.com/v1/playlists/" + playlistId + "/items?limit=50";
        const freshSongs = [];
        try {
          while (url) {
            const data = await fetchSpotifyPage(url, token);
            for (const entry of data.items || []) {
              const song = entry.item || entry.track;
              if (song && song.type === "track" && song.artists) {
                freshSongs.push({ title: song.name, artist: song.artists.map(a => a.name).join(", ") });
              }
            }
            url = data.next;
          }
          freshSongs.reverse();
          songs = freshSongs;
          fromCache = false;
          try { localStorage.setItem(playlistCacheKey, JSON.stringify({ savedAt: Date.now(), songs })); }
          catch (storageError) { console.warn("Could not save playlist cache", storageError); }
        } catch (fetchError) {
          if (!songs) throw fetchError;
          fromCache = true;
        }
      }
    }
    if (!songs) throw new Error("Ingen låter tilgjengelige.");
    spotifyStatus.textContent = "Found " + songs.length + " songs in Borderline!" +
      (fromCache ? " (saved copy)" : "");
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

    const passerNivaa =
        valgtNivaa === "alle" ||
        nivaa === valgtNivaa ||
        (valgtNivaa === "uten" && nivaa === "");

    return passerSok && passerNivaa;
});


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


const akkorder = akkordData[originalTittel];

if (akkorder) {
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
        spotifyStatus.textContent =
            "Noe gikk galt: " + error.message;
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



if (localStorage.getItem("spotify_access_token") ||
    localStorage.getItem("spotify_refresh_token")) {
    document.getElementById("hent-spilleliste").click();
}
