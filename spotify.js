
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






const hentKnapp = document.getElementById("hent-spilleliste");
const spotifyStatus = document.getElementById("spotify-status");

hentKnapp.addEventListener("click", async () => {
    
let token = localStorage.getItem("spotify_access_token");

const utlopstid = Number(
    localStorage.getItem("spotify_token_expires") || 0
);

if (!token || Date.now() >= utlopstid - 60000) {
    token = await fornySpotifyToken();
}

if (!token) {
    spotifyStatus.textContent =
        "Du må koble til Spotify først.";
    return;
}

    spotifyStatus.textContent = "Henter låtene fra Borderline...";

    const playlistId = "482R3Wqd7Z5g7uJZ1trjJk";
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=50`;
    const songs = [];

    try {
        while (url) {
            const response = await fetch(url, {
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            if (!response.ok) {
                throw new Error("Spotify svarte med feil " + response.status);
            }

            const data = await response.json();

            for (const entry of data.items) {
                const song = entry.item || entry.track;

                if (song && song.type === "track") {
                    songs.push({
                        title: song.name,
                        artist: song.artists.map(a => a.name).join(", ")
                    });
                }
            }

            url = data.next;
        }

        
spotifyStatus.textContent =
    `Found ${songs.length} songs in Borderline!`;



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

    const navn = document.createElement("span");
    navn.textContent = `${song.title} – ${song.artist} `;

    const lenke = document.createElement("a");
    const sok = `${song.title} ${song.artist} chords`;

    lenke.href =
        "https://www.ultimate-guitar.com/search.php?search_type=title&value="
        + encodeURIComponent(sok);

    
lenke.textContent = "🎸 Find chords";

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
