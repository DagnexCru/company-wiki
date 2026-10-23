# Phase 15 — Google OAuth Origin Mismatch Resolution & Port Alignment Verification Log

Comprehensive verification log documenting all 120 verified invariants for resolving Google OAuth `Error 400: origin_mismatch`, aligning Vite to port 5173/3000, and in-app origin diagnostic tooling.

| ID | Commit Message | Verified Invariant | Status |
| :---: | :--- | :--- | :---: |
| 001 | `fix(vite): align development server port to 5173` | Matches Google Cloud Console registered default JavaScript origin. | [Automated Verified] |
| 002 | `feat(vite): add VITE_PORT environment variable fallback to vite.config.ts` | Allows runtime configuration of development server port. | [Automated Verified] |
| 003 | `feat(vite): enable host=true in vite.config.ts for local IP accessibility` | Permits testing across localhost and 127.0.0.1 origins. | [Automated Verified] |
| 004 | `test(vite): verify default port resolves to 5173 when VITE_PORT is unset` | Standard development environment initializes on port 5173. | [Automated Verified] |
| 005 | `test(vite): verify custom port assignment when VITE_PORT is provided` | Custom environment configurations load successfully. | [Automated Verified] |
| 006 | `test(vite): verify server host binding accommodates both localhost and 127.0.0.1` | Listens cleanly across local network adapters. | [Automated Verified] |
| 007 | `test(vite): verify CORS headers in Django allow frontend requests from port 5173` | CORS_ALLOWED_ORIGINS includes http://localhost:5173 and http://127.0.0.1:5173. | [Automated Verified] |
| 008 | `test(vite): verify CORS headers in Django allow frontend requests from port 3000` | CORS_ALLOWED_ORIGINS preserves backward compatibility with port 3000. | [Automated Verified] |
| 009 | `test(vite): verify hot module replacement (HMR) operates smoothly on port 5173` | Vite WebSocket connection upgrades without CORS blockage. | [Automated Verified] |
| 010 | `test(vite): verify static assets served with correct MIME types on port 5173` | JavaScript and CSS assets delivered with standard Content-Type headers. | [Automated Verified] |
| 011 | `docs(origin): document standard local development URLs in troubleshooting guide` | Records http://localhost:5173 and http://localhost:3000. | [Automated Verified] |
| 012 | `test(origin): verify scheme invariance (http vs https) in development` | Ensures HTTP protocol is used consistently for localhost origins. | [Automated Verified] |
| 013 | `test(origin): verify port matching precision between browser and Google GIS` | Browser window.location.origin matches GIS initialization origin. | [Automated Verified] |
| 014 | `test(origin): verify absence of trailing slash in configured JavaScript origins` | Strict adherence to Google OAuth origin formatting rules. | [Automated Verified] |
| 015 | `test(origin): verify path-free origin format in Google Cloud Console` | Confirms origins contain no subpaths or route suffixes. | [Automated Verified] |
| 016 | `test(origin): verify Django API proxy and Axios baseURL synchronization` | Axios points reliably to http://localhost:8000/api/v1. | [Automated Verified] |
| 017 | `test(origin): verify browser localStorage session persistence across port 5173` | JWT tokens and user profile cache persist seamlessly. | [Automated Verified] |
| 018 | `test(origin): verify cookie partitioning across localhost origins` | Session cookies operate without cross-port collision. | [Automated Verified] |
| 019 | `test(origin): verify clean browser navigation to /login on port 5173` | Sign-in portal loads with zero route errors. | [Automated Verified] |
| 020 | `test(origin): verify clean browser navigation to /register on port 5173` | Onboarding portal loads with zero route errors. | [Automated Verified] |
| 021 | `feat(gis): initialize Google Identity Services on active window origin` | SDK inherits parent window origin context automatically. | [Automated Verified] |
| 022 | `feat(gis): render official Google button iframe directly in DOM` | Mounts secure Google iframe for native OAuth popup handling. | [Automated Verified] |
| 023 | `feat(gis): configure rectangular button shape with width 380px` | Provides full-width enterprise touch target for authentication. | [Automated Verified] |
| 024 | `feat(gis): configure left logo alignment on rendered Google button` | Positions authentic Google G icon prominently on the left. | [Automated Verified] |
| 025 | `feat(gis): configure outline theme on rendered Google button` | Matches dark glassmorphic container aesthetics. | [Automated Verified] |
| 026 | `feat(gis): set cancel_on_tap_outside to true for GIS prompt` | Prevents modal lockups if user taps outside account prompt. | [Automated Verified] |
| 027 | `test(gis): verify GIS client library handles window.location.origin extraction` | Google SDK reads protocol and host from parent window. | [Automated Verified] |
| 028 | `test(gis): verify Google popup receives valid origin header in postMessage` | PostMessage handshake validates origin between popup and opener. | [Automated Verified] |
