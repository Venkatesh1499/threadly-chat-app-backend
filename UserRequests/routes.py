from flask import Flask, request, jsonify, Blueprint, abort
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
import psycopg2
from DATABASE import get_db_connection

# Adding blueprint
user_requests_db = Blueprint("user_requests", __name__)

# MARK: - Search users

@user_requests_db.route('/search', methods=['POST'])
def search_users():
    input = request.get_json()

    if not input:
        abort(400)
    
    search_text = input.get("search_text")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
            'SELECT id, username FROM users WHERE username ILIKE %s', (f"{search_text}%",)
        )
    users = cursor.fetchall()

    cursor.close()
    conn.close()
    
    #if you are using the RealDictCursor then , it will automatically covert the result into list of dicts
    # users = []
    # for row in rows:
    #     users.append({
    #         "id": row[0],
    #         "username": row[1]
    #     })

    if not users:
        return jsonify({"message": "No users found with searched name"}), 200
    return jsonify(users), 200


# MARK: - Error handling

@user_requests_db.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Resource not found"}), 404

@user_requests_db.errorhandler(400)
def handle_400(e):
    return jsonify({"error": str(e)}), 400

@user_requests_db.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"error": "Internal server error"}), 500