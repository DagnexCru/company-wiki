# Troubleshooting & Frequently Asked Questions (FAQ)

This guide documents common issues, debugging steps, and platform-specific workarounds.

---

## 1. Database Connection Issues

### Error: `FATAL: database "company_wiki_db" does not exist`
* **Cause**: PostgreSQL has started, but the initial database schema has not been initialized.
* **Resolution**:
  ```bash
  psql -U postgres -c "CREATE DATABASE company_wiki_db;"
  ```

### Error: `could not connect to server: Connection refused`
* **Cause**: The PostgreSQL service is stopped or listening on a different port.
* **Resolution**:
  - Verify PostgreSQL service is running (`sudo systemctl status postgresql` or Windows Services).
  - Verify `DB_PORT=5432` and `DB_HOST=localhost` in `backend/.env`.

---

## 2. Python & Pipenv Gotchas

### Issue: `pipenv : The term 'pipenv' is not recognized`
* **Cause**: Pipenv is not installed on system PATH.
* **Resolution**:
  ```bash
  python -m pip install --user pipenv
  ```

### Issue: `ModuleNotFoundError: No module named 'rest_framework'`
* **Cause**: Executing manage.py outside the Pipenv virtual environment.
* **Resolution**: Always prefix commands with `pipenv run` (e.g., `pipenv run python manage.py migrate`).

---

## 3. Frontend & Vite Development

### Issue: `CORS error in browser network tab`
* **Cause**: The backend `CORS_ALLOWED_ORIGINS` setting does not list the frontend dev server URL.
* **Resolution**: Update `backend/.env` with `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173` and restart Django.

### Issue: `Blank screen or chunk load error after rebuild`
* **Cause**: Stale Vite cache in browser or node_modules.
* **Resolution**: Clear browser cache and restart Vite with clean cache:
  ```bash
  npm run dev -- --force
  ```
