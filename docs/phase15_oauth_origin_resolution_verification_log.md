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
