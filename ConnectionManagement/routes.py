from flask import Flask, request, jsonify, abort, Blueprint
import uuid
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
from dataclasses import dataclass
import psycopg2
from DATABASE import get_db_connection
from datetime import datetime

connections_management_db = Blueprint("connection_management", __name__)

# MARK: - Accept/Reject request

@connections_management_db.route('/action-request', methods=['POST'])
def action_on_request():
    input = request.get_json()

    if not input:
        abort(400)

    primary_id = input.get("primary_id")
    secondary_id = input.get("secondary_id")
    primary_name = input.get("primary_name")
    secondary_name = input.get("secondary_name")
    action = input.get("action")
    # primary_name = input.get("primary_name")
    # secondary_name = input.get("secondary_name")

    if not primary_id:
        abort(400, "primary_id is missing")

    if not secondary_id:
        abort(400, "secondary_id is missing")

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # cursor.execute(
    #     'SELECT * FROM connection_requests WHERE primary_id = %s RETURNING id', (primary_id,)
    # )
    # details = cursor.fetchone()
    cursor.execute(
        'DELETE FROM connection_requests WHERE primary_id = %s RETURNING id', (primary_id,)
    )
    conn.commit()

    if cursor.rowcount > 0:

        cursor.close()
        conn.close()

        common_id = f"{primary_id}_{secondary_id}"
        
        if action == "ACCEPT":
            details = connectionDetails(
               common_id = common_id,
               primary_id= primary_id,
               secondary_id= secondary_id,
               primary_name= primary_name,
               secondary_name= secondary_name
            #    connected_at= datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            insert_into_db(details)
            return jsonify({
                "connection_Id": common_id,
                "message": "Accepted successfully"
            }), 201
        else:
            return jsonify({
                "message": "Rejected successfully"
            }), 201
    else:
        return abort(400, "Unable to find the required details to perform your action")
    

#MARK: - connection list

@connections_management_db.route('/active-connections', methods=['POST'])
def get_active_connections():
    input = request.get_json()

    user_id = input.get("user_id")

    if not user_id:
        # return jsonify({"message": })
        return abort(400, "user_id is missing")    
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
        'SELECT * FROM active_connections WHERE common_id LIKE %s', (f"%{user_id}%",)
    )

    users = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(users), 200


# MARK: - Insert into DB

def insert_into_db(connectionDetails):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute(
            'INSERT INTO active_connections (common_id, primary_id, secondary_id, primary_name, secondary_name) VALUES (%s, %s, %s, %s, %s)', (
                connectionDetails.common_id,
                connectionDetails.primary_id,
                connectionDetails.secondary_id,
                connectionDetails.primary_name,
                connectionDetails.secondary_name,
                )
        )
        if cursor.rowcount > 0:
            print("Inserted successfully")
        conn.commit()
    except Exception as e:
        print("Error while inserting", e)
    finally:
        cursor.close()
        conn.close()


# create active_connections table

def create_table():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
        ''' CREATE TABLE IF NOT EXISTS active_connections (
        common_id VARCHAR(300) UNIQUE NOT NULL,
        primary_id UUID NOT NULL,
        secondary_id UUID NOT NULL,
        primary_name VARCHAR(100) NOT NULL,
        secondary_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
        )
        '''
    )
    conn.commit()
    cursor.close()
    conn.close()

create_table()


def delete_table():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute(
        "DROP TABLE active_connections"
    )
    
    conn.commit()
    cursor.close()
    conn.close()

# delete_table()

#Created data class for easy handling

@dataclass
class connectionDetails:
    common_id: str
    primary_id: str
    secondary_id: str
    primary_name: str
    secondary_name: str
    # connected_at: str


# MARK: - Error handling

@connections_management_db.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "Resource not found"}), 404

@connections_management_db.errorhandler(400)
def handle_400(e):
    return jsonify({"error": str(e)}), 400

@connections_management_db.errorhandler(Exception)
def handle_exception(e):
    print(e)
    return jsonify({"error": f"Internal server error, {e}"}), 500