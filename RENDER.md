# Deploying on Render

This app runs as **one Web Service** on Render: Flask serves both the API and the React UI.

## 1. Create a Web Service

- **Repository**: Connect your repo.
- **Root Directory**: Leave blank (repo root).
- **Runtime**: Python 3.
- **Build Command** (required so the UI is built and served):

  ```bash
  pip install -r requirements.txt && cd frontend && npm install && npm run build && cd .. && mkdir -p static/app && cp -r frontend/dist/* static/app/
  ```

  Or use the script (make it executable first in repo):

  ```bash
  chmod +x build.sh && ./build.sh
  ```

- **Start Command**: Leave blank to use the **Procfile** (`gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:$PORT app:app`).

## 2. Environment Variables

Set in Render dashboard → Environment:

- **DATABASE_URL** – PostgreSQL connection string (e.g. from Render PostgreSQL add-on).
- **PORT** – Set by Render; no need to add it yourself.

Do **not** set `VITE_API_URL` or `VITE_SOCKET_URL`; the UI is served from the same origin and uses `/api` and the same host for Socket.IO.

## 3. After Deploy

- Open your Render URL (e.g. `https://your-service.onrender.com`).
- You should see the **React UI** (login/register, then search, requests, chats).
- If you see the old “Private Chat” page or a 404, the **Build Command** did not run or failed. Check the Render build logs and ensure `static/app/index.html` exists after the build.

## 4. Troubleshooting

- **Blank or old UI**: Build command must run and copy `frontend/dist/*` into `static/app/`. Check that the build step includes `npm run build` and the `cp` (or equivalent) into `static/app`.
- **API/Socket errors**: Backend and UI are same-origin; no CORS or extra env vars needed. If you split UI and API into two services later, set `VITE_API_URL` and `VITE_SOCKET_URL` to the API service URL when building the frontend.
- **Database**: Ensure `DATABASE_URL` is set and the database is reachable from Render.
