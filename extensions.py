# extensions.py
import eventlet
eventlet.monkey_patch()

from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="eventlet",
    ping_interval=25,
    ping_timeout=60
)
