# SSI127 Accounts UI

Single-page application (SPA) for SSI127 self-sovereign identity management. Built with vanilla JavaScript, styled with the 127crew dark theme.

## Overview

This frontend provides a complete accounts/dashboard interface for managing DIDs (Decentralized Identifiers) and OAuth clients through the SSI127 backend API.

## Features

- **DID-Based Authentication** — Challenge/response signing flow
- **Dashboard** — User overview and quick actions
- **DID Management** — View and manage decentralized identifiers
- **OAuth Client Registration** — Register applications and retrieve credentials
- **Profile Management** — Account settings and API token access
- **Responsive Design** — Dark theme, mobile-friendly
- **No Dependencies** — Vanilla JS, no npm/build step required

## Pages

1. **Login** (`/login`)
   - DID input field
   - Challenge-response authentication flow
   - Demo DID button for testing

2. **Dashboard** (`/dashboard`)
   - User welcome and quick stats
   - Links to management pages
   - Account overview

3. **DIDs** (`/dids`)
   - View current DID
   - Copy DID to clipboard
   - Future: Create/import DIDs

4. **Clients** (`/clients`)
   - Register OAuth applications
   - Enter app name and redirect URIs
   - Receive client ID and secret

5. **Profile** (`/profile`)
   - Account information
   - Session management
   - View/copy JWT token for API access

## Architecture

- **Router**: Simple client-side SPA router (`js/lib/router.js`)
- **Storage**: LocalStorage wrapper for auth tokens and user data (`js/lib/storage.js`)
- **API Client**: Fetch-based API wrapper for SSI127 backend (`js/api.js`)
- **Pages**: Modular page components (`js/pages/*.js`)

## API Endpoints

The app communicates with these SSI127 backend endpoints:

- `POST /auth/challenge` — Get challenge nonce
- `POST /auth/verify` — Verify signature and get JWT
- `GET /auth/jwks` — Get JWT public keys
- `POST /clients/register` — Register OAuth client
- `POST /oauth/authorize` — OAuth authorization
- `POST /oauth/token` — Exchange code for token

## Local Development

```bash
cd /mnt/Projects/127crew/SSI127-UI
python3 -m http.server 8000
```

Visit http://localhost:8000

**Note:** If running locally, update the API base URL in `js/api.js` to point to your local SSI127 backend (default: `http://localhost:8080`)

## Deployment to GitHub Pages

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add SSI127 accounts UI"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repo **Settings** → **Pages**
   - Set source to `main` branch / `/ (root)`
   - GitHub will auto-read the `CNAME` file

3. **DNS Setup:**
   - Add a CNAME record in your domain registrar:
     - **Name:** `accounts`
     - **Target:** `<your-github-username>.github.io`
   - Wait 5-10 minutes for DNS propagation

4. **Verify:**
   - Visit https://accounts.127crew.dev
   - Should see the login page

## Configuration

### Backend URL
Update the API base URL in `js/api.js`:
```javascript
const API_CLIENT = new API(
  window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://ssi.127crew.dev'
);
```

### CORS
Ensure your SSI127 backend has CORS enabled for `accounts.127crew.dev` domain.

## Authentication Flow

1. User enters their DID
2. Frontend requests challenge nonce from `/auth/challenge`
3. Frontend displays "awaiting signature" (mock signature in demo)
4. Frontend sends signature to `/auth/verify`
5. Backend returns JWT token
6. Token stored in localStorage, user redirected to dashboard

## File Structure

```
SSI127-UI/
├── index.html              # SPA entry point
├── css/
│   ├── style.css          # Base/utility styles from 127crew.dev
│   └── auth.css           # Auth and dashboard specific styles
├── js/
│   ├── app.js             # Router setup and app bootstrap
│   ├── api.js             # API client wrapper
│   ├── lib/
│   │   ├── router.js      # Simple SPA router
│   │   └── storage.js     # Auth token/user storage
│   └── pages/
│       ├── login.js       # Login page component
│       ├── dashboard.js   # Dashboard page
│       ├── dids.js        # DIDs management page
│       ├── clients.js     # OAuth clients page
│       └── profile.js     # Profile/settings page
├── CNAME                  # GitHub Pages custom domain
└── README.md
```

## Notes

- This is a static frontend with no build step required
- All authentication happens via the backend API
- JWT tokens are stored in localStorage (suitable for SPAs)
- For production, add HTTPS enforcement and consider secure cookie storage
- The demo uses a mock signature for testing; real implementations should use cryptographic signing

## Support

For issues or questions:
- Check SSI127 backend logs
- Ensure CORS is configured on backend
- Verify backend is running and accessible
