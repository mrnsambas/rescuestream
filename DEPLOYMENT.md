# Production Deployment Guide

This guide covers deploying RescueStream to production using Vercel for the frontend.

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- GitHub account (for repository)
- Vercel account (for deployment)
- Environment variables configured

## Frontend Deployment to Vercel

### 1. Prepare the Repository

Ensure all code is committed and ready:

```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### 2. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Deploy from Frontend Directory

```bash
cd rescuestream/frontend
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (for first deployment)
- Project name? **rescuestream-frontend** (or your preference)
- Directory? **./** (current directory)
- Override settings? **No**

### 5. Configure Environment Variables

After initial deployment, set environment variables in Vercel:

**Option A: Via Vercel Dashboard**
1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
VITE_SOMNIA_RPC_URL=https://rpc.somnia.network
VITE_RESCUE_HELPER_ADDRESS=0x...
VITE_POSITION_SCHEMA_ID=0x...
VITE_POSITION_PUBLISHER=0x...
VITE_RELAYER_URL=https://your-relayer-url.vercel.app
VITE_WALLETCONNECT_ID=your-walletconnect-project-id
```

**Option B: Via Vercel CLI**

```bash
cd rescuestream/frontend
vercel env add VITE_SOMNIA_RPC_URL production
# Enter the value when prompted
vercel env add VITE_RESCUE_HELPER_ADDRESS production
# ... repeat for all variables
```

### 6. Redeploy with Environment Variables

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard after adding environment variables.

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SOMNIA_RPC_URL` | Somnia network RPC endpoint | `https://rpc.somnia.network` |
| `VITE_RESCUE_HELPER_ADDRESS` | RescueHelper contract address | `0x1234...` |
| `VITE_POSITION_SCHEMA_ID` | Somnia Streams schema ID | `0x0000...` |
| `VITE_POSITION_PUBLISHER` | Position publisher address | `0x0000...` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_RELAYER_URL` | Relayer API URL (for bot/history features) | `https://relayer.vercel.app` |
| `VITE_WALLETCONNECT_ID` | WalletConnect project ID | `abc123...` |

## Relayer Deployment

The relayer can be deployed separately (e.g., to Railway, Render, or a VPS).

### Using Railway

1. Connect your GitHub repository
2. Select the `rescuestream/relayer` directory
3. Add environment variables (see `relayer/.env.example`)
4. Deploy

### Using Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Set root directory to `rescuestream/relayer`
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`
6. Add environment variables

### Environment Variables for Relayer

See `relayer/.env.example` for all required variables. Key ones:

- `SOMNIA_RPC_URL` - RPC endpoint
- `LENDING_ADDR` - LendingAdapter contract address
- `RESCUE_HELPER_ADDR` - RescueHelper contract address
- `PRIVATE_KEY` - Relayer private key (must be owner of RescueHelper)
- `SOMNIA_SCHEMA_ID` - Streams schema ID
- `SOMNIA_PUBLISHER` - Publisher address

## Production Build Optimizations

The frontend build includes:

- **Code splitting**: Vendor chunks separated (React, Wagmi, Ethers)
- **Minification**: Terser with console/debugger removal
- **Asset optimization**: Automatic compression and caching headers
- **Source maps**: Disabled for production (smaller bundle)

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test wallet connection on production URL
- [ ] Verify RPC connection works
- [ ] Test position streaming (if relayer is deployed)
- [ ] Test rescue transaction flow
- [ ] Verify bot configuration page (if relayer is deployed)
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify HTTPS is working
- [ ] Check Vercel analytics for errors

## Troubleshooting

### Build Fails

- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version is 18+

### Environment Variables Not Working

- Ensure variables start with `VITE_` for Vite projects
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### RPC Connection Issues

- Verify `VITE_SOMNIA_RPC_URL` is correct
- Check if RPC endpoint is accessible
- Verify network/chain ID matches

### Wallet Connection Issues

- Ensure `VITE_WALLETCONNECT_ID` is set if using WalletConnect
- Check browser console for connection errors
- Verify chain configuration matches network

## Continuous Deployment

Vercel automatically deploys on every push to `main` branch. To disable:

1. Go to Vercel Dashboard → Settings → Git
2. Unlink repository or disable auto-deploy

## Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate is automatically provisioned

## Monitoring

- **Vercel Analytics**: Built-in analytics in dashboard
- **Error Tracking**: Check Vercel logs for errors
- **Performance**: Use Vercel Speed Insights

## Security Considerations

- Never commit `.env` files
- Use Vercel environment variables (encrypted)
- Rotate private keys regularly
- Use separate keys for production vs development
- Enable Vercel protection features (rate limiting, etc.)

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review [API documentation](./docs/api.md)
- Open an issue on GitHub

