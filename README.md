# floppy

A free, open-source comic book reader that runs in the browser. Offline-first, no account required, no data collected.

## What is this?

Floppy is a web-based app for reading and organizing comic books. It supports CBZ, CBR, PDF, and EPUB formats. All data lives in your browser via IndexedDB — there's no backend, no database server, and nothing leaves your device.

### Goals

- **Privacy by default** — no accounts, no tracking, no server-side storage
- **Offline-first** — works without an internet connection once loaded
- **Multi-format** — handle the comic formats people actually use
- **Installable** — runs as a PWA on any device, no app store needed

## Tech stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Comic parsing | [libarchive.js](https://github.com/nicholaskariniemi/libarchive.js) (CBR/RAR), [JSZip](https://stuk.github.io/jszip/) (CBZ), [PDF.js](https://mozilla.github.io/pdf.js/) (PDF) |
| Storage | IndexedDB, [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) |
| Linting | [Biome](https://biomejs.dev/) |
| Runtime | [Bun](https://bun.sh/) |

## Running locally

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

```bash
curl -fsSL https://bun.sh/install | bash
```

### Setup

```bash
git clone https://github.com/TimMikeladze/floppy.git
cd floppy
bun install
bun run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun start` | Run the production server |
| `bun run lint` | Run the linter |
| `bun run generate:releases` | Regenerate releases data from YAML sources |

### Docker

```bash
docker compose up -d
```

## Project structure

```
src/
├── app/            # Next.js pages and routes
├── components/     # React components (library, reader, releases, ui)
├── hooks/          # Custom React hooks
├── lib/            # Parsers, storage, types, utilities
└── flags/          # Feature flags
data/               # YAML source files for the releases tracker
scripts/            # Build-time data generation
public/             # Static assets, PWA manifest, service worker
```

## Contributing

1. Fork the repo and create a branch
2. Make your changes
3. Make sure `bun run build` succeeds
4. Open a pull request

## License

MIT
