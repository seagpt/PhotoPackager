# 🌐 PhotoPackager Web Edition

> **Client-Side Photo Processing in Your Browser**  
> A complete web-based version of PhotoPackager that runs entirely in the browser

## 🚀 Quick Access

- **🌍 Live Demo:** [Coming Soon - Railway Deployment]
- **📂 Source Code:** `/web-edition/` directory in this repository
- **🐳 Docker Ready:** Full production deployment with Docker + Nginx

## ✨ Key Features

### 🔒 **100% Client-Side Processing**
- All photo processing happens in your browser
- No files uploaded to servers - complete privacy
- Handle 20GB+ photo batches locally

### 🎨 **Professional Interface**
- Dark theme matching PhotoPackager patch design  
- Mobile-first responsive design
- WCAG 2.1 accessibility compliance
- Touch-friendly controls for tablets/phones

### ⚡ **Performance Optimized**
- Adaptive batch processing (2-50 photos per batch)
- Memory pressure detection and management
- Progress persistence with browser storage
- Streaming file processing for large collections

### 📊 **Enterprise Features**
- Privacy-compliant analytics with explicit consent
- GDPR/CCPA cookie consent system
- Comprehensive error handling and recovery
- Complete legal framework (Terms, Privacy Policy)

### 🛠️ **Developer Ready**
- Docker production deployment
- Comprehensive UI testing framework
- MIT Licensed open source
- Railway/Render/Fly.io deployment ready

## 🆚 Desktop vs Web Edition

| Feature | Desktop Edition | Web Edition |
|---------|----------------|-------------|
| **Installation** | Download & Install | Open in Browser |
| **File Access** | Full System Access | Drag & Drop Only |
| **Batch Size** | Unlimited | 20GB+ (Browser Memory) |
| **Privacy** | Local Processing | Client-Side Only |
| **Sharing** | Local Use Only | Public URL Available |
| **Updates** | Manual Download | Auto-Updated |
| **Offline** | ✅ Full Offline | ❌ Requires Internet |
| **Mobile** | ❌ Desktop Only | ✅ Mobile Optimized |

## 🚀 Quick Start

### Option 1: Docker Deployment
```bash
cd web-edition
docker build -t photopackager-web .
docker run -p 8080:8080 photopackager-web
```

### Option 2: Static File Serving
```bash
cd web-edition
python -m http.server 8000
# Open http://localhost:8000
```

### Option 3: Deploy to Railway (Free)
1. Fork this repository
2. Go to [railway.app](https://railway.app)
3. Deploy from GitHub repo
4. Railway auto-detects Docker configuration

## 📁 Directory Structure

```
web-edition/
├── index.html              # Main application
├── src/
│   ├── js/
│   │   ├── ImageProcessor.js     # Core photo processing
│   │   ├── PerformanceOptimizer.js  # Memory management
│   │   ├── ErrorHandler.js       # Error recovery system  
│   │   ├── ProgressPersistence.js   # Session management
│   │   └── ...
│   └── styles/
│       ├── main.css         # Main dark theme
│       ├── mobile.css       # Mobile optimizations
│       └── accessibility.css    # WCAG compliance
├── Dockerfile              # Production container
├── railway.json           # Railway deployment config
├── privacy-policy.html    # GDPR/CCPA compliance
├── terms-of-service.html  # Legal framework
└── README.md             # Detailed documentation
```

## 🔧 Development

The web edition maintains feature parity with the desktop version while adding web-specific enhancements:

- **Drag & Drop Interface:** Intuitive file selection
- **Real-time Progress:** Live processing feedback  
- **Error Recovery:** Automatic retry and skip options
- **Mobile Support:** Touch-optimized controls
- **Keyboard Shortcuts:** Accessibility compliance
- **Dark Theme:** Matches PhotoPackager aesthetic

## 📜 License

MIT License - Same as PhotoPackager Desktop Edition

## 🤝 Contributing

Web Edition contributions welcome! The web version shares the same MIT license and contribution guidelines as the desktop version.

---

<div align="center">
  <strong>Part of the PhotoPackager ecosystem by <a href="https://dropshockdigital.com">DropShock Digital</a></strong>
</div>