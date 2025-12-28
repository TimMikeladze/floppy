<div align="center">
  <h1>📚 Floppy</h1>
  <p><strong>A modern, web-based comic book reader for the digital age</strong></p>

  <p>
    <a href="https://github.com/TimMikeladze/floppy/stargazers"><img src="https://img.shields.io/github/stars/TimMikeladze/floppy?style=social" alt="GitHub stars"></a>
    <a href="https://github.com/TimMikeladze/floppy/network/members"><img src="https://img.shields.io/github/forks/TimMikeladze/floppy?style=social" alt="GitHub forks"></a>
    <a href="https://github.com/TimMikeladze/floppy/blob/main/LICENSE"><img src="https://img.shields.io/github/license/TimMikeladze/floppy" alt="License"></a>
    <a href="https://github.com/TimMikeladze/floppy/issues"><img src="https://img.shields.io/github/issues/TimMikeladze/floppy" alt="Issues"></a>
  </p>
</div>

---

## 📸 Screenshot

![Floppy Comic Reader](https://via.placeholder.com/1200x600/1a1a2e/eaeaea?text=Floppy+Comic+Reader+Screenshot)

*A beautiful, intuitive interface for reading your favorite comics*

---

## ✨ About

**Floppy** is a feature-rich, browser-based comic book reader built with modern web technologies. Read your comic collection anywhere, on any device, with support for multiple formats and powerful organization tools.

Whether you're catching up on your favorite series or discovering new stories, Floppy provides a seamless reading experience with customizable settings, bookmarks, notes, and progress tracking.

---

## 🚀 Features

### 📖 **Multi-Format Support**
- **CBZ** (Comic Book ZIP) files
- **CBR** (Comic Book RAR) files
- **PDF** documents

### 📱 **Cross-Platform & Responsive**
- Works on desktop, tablet, and mobile devices
- Progressive Web App (PWA) support
- Touch-optimized controls for mobile reading

### 🎨 **Customizable Reading Experience**
- Multiple page layouts (single, double-page spread)
- Reading directions (left-to-right, right-to-left)
- Fit modes (fit-width, fit-height, original size)
- Paged and continuous scrolling modes
- Adjustable brightness and themes (light/dark)
- Customizable toolbar positions

### 📚 **Library Management**
- Import comics from local files or CSV data sources
- Organize comics into custom lists and collections
- Track reading progress automatically
- Series and issue detection
- Grid and table view modes
- Search and filter your collection

### 🔖 **Reading Tools**
- Create bookmarks with notes and thumbnails
- Add notes to specific pages
- Quick note functionality for on-the-go annotations
- Page navigation with keyboard shortcuts

### 💾 **Data Persistence**
- IndexedDB storage for offline access
- File System Access API support (Chrome/Edge)
- Import/export library backups
- Remote comic sources support

### 🎯 **Smart Features**
- Automatic series grouping
- Next issue suggestions
- Reading statistics
- Resume from last read page

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm/bun
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TimMikeladze/floppy.git
   cd floppy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to start using Floppy.

---

## 🎯 Usage

### Adding Comics to Your Library

1. **Upload Local Files**
   - Click the "Upload" button in the library header
   - Select CBZ, CBR, or PDF files from your device
   - Files are stored locally in your browser's IndexedDB

2. **Import from CSV**
   - Prepare a CSV file with comic metadata and image URLs
   - Click "Import Data Source" in the library
   - Select your CSV file to batch import comics

3. **Manual Entry**
   - Click "Add Comic" to manually create entries
   - Fill in metadata (title, series, issue, author, etc.)
   - Attach files later using the "Attach File" option

### Reading Comics

1. **Open a Comic**
   - Click any comic card or table row to open the detail sheet
   - Click "Read" to start reading from your last position
   - New comics start from page 1

2. **Navigation**
   - Click left/right edges or use arrow keys to navigate pages
   - Use the page indicator to jump to specific pages
   - Access the reader menu for additional options

3. **Customize Your Experience**
   - Open the settings panel (gear icon)
   - Adjust layout, fit mode, brightness, and more
   - Settings are saved per-comic

### Organizing Your Collection

1. **Create Lists**
   - Access the list manager from the library header
   - Create custom lists (Reading, Completed, Want to Read, etc.)
   - Assign colors to lists for easy identification

2. **Add Comics to Lists**
   - Right-click a comic card or use the action menu
   - Select "Add to List"
   - Choose one or more lists

### Bookmarks & Notes

- **Add Bookmark**: Click the bookmark icon while reading
- **Add Note**: Use the quick note button or notes panel
- **View All**: Access the bookmarks/notes panels from the reader toolbar

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Support**: [PDF.js](https://mozilla.github.io/pdf.js/)
- **Archive Support**: [libarchive.js](https://github.com/nika-begiashvili/libarchivejs)
- **Storage**: IndexedDB with File System Access API
- **Compression**: [JSZip](https://stuk.github.io/jszip/)

---

## 🧪 Development

### Project Structure

```
floppy/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── library/     # Library management components
│   │   ├── reader/      # Comic reader components
│   │   └── ui/          # Reusable UI components
│   ├── lib/             # Utilities and core logic
│   │   ├── storage.ts   # IndexedDB operations
│   │   ├── comic-parser.ts  # Comic file parsing
│   │   ├── pdf-parser.ts    # PDF handling
│   │   ├── cbr-parser.ts    # CBR/RAR handling
│   │   └── types.ts     # TypeScript types
│   └── hooks/           # Custom React hooks
├── public/              # Static assets
└── package.json
```

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

The production build is optimized and ready for deployment.

---

## 🚢 Deployment

### Deploy on Vercel

The easiest way to deploy Floppy is using the [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TimMikeladze/floppy)

### Deploy on Other Platforms

Floppy is a standard Next.js application and can be deployed to:
- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Fly.io](https://fly.io/)
- Any platform supporting Node.js

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- PDF rendering by [PDF.js](https://mozilla.github.io/pdf.js/)
- Archive extraction by [libarchive.js](https://github.com/nika-begiashvili/libarchivejs)

---

<div align="center">
  <p>Made with ❤️ for comic book enthusiasts</p>
  <p>
    <a href="https://github.com/TimMikeladze/floppy/issues/new">Report Bug</a>
    ·
    <a href="https://github.com/TimMikeladze/floppy/issues/new">Request Feature</a>
  </p>
</div>
