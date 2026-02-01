from flask import Flask, request, jsonify, Blueprint, abort, render_template
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import errors
from DATABASE import get_db_connection
from twilio.rest import Client
import random

ACCOUNT_SID = "ACd090f0111ea6d039529849601ebb65f4"
AUTH_TOKEN = "3e4677876b8dc12125e4f39077321891"
TWILIO_NUMBER = "+12202348733"

auth_bp = Blueprint("auth", __name__)

client = Client(ACCOUNT_SID, AUTH_TOKEN)

# MARK: - Generate OTP

def generate_OTP():
    return str(random.randint(100000, 999999))


# MARK: - Send OTP

def send_otp(mobile, otp):
    message = client.messages.create(
        body=f"Hey, welcome to Threadly. Your OTP for registration on Threadly is {otp}. Do not share it.",
        from_=TWILIO_NUMBER,
        to=mobile
    )
    return message.sid

# MARK: - Table creation

@auth_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Hey, welcome"})

# def home():
#     return render_template("index.html")

def create_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
                   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                   username VARCHAR(100) UNIQUE NOT NULL,
                   password VARCHAR(250) NOT NULL
                   );
                   ''')
    
    conn.commit()
    cursor.close()
    conn.close()

create_table()

def delete_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        'DROP TABLE users'
    )

    conn.commit()
    cursor.close()
    conn.close()

# delete_table()

# MARK: - User registration 

@auth_bp.route('/register', methods=['POST'])
def register():
    input = request.get_json()

    if not input:
        abort(400)

    mobile_number = input.get("mobileNumber")
    password = input.get("password")
    
    if not mobile_number:
        abort(400, "mobileNumber is missing")
    
    if not password:
        abort(400, "password is missing")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    otp = generate_OTP()
    send_otp(f"+91{mobile_number}", otp)

    try:
        cursor.execute(
            'INSERT INTO users (username, password) VALUES (%s, %s) RETURNING id', (mobile_number, password)
            )
        user_id = cursor.fetchone()[0]
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "mobileNumber already taken"}), 400
    finally:
        cursor.close()
        conn.close()
    
    return jsonify({
        'id': user_id,
        'mobileNumber': mobile_number
    }), 201


# MARK : - User login

@auth_bp.route('/login', methods=['POST'])
def login():
    input = request.get_json()

    if not input:
        abort(400)
    
    username = input.get("username")
    password = input.get("password")

    if not username:
        abort(400, "username is missing")
    
    if not password:
        abort(400, "password is missing")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'SELECT password FROM users WHERE username = %s ', (username,)
        )
        user = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    
    if user and user[0] == password:
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401


# MARK: - Fetch users

@auth_bp.route('/users', methods=['GET'])
def users():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
        'SELECT id, username FROM users'
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
    print(e)
    return jsonify({"error": "Internal server error", "error message": f"{e}"}), 500
