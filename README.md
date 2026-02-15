# floppy

A comic book reader that runs in your browser. Free, open source, and offline-first.

## What it does

Drop in your comics and start reading. Floppy handles CBZ, CBR, PDF, and EPUB files — the formats you actually have sitting on your hard drive.

**Reader** — Single page, double-page spreads, or continuous scroll. Swipe to turn pages, pinch to zoom. Pick up where you left off — your progress is saved automatically.

**Library** — Your collection organizes itself by series. Filter by reading status, search across everything, or build custom lists. Works whether you have 10 issues or 10,000.

**Bookmarks & notes** — Mark pages you want to come back to. Add notes while you read.

**Releases tracker** — Follow upcoming releases across publishers. Know what's coming out and when.

## How it works

Everything stays on your device. There's no server storing your data, no account to create, no information collected. Your comics are saved in the browser's local storage and accessible offline.

Floppy is a progressive web app — install it on your phone, tablet, or desktop directly from the browser. No app store required.

## Running locally

Install [Bun](https://bun.sh/) (or use Node.js 18+), then:

```bash
git clone https://github.com/TimMikeladze/floppy.git
cd floppy
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

Or with Docker:

```bash
docker compose up -d
```

## Contributing

1. Fork the repo and create a branch
2. Make your changes
3. Make sure `bun run build` succeeds
4. Open a pull request

## License

MIT
