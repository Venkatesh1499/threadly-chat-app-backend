from flask import Flask, request, jsonify, Blueprint
import psycopg2
from Auth.routes import auth_bp
from UserRequests.routes import user_requests_db

app = Flask(__name__)

# Registering blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_requests_db)


if __name__ == "__main__":
    app.run(debug=True)