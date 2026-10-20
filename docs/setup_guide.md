# Complete Setup & Reproducibility Guide

This guide provides end-to-step instructions for running the Internal Knowledge Base & Company Wiki locally on another development machine.

---

## 1. System Requirements

Ensure the host development machine meets the following prerequisites:
- **Operating System**: Windows 10/11, macOS (Sonoma/Ventura), or Linux (Ubuntu 22.04+).
- **Python**: Version 3.12 or 3.14+ (confirm via `python --version`).
- **Node.js**: Version 18.0+ or 20.0+ LTS (confirm via `node --version`).
- **PostgreSQL**: Version 14, 15, or 16 (confirm via `psql --version`).
- **Pipenv**: Installed globally via `pip install pipenv` or `python -m pip install pipenv`.
- **Git**: Installed and accessible on system PATH.

---

## 2. PostgreSQL Configuration

1. Start your local PostgreSQL server service:
   - **Windows**: Start the `postgresql-x64-XX` service via `services.msc` or Services manager.
   - **macOS (Homebrew)**: `brew services start postgresql@15`
   - **Linux**: `sudo systemctl start postgresql`

2. Connect to PostgreSQL and create the target database:
   ```sql
   -- Connect via psql
   psql -U postgres

   -- Create database
   CREATE DATABASE company_wiki_db;

   -- Optional: grant privileges
   GRANT ALL PRIVILEGES ON DATABASE company_wiki_db TO postgres;
   ```

---

## 3. Backend Setup with Pipenv

1. Clone or open the repository workspace:
   ```bash
   cd company-wiki/backend
   ```

2. Initialize your local environment file:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

3. Review `.env` and verify database credentials:
   ```ini
   DEBUG=True
   SECRET_KEY=django-insecure-company-wiki-dev-key-change-in-production-2026
   ALLOWED_HOSTS=localhost,127.0.0.1
   DB_NAME=company_wiki_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

4. Install backend dependencies using Pipenv:
   ```bash
   pipenv install --dev
   ```

5. Execute database migrations:
   ```bash
   pipenv run python manage.py migrate
   ```

6. Seed initial taxonomy data (Categories & Tags):
   ```bash
   pipenv run python manage.py seed_taxonomy
   ```

7. (Optional) Create an administrative superuser account:
   ```bash
   pipenv run python manage.py createsuperuser
   ```

8. Launch the Django development server:
   ```bash
   pipenv run python manage.py runserver
   ```
   The backend API will run on `http://127.0.0.1:8000/`.  
   Health check endpoint: `http://127.0.0.1:8000/api/v1/health/`.

---

## 4. Frontend Setup with npm

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd company-wiki/frontend
   ```

2. Create the frontend environment configuration:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

3. Confirm `VITE_API_BASE_URL` in `.env`:
   ```ini
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. Install npm packages:
   ```bash
   npm install
   ```

5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## 5. Verification Commands

Run the automated backend test suite (117+ tests):
```bash
cd backend
pipenv run python manage.py test
```

Run frontend production build validation:
```bash
cd frontend
npm run build
```
