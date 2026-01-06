<div align="center">
  <img src="https://via.placeholder.com/800x200/1a1a2e/eaeaea?text=FLOPPY" alt="Floppy Banner" width="100%">

  <h3>A modern, web-based comic book reader</h3>

  <p>
    <a href="https://github.com/TimMikeladze/floppy/stargazers"><img src="https://img.shields.io/github/stars/TimMikeladze/floppy?style=flat" alt="Stars"></a>
    <a href="https://github.com/TimMikeladze/floppy/blob/main/LICENSE"><img src="https://img.shields.io/github/license/TimMikeladze/floppy" alt="License"></a>
    <a href="https://github.com/TimMikeladze/floppy/issues"><img src="https://img.shields.io/github/issues/TimMikeladze/floppy" alt="Issues"></a>
  </p>
</div>

---

## Screenshots

<div align="center">
  <img src="https://via.placeholder.com/400x300/2d2d44/eaeaea?text=Library+View" alt="Library" width="45%">
  <img src="https://via.placeholder.com/400x300/2d2d44/eaeaea?text=Reader+View" alt="Reader" width="45%">
</div>

<div align="center">
  <img src="https://via.placeholder.com/400x300/2d2d44/eaeaea?text=Mobile+View" alt="Mobile" width="45%">
  <img src="https://via.placeholder.com/400x300/2d2d44/eaeaea?text=Settings" alt="Settings" width="45%">
</div>

---

## Features

- **Multi-format support** — Read CBZ, CBR, and PDF files
- **Library management** — Organize comics into lists, track reading progress, search and filter
- **Customizable reader** — Single/double page layouts, multiple fit modes, light/dark themes
- **Bookmarks & notes** — Annotate pages and save your favorite moments
- **Offline-first** — All data stored locally in your browser
- **PWA support** — Install as a standalone app on any device
- **Import/Export** — Backup your library or import from CSV data sources

---

## Running Locally

### Prerequisites

Install [Bun](https://bun.sh/) if you don't have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Development

```bash
git clone https://github.com/TimMikeladze/floppy.git
cd floppy
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
bun run build
bun start
```

---

## Docker

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000)

### Using Docker Directly

```bash
docker build -t floppy .
docker run -p 3000:3000 floppy
```

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TimMikeladze/floppy)

Or deploy via CLI:

```bash
bunx vercel
```

### Docker (Any Platform)

Deploy the Docker image to any container platform:

- **Railway**: `railway up`
- **Fly.io**: `fly launch`
- **DigitalOcean App Platform**: Connect your repo and deploy
- **AWS/GCP/Azure**: Push to your container registry and deploy

### Self-Hosted

Any platform that supports Node.js, Bun, or Docker.

#### Using Bun/Node.js:

```bash
bun run build
bun start
```

#### Using Docker:

```bash
docker build -t floppy .
docker run -p 3000:3000 floppy
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
