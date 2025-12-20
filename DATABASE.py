import psycopg2
import os

DATABASE_URL = os.environ.get("DATABASE_URL")

# MARK: - DB Connections

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)