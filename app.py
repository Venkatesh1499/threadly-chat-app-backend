from flask import Flask, request, jsonify, Blueprint
from Auth.routes import auth_bp
import psycopg2

app = Flask(__name__)

app.register_blueprint(auth_bp)


if __name__ == "__main__":
    app.run(debug=True)