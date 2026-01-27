from flask import Flask, jsonify, request, Blueprint , abort
from psycopg2.extras import RealDictCursor
import psycopg2
from psycopg2 import errors
import uuid
from DATABASE import get_db_connection

# Adding blueprint
chat_bp = Blueprint("Chat", __name__)

