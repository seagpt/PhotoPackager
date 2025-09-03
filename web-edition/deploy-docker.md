# PhotoPackager Web Edition - Docker Deployment

## 🐳 Docker Deployment Options

### Single Instance (Development/Testing)
```bash
# Build and run single container
docker-compose up --build

# Access at: http://localhost:8080
```

### Scaling Multiple Instances
```bash
# Run with load balancing across 3 instances
docker-compose --profile scaling --profile proxy up --build

# Access at: http://localhost (port 80)
# Load balanced across photopackager-web, photopackager-web-2, photopackager-web-3
```

### Production Deployment
```bash
# Build production image
docker build -t photopackager-web:latest .

# Run in production mode
docker run -d \
  --name photopackager-web \
  --restart unless-stopped \
  -p 80:80 \
  photopackager-web:latest

# Or use docker-compose for production
docker-compose -f docker-compose.yml up -d
```

## 📊 Container Features

### Multi-Stage Build
- **Builder Stage**: Node.js 18 Alpine for building the app
- **Production Stage**: Nginx Alpine for serving (minimal size)
- **Size**: ~25MB final image (nginx + static files)

### Performance Optimizations
- **Gzip Compression**: All text assets compressed
- **Static Asset Caching**: 1-year cache for JS/CSS/images
- **Health Checks**: Built-in container health monitoring
- **Security Headers**: X-Frame-Options, X-XSS-Protection, etc.

### Scaling Architecture
- **Load Balancer**: Nginx upstream with least_conn
- **Multiple Instances**: Scale to 3+ containers easily
- **Health Monitoring**: Automatic failover for unhealthy containers
- **Zero Downtime**: Rolling deployments supported

## 🚀 Deployment Commands

### Local Development
```bash
cd /tmp/photopackager-web
docker-compose up --build
```

### Production Single Instance
```bash
docker-compose up -d
```

### Production with Scaling
```bash
docker-compose --profile scaling --profile proxy up -d
```

### Update Deployment
```bash
# Pull latest changes and rebuild
git pull
docker-compose down
docker-compose up --build -d
```

## 🌐 Access URLs

- **Development**: http://localhost:8080
- **Production**: http://localhost or your-domain.com
- **Health Check**: http://localhost/health (with proxy)

## 📈 Scaling Benefits

1. **Load Distribution**: Multiple containers handle concurrent users
2. **Fault Tolerance**: If one container fails, others continue serving
3. **Easy Scaling**: Add more instances with simple docker-compose changes
4. **Resource Efficiency**: Each container uses minimal resources
5. **Clean Deployment**: Consistent environment across dev/staging/prod

## 🔧 Configuration

### Environment Variables
- `NODE_ENV=production` (set automatically)
- Custom nginx configs in `nginx.conf`
- Scaling profiles in `docker-compose.yml`

### Customization
- Modify `nginx.conf` for custom routing/caching
- Adjust `docker-compose.yml` for different port mappings
- Update `proxy.conf` for custom load balancing rules

## 🏗️ Architecture

```
Internet → Nginx Proxy → Load Balancer → PhotoPackager Instances (3x)
                                      → Health Checks
                                      → Static Asset Cache
```

**Production Ready Docker Setup ✅**