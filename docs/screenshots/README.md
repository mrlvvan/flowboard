# Screenshots / demo media

This folder is for screenshots and the demo GIF used in the project README.

## What to capture

1. **`board.png`** — the kanban board with 3 columns and a handful of cards.
   Open a board with some real data, drag it to 1280×800, hit `Cmd/Ctrl+Shift+5`
   (mac) or **Snipping Tool** (Windows) and save as `board.png`.

2. **`card-modal.png`** — a card modal opened, with description (markdown),
   a checklist with mixed progress, labels, due date, and 2-3 comments visible.

3. **`demo.gif`** — a ~20-30 second clip showing:
   - landing → login → board grid
   - opening a board
   - dragging a card between columns
   - opening a card → editing description → checking off checklist items
   - bonus: toggling EN/RU in the sidebar so a recruiter sees i18n

   Recording tools:
   - **Windows**: [ScreenToGif](https://www.screentogif.com/) (free) — record + crop + export GIF in one app
   - **macOS**: [Kap](https://getkap.co/) or built-in `Cmd+Shift+5` (mp4) → convert via `ffmpeg -i demo.mov -vf "fps=15,scale=960:-1" -loop 0 demo.gif`
   - **Cross-platform**: [Loom](https://www.loom.com) for video, or **OBS Studio** → ffmpeg

Keep `demo.gif` **under 10 MB** so GitHub renders it inline without timing out.
Target ~15 fps, 960px wide, 30-60 frames total.

## Referenced from

`README.md` at the project root references `docs/screenshots/board.png`,
`docs/screenshots/card-modal.png`, and `docs/screenshots/demo.gif`. Until
the files exist, those image tags render broken icons — drop the files in
here and they'll show up automatically.
