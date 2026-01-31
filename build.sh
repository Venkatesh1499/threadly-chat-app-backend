#!/usr/bin/env bash
# Build backend deps + frontend and copy React build into static/app for Flask to serve.
# Use this as the Render "Build Command" (or run locally before starting the server).
set -e
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
mkdir -p static/app
cp -r frontend/dist/* static/app/
