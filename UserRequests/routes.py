from flask import Flask, request, jsonify, Blueprint, abort
from psycopg2 import errors
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
    cursor = conn.cursor()

    try:
        cursor.execute(
            'SELECT * FROM users WHERE username LIKE a%'
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
    
    users = [dict(row) for row in rows]
    if not users:
        return jsonify({"message": "No users found with searched name"}), 200
    return jsonify(users), 200


# MARK: - Error handling

@auth_bp.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Resource not found"}), 404

@auth_bp.errorhandler(400)
def handle_400(e):
    return jsonify({"error": str(e)}), 400

@auth_bp.errorhandler(Exception)
def handle_exception(e):
    return jsonify({"error": "Internal server error"}), 500