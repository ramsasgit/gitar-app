#!/usr/bin/env python3
"""Synchronize the public song index from Spotify. No third-party dependencies."""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

PLAYLIST = "482R3Wqd7Z5g7uJZ1trjJk"
OUTPUT = Path("borderline-sangliste.json")

def request(url, token):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
            with urllib.request.urlopen(req, timeout=35) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code != 429 or attempt == 2:
                raise
            delay = min(int(exc.headers.get("Retry-After", "60")), 120)
            print("Spotify rate limit; retrying after", delay, "seconds")
            time.sleep(max(delay, 1))

def token():
    values = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": os.environ["SPOTIFY_REFRESH_TOKEN"],
        "client_id": os.environ["SPOTIFY_CLIENT_ID"],
    }).encode()
    req = urllib.request.Request("https://accounts.spotify.com/api/token", data=values,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=35) as response:
        data = json.load(response)
    if data.get("refresh_token") and data["refresh_token"] != os.environ["SPOTIFY_REFRESH_TOKEN"]:
        print("WARNING: Spotify rotated the refresh token; update the GitHub secret SPOTIFY_REFRESH_TOKEN.")
    return data["access_token"]

def main():
    access = token()
    url = "https://api.spotify.com/v1/playlists/" + PLAYLIST + "/items?limit=50"
    songs = []
    while url:
        page = request(url, access)
        for entry in page.get("items", []):
            track = entry.get("item") or entry.get("track") or {}
            if track.get("type") == "track" and track.get("name") and track.get("artists"):
                songs.append({"title": track["name"], "artist": ", ".join(a["name"] for a in track["artists"])})
        url = page.get("next")
        print("Fetched", len(songs), "tracks")
    if not songs:
        raise RuntimeError("Empty Spotify response; existing public playlist left unchanged")
    existing = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    if existing.get("songs") == songs:
        print("Playlist unchanged")
        return
    OUTPUT.write_text(json.dumps({"songs": songs, "complete": True}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Updated public index:", len(songs), "tracks")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Sync failed; existing playlist remains unchanged:", exc, file=sys.stderr)
        sys.exit(1)
