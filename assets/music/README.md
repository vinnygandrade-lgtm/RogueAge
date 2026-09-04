# RogueAge music beds

Looping BGM. The client plays **one** bed at a time (`src/systems/game_bgm.ts`).

| File | Cue | Notes |
|------|-----|--------|
| `login.mp3` | Login, character select, creation | *RogueAge Gate* (original, 80 kb/s, no cover art) |
| `hub.mp3` | In-game town / world / bag (not on a live expedition) | Medieval inn / plaza |
| `expedition_ng.mp3` | Forest Expedition, No-Grade | Existing trail bed |
| `expedition_d.mp3` | Forest Expedition, D-grade | Existing courtyard bed |

Volume: Settings → Sound → Music. Off pauses without unloading.

## Credits

| File | Track | Author | Source |
|------|-------|--------|--------|
| `login.mp3` | RogueAge Gate | project original | Downloads → re-encoded 80 kb/s stereo, cover stripped |
| `hub.mp3` | Medieval: The Old Tower Inn | RandomMind (CC0) | https://opengameart.org/content/medieval-the-old-tower-inn |

Drop a replacement MP3 with the same filename to retune without a code change. Keep beds **under ~1 MB** when you can (80 kb/s, no album art).
