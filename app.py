from flask import Flask, request, jsonify, Blueprint, render_template
import psycopg2
from Auth.routes import auth_bp
from UserRequests.routes import user_requests_db
from ConnectionManagement.routes import connections_management_db
from Chat.routes import chat_bp, socketio
from flask_socketio import SocketIO, emit, join_room
import eventlet

eventlet.monkey_patch()

app = Flask(__name__)

# Registering blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_requests_db)
app.register_blueprint(connections_management_db)
app.register_blueprint(chat_bp)

app.config['SECERT_KEY'] = "secret123"

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
    ping_interval=25,   # seconds
    ping_timeout=60     # seconds
      )


@app.route('/chatroom')
def home():
    return render_template("index.html")


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
