# PhotoPackager Web Edition

**Professional photo processing and delivery packaging - now in your browser**

A complete web-based port of PhotoPackager that processes photos entirely client-side with support for 20GB+ photo batches through intelligent streaming processing.

## 🚀 Features

- **Client-Side Processing**: All processing happens in your browser - no server uploads
- **Large Batch Support**: Handles 20GB+ photo folders through memory-efficient streaming
- **Professional Output**: Same folder structure and quality as desktop PhotoPackager
- **Multiple Formats**: Generate optimized and compressed JPG/WebP variants
- **Progress Tracking**: Real-time progress with time estimates and processing stats
- **ZIP Package**: Complete client delivery packages with README files
- **Cross-Platform**: Works on any device with a modern browser
- **No Installation**: Just open in browser and start processing

## 🛠️ Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Static Deployment
```bash
# Build and serve with Python
npm run build
python3 -m http.server 8080 -d dist
```

## 📁 Processing Workflow

1. **Drop Folder**: Drag entire photo folder into browser
2. **Configure**: Set project name, studio info, and processing options
3. **Process**: Automatic streaming processing of all photos
4. **Download**: Get complete ZIP package with organized folders

## 🏗️ Architecture

### Core Components
- **ImageProcessor**: Handles individual photo processing with Canvas API
- **PackageBuilder**: Creates PhotoPackager-compatible folder structure and ZIP
- **Streaming Engine**: Memory-efficient processing for large batches

### Processing Pipeline
```
Files → Stream Processing → Format Variants → Package → ZIP Download
```

### Memory Management
- Process photos one-by-one to avoid browser memory limits
- Automatic garbage collection hints
- Progress tracking with memory usage stats

## 🎯 Output Structure

```
ProjectName_Complete.zip
└── ProjectName/
    ├── README.txt
    ├── Export Originals/
    │   └── 001-ProjectName.jpg, 002-ProjectName.jpg...
    ├── Optimized Files/
    │   ├── Optimized JPGs/
    │   └── Optimized WebPs/
    └── Compressed Files/
        ├── Compressed JPGs/
        └── Compressed WebPs/
```

## 📊 Performance

- **Large Batches**: Tested with 500+ photos (15GB+)
- **Memory Usage**: <2GB peak during processing
- **Speed**: ~2-5 photos/second depending on size and browser
- **Formats**: Full support for JPG, PNG, WebP, plus RAW detection

## 🌐 Browser Support

- **Chrome/Edge**: Full support including memory management
- **Firefox**: Full support with good performance  
- **Safari**: Full support on macOS/iOS
- **Mobile**: Supported but limited by device memory

## 🚀 Deployment Options

### Static Hosting
- **GitHub Pages**: Perfect for public access
- **Netlify/Vercel**: Easy deployment with custom domains
- **S3 + CloudFront**: Enterprise deployment

### Local Hosting
```bash
# Simple Python server
python3 -m http.server 8080

# Or Node.js
npx serve dist -p 8080
```

## 🔧 Configuration

### Quality Settings
- **Optimized**: 85% quality (high-quality delivery)
- **Compressed**: 65% quality (web/social use)
- **Max Dimension**: 2048px (configurable)

### EXIF Handling
- Preserve all metadata
- Strip all metadata
- Selective removal (date, camera, both)

## 📝 License

MIT License - Same as original PhotoPackager

## 🤝 Credits

Web edition of PhotoPackager by Steven Seagondollar, DropShock Digital LLC

Original PhotoPackager: https://github.com/seagpt/PhotoPackager