# KikStars Platform - Deployment Guide

## 🚀 Cloudflare Pages Deployment

### Prerequisites
1. Cloudflare account with Pages enabled
2. GitHub repository
3. Separate backend hosting (Railway, Render, Heroku, etc.)

### Frontend Deployment (Cloudflare Pages)

#### Option 1: GitHub Integration (Recommended)
1. Connect your GitHub repo to Cloudflare Pages
2. Set build settings:
   - **Build command**: `npm run build:client`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` (leave empty)

#### Option 2: Manual CLI Deployment
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Pages
npm run build:client
wrangler pages deploy dist/public --project-name kikstars-platform
```

### Environment Variables (Cloudflare Pages)
Set these in Cloudflare Pages dashboard:
```
VITE_SUPABASE_URL=https://igtkrpfpbbcciqyozuqb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://your-backend-domain.com
NODE_ENV=production
```

### Backend Deployment

Since Cloudflare Pages doesn't support Node.js servers, deploy your backend separately:

#### Railway (Recommended)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`
4. Set environment variables in Railway dashboard

#### Render
1. Connect GitHub repo to Render
2. Create new Web Service
3. Set build command: `npm run build:server`
4. Set start command: `npm run start`

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Important Configuration

#### Update _redirects file
Update the API URL in `_redirects`:
```
/api/* https://your-actual-backend-domain.com/api/:splat 200
/* /index.html 200
```

#### CORS Configuration
Ensure your backend allows requests from your Cloudflare Pages domain.

### Domain Setup
1. Add custom domain in Cloudflare Pages
2. Configure DNS records
3. Enable SSL/TLS

### Monitoring
- Set up Cloudflare Analytics
- Configure error tracking
- Monitor API performance

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build:client
```

## 📝 Notes
- Frontend is deployed to Cloudflare Pages
- Backend must be deployed separately (Express.js not supported on Pages)
- Database connections handled through Supabase
- Static assets are automatically cached by Cloudflare CDN