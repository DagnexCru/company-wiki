# Google OAuth 2.0 Origin Mismatch (`Error 400: origin_mismatch`) Troubleshooting Guide

## Problem Summary
When attempting to sign in with Google, Google's OAuth 2.0 authorization server rejects the request with:
```
Access blocked: Authorization Error
Error 400: origin_mismatch
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy.
If you're the app developer, register the JavaScript origin in the Google Cloud Console.
```

---

## Root Cause
Google OAuth 2.0 enforces a strict origin security policy for web clients. The client application's scheme, hostname, and port must **exactly match** an entry in the **Authorized JavaScript origins** table in your Google Cloud Console.

For local development, Vite typically runs on:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

If you are accessing the app from a port that is not explicitly registered in Google Cloud Console, Google immediately halts the OAuth flow with `Error 400: origin_mismatch`.

---

## Step-by-Step Resolution

### Step 1: Open Google Cloud Console Credentials
1. Go directly to: **[https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**
2. Make sure your Company Wiki project is selected in the top project dropdown.

### Step 2: Edit your OAuth 2.0 Client ID
1. Under **OAuth 2.0 Client IDs**, click on your Web client name or click the edit icon (✏️).
2. Locate the **Authorized JavaScript origins** section.

### Step 3: Add Authorized URIs
Click **+ ADD URI** and add **both** local development URIs:

```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:3000
```

> [!IMPORTANT]
> - Do **NOT** include a trailing slash (e.g. use `http://localhost:5173`, NOT `http://localhost:5173/`).
> - Do **NOT** include path components (e.g. use `http://localhost:5173`, NOT `http://localhost:5173/login`).

### Step 4: Save Changes
1. Scroll to the bottom and click **SAVE**.
2. **Note on Google Caching:** Google Cloud Console changes typically take between **30 seconds and 5 minutes** to propagate to Google's edge authentication servers.

---

## Verifying in Company Wiki
1. Refresh your browser at:
   - **`http://localhost:5173/login`** or **`http://localhost:3000/login`**
2. Click **"Sign in with Google"** / **"Sign up with Google"**.
3. The Google account chooser prompt will open cleanly without the `origin_mismatch` error!
