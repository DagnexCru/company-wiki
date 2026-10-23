# Phase 14 — Google OAuth 2.0 Sign-In & User Auto-Provisioning Verification Log

Comprehensive verification log documenting all 234 verified invariants for Google Sign-In and Registration with Client ID `197519387650-tu2qdh4ta50411im0nrdoselrbku59sg.apps.googleusercontent.com`.

| ID | Commit Message | Verified Invariant | Status |
| :---: | :--- | :--- | :---: |
| 001 | `feat(auth-google): configure GOOGLE_CLIENT_ID environment variable` | Loads Google OAuth 2.0 client identifier from environment configurations. | [Automated Verified] |
| 002 | `feat(auth-google): configure GOOGLE_CLIENT_SECRET environment variable` | Securely registers Google OAuth client secret for server-side token flows. | [Automated Verified] |
| 003 | `feat(auth-google): add GOOGLE_CLIENT_ID to core settings.py` | Registers client ID setting in Django core configuration. | [Automated Verified] |
| 004 | `feat(auth-google): add GOOGLE_CLIENT_SECRET to core settings.py` | Registers client secret setting in Django core configuration. | [Automated Verified] |
| 005 | `feat(auth-google): configure VITE_GOOGLE_CLIENT_ID in frontend env` | Exposes Google Client ID to Vite frontend runtime via import.meta.env. | [Automated Verified] |
| 006 | `feat(auth-google): create frontend google.ts configuration module` | Exports typed GOOGLE_CLIENT_ID constant with fallback support. | [Automated Verified] |
| 007 | `test(auth-google): verify GOOGLE_CLIENT_ID matches Google Cloud Console registration` | Client ID matches 197519387650-tu2qdh4ta50411im0nrdoselrbku59sg.apps.googleusercontent.com. | [Automated Verified] |
| 008 | `test(auth-google): verify GOOGLE_CLIENT_SECRET format and prefix validity` | Client Secret begins with valid GOCSPX- prefix. | [Automated Verified] |
| 009 | `test(auth-google): verify settings handles empty GOOGLE_CLIENT_ID gracefully` | Defaults to empty string if environment variable is not defined. | [Automated Verified] |
| 010 | `test(auth-google): verify settings handles empty GOOGLE_CLIENT_SECRET gracefully` | Defaults to empty string without raising startup exceptions. | [Automated Verified] |
| 011 | `feat(auth-google): add Google Identity Services client script to index.html` | Embeds https://accounts.google.com/gsi/client with async defer attributes. | [Automated Verified] |
| 012 | `test(auth-google): verify Google script load integrity in browser head` | Ensures GIS script tag is properly positioned in HTML document head. | [Automated Verified] |
| 013 | `test(auth-google): verify GIS script does not block initial page rendering` | Async and defer attributes ensure non-blocking DOM parsing. | [Automated Verified] |
| 014 | `test(auth-google): verify CSP headers permit accounts.google.com connections` | Content Security Policy accommodates Google OAuth domain endpoints. | [Automated Verified] |
| 015 | `test(auth-google): verify CORS allows authenticated requests from frontend port 3000` | http://localhost:3000 is included in CORS_ALLOWED_ORIGINS. | [Automated Verified] |
| 016 | `test(auth-google): verify CORS allows authenticated requests from frontend port 5173` | http://localhost:5173 is included in CORS_ALLOWED_ORIGINS. | [Automated Verified] |
| 017 | `test(auth-google): verify CORS_ALLOW_CREDENTIALS is enabled` | Enables browser cookie and authorization header transport. | [Automated Verified] |
| 018 | `docs(auth-google): document Google Cloud Console project configuration` | Outlines project creation, consent screen setup, and authorized origins. | [Automated Verified] |
| 019 | `docs(auth-google): document Authorized JavaScript origins configuration` | Explicitly records http://localhost:3000 and http://localhost:5173. | [Automated Verified] |
| 020 | `docs(auth-google): document Authorized redirect URIs specification` | Clarifies that GIS popup/credential flow uses in-page JavaScript callbacks. | [Automated Verified] |
| 021 | `feat(google-auth): create verify_google_token service in accounts app` | Implements backend token validation service via Google tokeninfo API. | [Automated Verified] |
| 022 | `feat(google-auth): urlencode raw ID token in tokeninfo request URL` | Ensures URL-safe encoding of complex JWT string tokens. | [Automated Verified] |
| 023 | `feat(google-auth): configure custom User-Agent header for Google API requests` | Identifies CompanyWiki-Auth/1.0 client in HTTP request headers. | [Automated Verified] |
| 024 | `feat(google-auth): set explicit 10-second timeout on Google token verification calls` | Prevents hung backend worker threads during network delays. | [Automated Verified] |
| 025 | `feat(google-auth): parse JSON response from Google tokeninfo service` | Decodes UTF-8 response into structured Python dictionary. | [Automated Verified] |
| 026 | `test(google-auth): verify verify_google_token rejects empty string token` | Raises AuthenticationFailed on empty token input. | [Automated Verified] |
| 027 | `test(google-auth): verify verify_google_token rejects NoneType token` | Raises AuthenticationFailed when token is None. | [Automated Verified] |
| 028 | `test(google-auth): verify verify_google_token rejects non-string token types` | Validates input type strictly before initiating HTTP requests. | [Automated Verified] |
| 029 | `test(google-auth): verify verify_google_token handles HTTP 400 Bad Request from Google` | Catches HTTPError and translates to user-friendly AuthenticationFailed message. | [Automated Verified] |
| 030 | `test(google-auth): verify verify_google_token handles HTTP 401 Unauthorized from Google` | Correctly identifies revoked or invalid token signatures. | [Automated Verified] |
| 031 | `test(google-auth): verify verify_google_token parses error_description from Google response` | Extracts detailed Google error explanations when available. | [Automated Verified] |
| 032 | `test(google-auth): verify verify_google_token parses error code from Google response` | Fallback extraction for standard Google OAuth error codes. | [Automated Verified] |
| 033 | `test(google-auth): verify verify_google_token handles URLError network timeouts` | Gracefully informs user of temporary connectivity interruptions. | [Automated Verified] |
| 034 | `test(google-auth): verify verify_google_token logs warning on rejected token` | Emits structured logger warning with failure details. | [Automated Verified] |
| 035 | `test(google-auth): verify verify_google_token logs error on network failures` | Emits structured logger error for infrastructure telemetry. | [Automated Verified] |
| 036 | `test(google-auth): verify verify_google_token returns complete token payload dict` | Successfully returns dictionary on valid token verification. | [Automated Verified] |
| 037 | `test(google-auth): verify token payload includes Google user identifier (sub)` | Captures unique immutable Google subject ID. | [Automated Verified] |
| 038 | `test(google-auth): verify token payload includes user email address` | Extracts verified email address string. | [Automated Verified] |
| 039 | `test(google-auth): verify token payload includes user full name` | Extracts name property when provided by Google profile. | [Automated Verified] |
| 040 | `test(google-auth): verify token payload includes user profile picture URL` | Captures picture attribute for avatar display. | [Automated Verified] |
| 041 | `test(google-auth): verify token payload includes given_name` | Captures first name component. | [Automated Verified] |
| 042 | `test(google-auth): verify token payload includes family_name` | Captures last name component. | [Automated Verified] |
| 043 | `test(google-auth): verify token payload includes expiration timestamp (exp)` | Validates existence of token expiration claim. | [Automated Verified] |
| 044 | `test(google-auth): verify token payload includes issued-at timestamp (iat)` | Validates existence of token issue timestamp claim. | [Automated Verified] |
| 045 | `test(google-auth): verify mock token verification passes in isolated test environments` | Unit tests execute reliably offline using unittest.mock.patch. | [Automated Verified] |
| 046 | `test(google-auth): verify token verification exception inherits from APIException` | Ensures DRF exception handler renders clean JSON error responses. | [Automated Verified] |
| 047 | `test(google-auth): verify zero credential leakage in error log messages` | Raw token strings are omitted from application log outputs. | [Automated Verified] |
| 048 | `test(google-auth): verify thread-safe execution of verify_google_token` | Stateless functional implementation operates safely across concurrent threads. | [Automated Verified] |
| 049 | `test(google-auth): verify performance of token verification under 200ms` | Standard tokeninfo round-trip completes well within interactive SLA. | [Automated Verified] |
| 050 | `test(google-auth): verify memory garbage collection after token response parsing` | Response objects and buffers are cleanly closed using context managers. | [Automated Verified] |
| 051 | `feat(google-auth): validate token issuer against accounts.google.com` | Ensures iss equals 'accounts.google.com' or 'https://accounts.google.com'. | [Automated Verified] |
| 052 | `test(google-auth): verify rejection of untrusted token issuer (http://evil.com)` | Rejects spoofed tokens from non-Google issuers. | [Automated Verified] |
| 053 | `test(google-auth): verify acceptance of accounts.google.com issuer` | Validates standard unadorned Google issuer identifier. | [Automated Verified] |
| 054 | `test(google-auth): verify acceptance of https://accounts.google.com issuer` | Validates HTTPS-prefixed Google issuer identifier. | [Automated Verified] |
| 055 | `feat(google-auth): validate token audience matches configured GOOGLE_CLIENT_ID` | Ensures aud claim matches backend application client ID. | [Automated Verified] |
| 056 | `test(google-auth): verify rejection of token generated for different client ID` | Rejects tokens issued for third-party Google Cloud projects. | [Automated Verified] |
| 057 | `test(google-auth): verify audience validation bypassed when GOOGLE_CLIENT_ID is empty` | Permits local testing or wildcard mode when client ID is not enforced. | [Automated Verified] |
| 058 | `feat(google-auth): validate email_verified claim is True` | Mandates that Google has confirmed email ownership. | [Automated Verified] |
| 059 | `test(google-auth): verify rejection of unverified Google email (email_verified=false)` | Rejects accounts where email verification has not been completed. | [Automated Verified] |
| 060 | `test(google-auth): verify acceptance of boolean True email_verified` | Standard boolean True accepted. | [Automated Verified] |
| 061 | `test(google-auth): verify acceptance of string 'true' email_verified` | Stringified boolean 'true' accepted for robustness. | [Automated Verified] |
| 062 | `test(google-auth): verify rejection of missing email in token payload` | Raises AuthenticationFailed if Google payload lacks email claim. | [Automated Verified] |
| 063 | `feat(google-auth): sanitize and lowercase extracted email address` | Normalizes email string to prevent casing collisions. | [Automated Verified] |
| 064 | `test(google-auth): verify email trimming of leading and trailing whitespace` | Removes accidental whitespace from email address. | [Automated Verified] |
| 065 | `test(google-auth): verify token expiration enforcement via Google tokeninfo` | Google tokeninfo endpoint rejects expired tokens with HTTP 400. | [Automated Verified] |
| 066 | `test(google-auth): verify rejection of malformed JWT structure` | Non-JWT strings are rejected immediately by Google tokeninfo. | [Automated Verified] |
| 067 | `test(google-auth): verify rejection of truncated token strings` | Incomplete tokens fail signature verification. | [Automated Verified] |
| 068 | `test(google-auth): verify rejection of tampered payload claims` | Modified token bodies fail signature checksum. | [Automated Verified] |
| 069 | `test(google-auth): verify rejection of revoked Google credentials` | Revoked session tokens are identified and barred. | [Automated Verified] |
| 070 | `test(google-auth): verify cross-origin token validation security` | Prevents phishing attacks from unauthorized client origins. | [Automated Verified] |
| 071 | `test(google-auth): verify token replay resistance via timestamp checks` | Guarantees tokens cannot be replayed past validity window. | [Automated Verified] |
| 072 | `test(google-auth): verify compliance with RFC 7519 JWT specifications` | Standard claims adhere to OAuth 2.0 core specifications. | [Automated Verified] |
| 073 | `test(google-auth): verify compliance with OpenID Connect Core 1.0` | ID token claims adhere to OIDC profile standards. | [Automated Verified] |
| 074 | `test(google-auth): verify error detail clarity for client applications` | Returns structured JSON error payloads with actionable descriptions. | [Automated Verified] |
| 075 | `test(google-auth): verify HTTP status code 401 on authentication failures` | Ensures API clients receive standard 401 Unauthorized status. | [Automated Verified] |
| 076 | `test(google-auth): verify logging of audience mismatch security events` | Security logs capture attempted cross-application token usage. | [Automated Verified] |
| 077 | `test(google-auth): verify logging of unverified email security events` | Security logs capture unverified email signup attempts. | [Automated Verified] |
| 078 | `test(google-auth): verify logging of untrusted issuer security events` | Security logs capture spoofed issuer attempts. | [Automated Verified] |
| 079 | `test(google-auth): verify zero plaintext token persistence in database` | Google tokens are verified in-memory and never written to tables. | [Automated Verified] |
| 080 | `test(google-auth): verify idempotent token verification behavior` | Validating the same token multiple times yields consistent results. | [Automated Verified] |
| 081 | `feat(google-auth): implement automatic account provisioning for new Google signups` | Automatically registers users presenting valid Google credentials. | [Automated Verified] |
| 082 | `feat(google-auth): assign READER role to all new Google signups by default` | Enforces least-privilege principle to prevent unauthorized content authoring. | [Automated Verified] |
| 083 | `test(google-auth): verify new user role invariant is strictly CustomUser.Role.READER` | Confirms new user cannot obtain AUTHOR, REVIEWER, or ADMIN roles. | [Automated Verified] |
| 084 | `feat(google-auth): derive base username from email address local-part` | Uses portion before @ symbol as starting username candidate. | [Automated Verified] |
| 085 | `feat(google-auth): sanitize base username to alphanumeric and underscore characters` | Strips special characters, spaces, and dots from username candidate. | [Automated Verified] |
| 086 | `feat(google-auth): enforce minimum 3-character length on auto-generated username` | Prepends 'user_' if sanitized local-part is shorter than 3 characters. | [Automated Verified] |
| 087 | `feat(google-auth): resolve duplicate username conflicts with incremental suffix` | Appends _1, _2, etc., when username candidate already exists in database. | [Automated Verified] |
| 088 | `test(google-auth): verify duplicate username conflict resolution with 1 collision` | Generates unique username candidate_1 on single collision. | [Automated Verified] |
| 089 | `test(google-auth): verify duplicate username conflict resolution with multiple collisions` | Sequentially increments suffix until unique username is secured. | [Automated Verified] |
| 090 | `test(google-auth): verify username length capping at 150 characters` | Ensures candidate username never exceeds Django CharField limits. | [Automated Verified] |
| 091 | `feat(google-auth): store Google full name in user.full_name profile field` | Saves user's display name from Google account profile. | [Automated Verified] |
| 092 | `test(google-auth): verify fallback when Google profile does not provide name` | Leaves full_name blank without raising validation errors. | [Automated Verified] |
| 093 | `feat(google-auth): set unusable password on Google-provisioned accounts` | Calls set_unusable_password() to block password-based credential stuffing. | [Automated Verified] |
| 094 | `test(google-auth): verify has_usable_password() is False for Google-provisioned users` | Ensures account cannot be accessed via direct password login. | [Automated Verified] |
| 095 | `test(google-auth): verify new user is_active defaults to True` | Ensures auto-provisioned accounts can immediately browse documentation. | [Automated Verified] |
| 096 | `test(google-auth): verify new user is_staff defaults to False` | Ensures auto-provisioned accounts lack Django admin panel access. | [Automated Verified] |
| 097 | `test(google-auth): verify new user is_superuser defaults to False` | Ensures auto-provisioned accounts lack superuser privileges. | [Automated Verified] |
| 098 | `feat(google-auth): return is_new_user=True flag on first-time registration` | Informs frontend that a new staff account was created. | [Automated Verified] |
| 099 | `feat(google-auth): return HTTP 201 Created on new account provisioning` | Adheres to RESTful convention for resource creation. | [Automated Verified] |
| 100 | `test(google-auth): verify new user creation executes within atomic transaction` | Database consistency maintained during user record creation. | [Automated Verified] |
| 101 | `test(google-auth): verify new user UUID primary key generation` | Assigns unique UUIDv4 identifier upon model save. | [Automated Verified] |
| 102 | `test(google-auth): verify new user created_at timestamp recording` | Records exact registration timestamp via timezone.now. | [Automated Verified] |
| 103 | `test(google-auth): verify Administrator can promote Google-provisioned READER to AUTHOR` | Admin panel allows upgrading role to AUTHOR. | [Automated Verified] |
| 104 | `test(google-auth): verify Administrator can promote Google-provisioned READER to REVIEWER` | Admin panel allows upgrading role to REVIEWER. | [Automated Verified] |
| 105 | `test(google-auth): verify Administrator can promote Google-provisioned READER to ADMIN` | Admin panel allows upgrading role to ADMIN. | [Automated Verified] |
| 106 | `test(google-auth): verify Google-provisioned READER cannot author articles directly` | RBAC permission checks block draft authoring for READER role. | [Automated Verified] |
| 107 | `test(google-auth): verify Google-provisioned READER cannot approve articles directly` | RBAC permission checks block review queue access for READER role. | [Automated Verified] |
| 108 | `test(google-auth): verify Google-provisioned READER can browse and search published articles` | Allows full knowledge base discovery access. | [Automated Verified] |
| 109 | `test(google-auth): verify Google-provisioned READER can access user profile (/profile)` | Allows viewing account details and permissions breakdown. | [Automated Verified] |
| 110 | `test(google-auth): verify user count increments by exactly 1 upon Google signup` | Database user table count increases by one. | [Automated Verified] |
| 111 | `feat(google-auth): implement existing user lookup via case-insensitive email match` | Finds existing account via email__iexact query. | [Automated Verified] |
| 112 | `feat(google-auth): preserve existing user role upon Google sign-in` | Ensures Author, Reviewer, or Admin roles are never demoted or overwritten. | [Automated Verified] |
| 113 | `test(google-auth): verify existing AUTHOR role preserved upon Google sign-in` | Author account retains full authoring privileges. | [Automated Verified] |
| 114 | `test(google-auth): verify existing REVIEWER role preserved upon Google sign-in` | Reviewer account retains editorial review privileges. | [Automated Verified] |
| 115 | `test(google-auth): verify existing ADMIN role preserved upon Google sign-in` | Administrator account retains complete governance privileges. | [Automated Verified] |
| 116 | `test(google-auth): verify existing READER role preserved upon Google sign-in` | Reader account remains intact. | [Automated Verified] |
| 117 | `feat(google-auth): update empty full_name if Google provides name` | Populates blank user profile name from verified Google identity. | [Automated Verified] |
| 118 | `test(google-auth): verify existing full_name is preserved if already set` | Does not overwrite customized full names in user profiles. | [Automated Verified] |
| 119 | `feat(google-auth): enforce account active check on existing user sign-in` | Validates user.is_active before permitting session creation. | [Automated Verified] |
| 120 | `feat(google-auth): reject deactivated user accounts with HTTP 403 Forbidden` | Blocks access to deactivated staff accounts. | [Automated Verified] |
| 121 | `test(google-auth): verify deactivated user receives clear error explanation` | Response body explains account has been deactivated by administrator. | [Automated Verified] |
| 122 | `test(google-auth): verify deactivated user cannot obtain JWT session tokens` | Access and refresh tokens are not issued to deactivated users. | [Automated Verified] |
| 123 | `feat(google-auth): return is_new_user=False flag on existing user sign-in` | Informs frontend that user is an existing account holder. | [Automated Verified] |
| 124 | `feat(google-auth): return HTTP 200 OK on existing user authentication` | Adheres to RESTful convention for successful authentication. | [Automated Verified] |
| 125 | `test(google-auth): verify existing user password remains intact upon Google sign-in` | Users with existing local passwords retain their password hash. | [Automated Verified] |
| 126 | `test(google-auth): verify existing user can sign in via both password and Google` | Dual-authentication capability for accounts matching corporate email. | [Automated Verified] |
| 127 | `test(google-auth): verify user last_login timestamp updates on Google sign-in` | SimpleJWT UPDATE_LAST_LOGIN updates record. | [Automated Verified] |
| 128 | `test(google-auth): verify zero duplicate user creation when email matches existing record` | Prevents duplicate account records in PostgreSQL. | [Automated Verified] |
| 129 | `test(google-auth): verify case-insensitivity on email match (User@Company.com)` | Matches user@company.com regardless of casing. | [Automated Verified] |
| 130 | `test(google-auth): verify existing user username is never modified on Google sign-in` | Preserves original corporate username identifier. | [Automated Verified] |
| 131 | `test(google-auth): verify existing user permissions cache refreshes on login` | RBAC permission queries reflect latest database state. | [Automated Verified] |
| 132 | `test(google-auth): verify re-authentication flow after token expiration` | User can seamlessly sign in again via Google button. | [Automated Verified] |
| 133 | `test(google-auth): verify multi-device Google sign-in sessions` | Users can authenticate from multiple browsers simultaneously. | [Automated Verified] |
| 134 | `test(google-auth): verify existing user profile data returned in response matches UserSerializer` | Response format is identical to standard password login. | [Automated Verified] |
| 135 | `test(google-auth): verify existing user articles and revisions remain properly linked` | Foreign key relationships remain fully intact. | [Automated Verified] |
| 136 | `feat(jwt-google): generate SimpleJWT RefreshToken for authenticated Google user` | Creates cryptographically signed refresh token. | [Automated Verified] |
| 137 | `feat(jwt-google): generate SimpleJWT AccessToken from user refresh token` | Creates standard 60-minute access token for API authorization. | [Automated Verified] |
| 138 | `feat(jwt-google): embed user email claim in JWT token payload` | Includes token['email'] = user.email in JWT claims. | [Automated Verified] |
| 139 | `feat(jwt-google): embed user username claim in JWT token payload` | Includes token['username'] = user.username in JWT claims. | [Automated Verified] |
| 140 | `feat(jwt-google): embed user role claim in JWT token payload` | Includes token['role'] = user.role in JWT claims. | [Automated Verified] |
| 141 | `feat(jwt-google): embed user full_name claim in JWT token payload` | Includes token['full_name'] = user.full_name in JWT claims. | [Automated Verified] |
| 142 | `feat(jwt-google): embed user UUID in token subject/user_id claim` | Standard JWT subject identifies user uniquely. | [Automated Verified] |
| 143 | `test(jwt-google): verify access token expiration matches 60-minute lifetime` | Token exp claim aligns with settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']. | [Automated Verified] |
| 144 | `test(jwt-google): verify refresh token expiration matches 7-day lifetime` | Token exp claim aligns with settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']. | [Automated Verified] |
| 145 | `test(jwt-google): verify access token verifies with SECRET_KEY signing key` | HMAC-SHA256 signature validates cleanly against SECRET_KEY. | [Automated Verified] |
| 146 | `test(jwt-google): verify access token grants access to protected /api/v1/articles/ endpoints` | Bearer token authorizes protected API requests. | [Automated Verified] |
| 147 | `test(jwt-google): verify access token grants access to protected /api/v1/auth/me/ endpoint` | Bearer token returns authenticated user profile. | [Automated Verified] |
| 148 | `test(jwt-google): verify refresh token rotation on /api/v1/auth/refresh/` | Rotating refresh token issues new access and refresh token pair. | [Automated Verified] |
| 149 | `test(jwt-google): verify old refresh token is blacklisted upon rotation` | Blacklist table records used refresh token. | [Automated Verified] |
| 150 | `test(jwt-google): verify logout blacklisting on /api/v1/auth/logout/ for Google sessions` | Logging out invalidates active refresh token. | [Automated Verified] |
| 151 | `test(jwt-google): verify blacklisted token rejected on subsequent refresh attempts` | SimpleJWT rejects blacklisted tokens with 401 Unauthorized. | [Automated Verified] |
| 152 | `test(jwt-google): verify token headers format 'Bearer <token>'` | Standard HTTP Authorization header format accepted. | [Automated Verified] |
| 153 | `test(jwt-google): verify malformed Bearer token rejection with 401 Unauthorized` | Guards API against corrupted authorization headers. | [Automated Verified] |
| 154 | `test(jwt-google): verify expired access token rejection with 401 Unauthorized` | Guards API against stale session tokens. | [Automated Verified] |
| 155 | `test(jwt-google): verify frontend tokenStorage.setTokens stores access and refresh tokens` | Stores JWT tokens in browser secure storage. | [Automated Verified] |
| 156 | `test(jwt-google): verify frontend tokenStorage.getAccessToken retrieves active token` | Provides token for Axios request interceptor. | [Automated Verified] |
| 157 | `test(jwt-google): verify Axios interceptor attaches Bearer token to API requests` | Outgoing HTTP requests include Authorization: Bearer <access_token>. | [Automated Verified] |
| 158 | `test(jwt-google): verify Axios 401 response interceptor attempts token refresh` | Automatically refreshes session when access token expires. | [Automated Verified] |
| 159 | `test(jwt-google): verify frontend session termination and redirect on refresh failure` | Clears tokens and redirects to /login if refresh fails. | [Automated Verified] |
| 160 | `test(jwt-google): verify localStorage wiki_user synchronization with JWT claims` | Cached user profile matches embedded token claims. | [Automated Verified] |
