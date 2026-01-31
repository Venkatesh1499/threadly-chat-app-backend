from flask import Flask, request, jsonify, Blueprint, render_template, send_from_directory
import os
import psycopg2
from Auth.routes import auth_bp
from UserRequests.routes import user_requests_db
from ConnectionManagement.routes import connections_management_db
from Chat.routes import chat_bp, socketio
from flask_socketio import SocketIO, emit, join_room
import eventlet

eventlet.monkey_patch()

app = Flask(__name__)

# API under /api so the React app (same origin) can call /api/register, etc.
app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(user_requests_db, url_prefix="/api")
app.register_blueprint(connections_management_db, url_prefix="/api")
app.register_blueprint(chat_bp, url_prefix="/api")

app.config['SECERT_KEY'] = "secret123"

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    ping_interval=25,   # seconds
    ping_timeout=60     # seconds
      )


# React app build output (created by: cd frontend && npm run build && cp -r dist ../static/app)
REACT_APP_DIR = os.path.join(os.path.dirname(__file__), "static", "app")


def _serve_react_app(path=""):
    """Serve React SPA: static file if present, else index.html for client-side routing."""
    if path and path != "index.html":
        file_path = os.path.join(REACT_APP_DIR, path)
        if os.path.isfile(file_path):
            return send_from_directory(REACT_APP_DIR, path)
    # SPA fallback: any other path (e.g. /login, /chats) -> index.html
    return send_from_directory(REACT_APP_DIR, "index.html")


@app.route("/")
def index():
    if os.path.isdir(REACT_APP_DIR) and os.path.isfile(os.path.join(REACT_APP_DIR, "index.html")):
        return _serve_react_app("index.html")
    return render_template("index.html")


@app.route("/chatroom")
def chatroom_legacy():
    return render_template("index.html")


@app.route("/<path:path>")
def serve_spa(path):
    # Don't serve SPA for API or socket.io (handled by Flask / SocketIO)
    if path.startswith("api/") or path.startswith("api") or path.startswith("socket.io"):
        return {"error": "Not found"}, 404
    if os.path.isdir(REACT_APP_DIR) and os.path.isfile(os.path.join(REACT_APP_DIR, "index.html")):
        return _serve_react_app(path)
    return {"error": "Not found"}, 404


@socketio.on("join_room")
def handle_join(data):
    room = data["room"]
    join_room(room)
    emit("room_message", {"message": f"Joined room {room}"}, room = room)


@socketio.on("room_message")
def handle_message(data):
    print("message received", data["message"], data["room"])
    room = data["room"]
    message = data["message"]
    emit("room_message", {"message":message}, room=room)


if __name__ == "__main__":
    socketio.run(app, debug=True)
