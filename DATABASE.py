import psycopg2
import os
from urllib.parse import urlparse

DATABASE_URL = os.environ.get("DATABASE_URL")

# MARK: - DB Connections

# def get_db_connection():
#     return psycopg2.connect(DATABASE_URL)

# DATABASE_URL = os.environ.get("DATABASE_URL")
# DATABASE_URL = "postgresql://flask_demo_u6e7_user:dkcTI4popHDtCamz2rDjcBxaAYOCNwKj@dpg-d5260sh5pdvs73c9leug-a/flask_demo_u6e7"
result = urlparse(DATABASE_URL)

def get_db_connection():
    # return psycopg2.connect(
    #     dbname=result.path[1:],
    #     user=result.username,
    #     password=result.password,
    #     host=result.hostname,
    #     port=result.port
    # )
    return psycopg2.connect(DATABASE_URL)