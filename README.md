# floppy

The free, open-source comic book app that works offline, respects your privacy, and runs on every device. No sign-up. No tracking. Just reading.

Supports CBZ, CBR, PDF, and EPUB. All data stays on your device — no backend, no accounts, nothing collected. Purpose-built for comics: gesture controls, reading progress, bookmarks, and a library that auto-organizes by series. Install it as a PWA on any phone, tablet, or desktop.

Free forever. Open source from day one. Community-driven — bug reports and pull requests welcome.

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
