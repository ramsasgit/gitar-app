const clientId = "b27e90e779de42e8a80bee4e12c50c7d";
const redirectUri = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5500/callback.html"
    : "https://ramsasgit.github.io/gitar-app/callback.html";

const statusText = document.getElementById("status");

async function completeLogin() {
    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
        statusText.textContent = "Spotify-innloggingen ble avbrutt.";
        return;
    }

    const savedState = sessionStorage.getItem("spotify_state");
    const verifier = sessionStorage.getItem("spotify_verifier");

    if (!code || !state || state !== savedState || !verifier) {
        statusText.textContent =
            "Innloggingen kunne ikke bekreftes. Prøv igjen.";
        return;
    }

    try {
        const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: redirectUri,
                    code_verifier: verifier
                })
            }
        );

        if (!response.ok) {
            throw new Error("Spotify svarte med feil.");
        }

        const data = await response.json();

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );


if (data.refresh_token) {
    localStorage.setItem(
        "spotify_refresh_token",
        data.refresh_token
    );
}

localStorage.setItem(
    "spotify_token_expires",
    String(Date.now() + data.expires_in * 1000)
);


        sessionStorage.removeItem("spotify_state");
        sessionStorage.removeItem("spotify_verifier");

        statusText.textContent =
            "Spotify er koblet til! 🎉";

        history.replaceState(
            {},
            "",
            window.location.pathname
        );

    } catch (error) {
        statusText.textContent =
            "Kunne ikke fullføre innloggingen: " + error.message;
    }
}

completeLogin();
