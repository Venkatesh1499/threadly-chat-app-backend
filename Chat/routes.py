from flask import jsonify, request, Blueprint
from flask_socketio import emit, join_room, leave_room
from extensions import socketio

chat_bp = Blueprint("Chat", __name__)

# # ---------- REST API ----------
# @chat_bp.route("/join", methods=["POST"])
# def join_room_api():
#     data = request.json
#     room_id = data.get("room_id")
#     user_id = data.get("user_id")

#     if not room_id or not user_id:
#         return jsonify({"error": "room_id and user_id required"}), 400

#     return jsonify({
#         "message": "Room validated",
#         "room_id": room_id
#     }), 200


# # ---------- SOCKET EVENTS ----------
# @socketio.on("join_room")
# def handle_join(data):
#     room_id = data.get("room_id")
#     user_id = data.get("user_id")

#     if not room_id:
#         return

#     join_room(room_id)

#     emit(
#         "room_message",
#         {"user_id": user_id, "message": "joined the room"},
#         room=room_id
#     )


# @socketio.on("send_message")
# def handle_send_message(data):
#     emit("receive_message", data, room=data["room_id"])


# @socketio.on("leave_room")
# def handle_leave_room(data):
#     leave_room(data["room_id"])

#     emit(
#         "user_left",
#         {"user_id": data.get("user_id")},
#         room=data["room_id"]
#     )
