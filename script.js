
const songs = [
    {
        title: "Say Nothing",
        artist: "Ashez, Chmura",
        spotify: "3GLbxyOPtaAoLTJR0mIK32"
    },
    {
        title: "U.F.Orb",
        artist: "The Orb",
        spotify: "7M7UsilKcShcDMcuuU4ylD"
    },
    {
        title: "Waiting on the Reaper",
        artist: "Spiritworld",
        spotify: "04sgIlzuGYceS3Yw1nIk7i"
    },
    {
        title: "Infinite",
        artist: "Notaker",
        spotify: "340oae72yIM0ftHQxzeMCU"
    },
    {
        title: "Maggot Brain",
        artist: "Funkadelic",
        spotify: "5WJU527RQNyMLuKecjsL8V"
    },
    {
        title: "Love in the Night",
        artist: "Skatebård",
        spotify: "1fRkrCgp1BFtTBUXxelmdX"
    },
    {
        title: "The Bells of Mist",
        artist: "Skatebård",
        spotify: "3TQ1ut69iNhYBPSUZ1iZop"
    },
    {
        title: "Look Like My Mama",
        artist: "AZ Chike, Tyler, The Creator",
        spotify: "2TwW2fNE3TPPLum0vi9rUK"
    },
    {
        title: "SAME SH!T",
        artist: "Isaiah Rashad",
        spotify: "6gbcv097aD6bzPeUo2BLhl"
    },
    {
        title: "25 or 6 to 4",
        artist: "Chicago",
        spotify: "0kzjIROGBtt26DbPL0X7iP"
    }
];

const songList = document.getElementById("song-list");

songs.forEach(song => {
    const card = document.createElement("div");
    card.className = "song-card";

    const title = document.createElement("h3");
    title.textContent = song.title;

    const artist = document.createElement("p");
    artist.textContent = song.artist;

    const spotifyLink = document.createElement("a");
    spotifyLink.href = "https://open.spotify.com/track/" + song.spotify;
    spotifyLink.target = "_blank";
    spotifyLink.rel = "noopener noreferrer";
    spotifyLink.textContent = "▶ Open in Spotify";


const guitarLink = document.createElement("a");

const searchText = song.artist + " " + song.title;

guitarLink.href =
    "https://www.ultimate-guitar.com/search.php?search=" +
    encodeURIComponent(searchText);

guitarLink.target = "_blank";
guitarLink.rel = "noopener noreferrer";
guitarLink.textContent = "🎸 Find chords";

guitarLink.style.marginLeft = "20px";
    
card.appendChild(title);
    card.appendChild(artist);
    card.appendChild(spotifyLink);
card.appendChild(guitarLink);

const statusMenu = document.createElement("select");


const statuses = [
    "Want to learn",
    "Practicing",
    "Can play",
    "Learn later"
];

const gamleStatuser = {
    "Vil lære": "Want to learn",
    "Øver på": "Practicing",
    "Kan spille": "Can play",
    "Lær senere": "Learn later"
};


const savedStatus = localStorage.getItem(
    "guitar-status-" + song.spotify
);

statuses.forEach(status => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusMenu.appendChild(option);
});


statusMenu.value =
    gamleStatuser[savedStatus] || savedStatus || "Want to learn";


statusMenu.addEventListener("change", () => {
    localStorage.setItem(
        "guitar-status-" + song.spotify,
        statusMenu.value
    );
});

card.appendChild(statusMenu);


    songList.appendChild(card);
});
