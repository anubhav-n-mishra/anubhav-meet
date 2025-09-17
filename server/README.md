# Anubhav Meet - Server Deployment

## Quick Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select `anubhav-n-mishra/anubhav-meet`
5. Set Root Directory: `server`
6. It will auto-deploy!

## Environment Variables (Auto-detected)
- PORT: (Railway sets automatically)
- NODE_ENV: production

## After Deploy
- Copy the Railway URL (e.g., `https://anubhav-meet-server.up.railway.app`)
- Add to Vercel as `VITE_SIGNALING_URL`

## Local Test
```bash
cd server
npm start
# Test at http://localhost:3001
```