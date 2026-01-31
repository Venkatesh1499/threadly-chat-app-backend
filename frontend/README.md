# Threadly Chat — Frontend

Production-ready React UI for the Threadly real-time chat application. Connects to the Flask + Socket.IO backend.

## Tech stack

- **React 18** (functional components, hooks)
- **TypeScript**
- **Vite** (build and dev server)
- **React Router 6**
- **Socket.IO client** (real-time chat)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)
- **Context API** (auth, theme, toasts, offline)

## Folder structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/       # OfflineBanner, MainLayout, Sidebar, ThemeToggle
│   │   └── ui/           # Button, Input, Modal, Skeleton, Spinner
│   ├── contexts/         # AuthContext, ThemeContext, ToastContext, OfflineContext
│   ├── hooks/            # useRetryOnReconnect
│   ├── lib/              # api.ts (fetch wrapper)
│   ├── pages/            # Login, Register, Search, PendingRequests, ActiveChats, ChatRoom
│   ├── services/         # authService, userRequestService, connectionService, socketService
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Backend integration

- **API base**: Set `VITE_API_URL` in `.env` (e.g. `http://localhost:5000`). If unset, the dev server proxies `/api` to the backend (see `vite.config.ts`).
- **Socket.IO**: Set `VITE_SOCKET_URL` if the socket server is on a different origin. Otherwise the app uses the same origin (proxied in dev).

Backend endpoints used:

- `POST /register`, `POST /login`, `GET /users` (Auth)
- `POST /search`, `POST /connection-request`, `POST /pending-connection-requests` (User requests)
- `POST /action-request`, `POST /active-connections` (Connection management)
- Socket: `join_room` (room = connection_id), `room_message` (send/receive)

## Run locally

1. Install dependencies:
   ```bash
   cd frontend && npm install
   ```
2. Start the backend (Flask + Socket.IO) on port 5000.
3. Start the frontend:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`. API and Socket.IO are proxied to the backend when `VITE_API_URL` is not set.

## Build

```bash
npm run build
```

Output is in `dist/`. For production, set `VITE_API_URL` (and optionally `VITE_SOCKET_URL`) to your backend URL.

## Features

- **Auth**: Register, login, persisted user, logout
- **Theme**: Light / dark / system with manual toggle
- **Search**: Search users by username, send connection request
- **Pending requests**: List, accept, reject; on accept, navigate to chat with `connection_id`
- **Active chats**: List connections, open chat by `connection_id`
- **Chat**: Join Socket room by `connection_id`, send/receive messages, animations, loading and error states
- **Offline**: Banner when offline; lists refetch when back online
- **Toasts**: Success, warning, error, info
- **Loading**: Skeletons, spinners, non-blocking UI
