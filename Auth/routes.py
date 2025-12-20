from flask import Flask, request, jsonify, Blueprint, abort
import psycopg2
from psycopg2 import errors
from DATABASE import get_db_connection


auth_bp = Blueprint("auth", __name__)

create_table()

def create_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
                   id SERIAL PRIMARY KEY,
                   username VARCHAR(100) UNIQUE NOT NULL,
                   password VARCHAR(250) NOT NULL
                   )
                   ''')
    
    conn.commit()
    cursor.close()
    conn.close()


@auth_bp.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Resource not found"}), 404

@auth_bp.errorhandler(400)
def handle_400(e):
    return jsonify({"error": str(e)}), 400

@auth_bp.errorhandler(Exception)
def handle_exception(e):
    auth_bp.logger.error(e)
    return jsonify({"error": "Internal server error"}), 500
