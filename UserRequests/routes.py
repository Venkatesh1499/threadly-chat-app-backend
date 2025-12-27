from flask import Flask, request, jsonify, Blueprint, abort
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
import psycopg2
import uuid
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


# MARK: - create connection_requests table

def connection_requests_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        '''CREATE TABLE IF NOT EXISTS connection_requests (
        id VARCHAR(300) UNIQUE NOT NULL,
        primary_id UUID NOT NULL,
        secondary_id UUID NOT NULL,
        primary_name VARCHAR(100) NOT NULL,
        secondary_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
        )
        ''')
    
    conn.commit()
    cursor.close()
    conn.close()

def delete_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        'DROP TABLE connection_requests'
    )

    conn.commit()
    cursor.close()
    conn.close()

delete_table()

connection_requests_table()

# MARK: - Inititate connection request

@user_requests_db.route('/connection-request', methods=["POST"])
def send_connection_request():
    input = request.get_json()

    if not input:
        abort(400)

    primary_id = input.get("primary_id")
    secondary_id = input.get("secondary_id")
    primary_name = input.get("primary_name")
    secondary_name = input.get("secondary_name")

    if not primary_id:
        abort(400, "primary_id is missing")

    if not secondary_id:
        abort(400, "secondary_id is missing")

    if not primary_name:
        abort(400, "primary_name is missing")
    
    if not secondary_name:
        abort(400, "secondary_name is missing")

    conn = get_db_connection()
    cursor = conn.cursor()

    common_id = f"{primary_id}_{secondary_id}"

    try:
        cursor.execute(
            'INSERT INTO connection_requests (id, primary_id, secondary_id, primary_name, secondary_name) VALUES (%s, %s, %s, %s, %s) RETURNING id', (common_id, primary_id, secondary_id, primary_name, secondary_name)
            )
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        cursor.close()
        conn.close()
        return jsonify({"message": f"You have already sent connection request to {secondary_name}."}), 409
    finally:
        cursor.close()
        conn.close()
    
    return jsonify({
        "message": f"Connection request sent successfully to {secondary_name}."
    }), 201


# MARK: - get connections list

@user_requests_db.route('/pending-connection-requests', methods=['POST'])
def get_connection_requests():
    input = request.get_json()

    if not input:
        abort(400)
    
    my_id = input.get("user_id")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
        'SELECT * FROM connection_requests WHERE id LIKE %s', (f"%{my_id}%")
    )
    requests = cursor.fetchall()
    
    cursor.close()
    conn.close()

    return jsonify(requests)


# MARK: - Error handling

@user_requests_db.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Resource not found"}), 404

@user_requests_db.errorhandler(400)
def handle_400(e):
    return jsonify({"error": str(e)}), 400

@user_requests_db.errorhandler(Exception)
def handle_exception(e):
    print(e)
    return jsonify({"error": "Internal server error"}), 500