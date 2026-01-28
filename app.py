from flask import Flask, request, jsonify, Blueprint
import psycopg2
from Auth.routes import auth_bp
from UserRequests.routes import user_requests_db
from ConnectionManagement.routes import connections_management_db
from Chat.routes import chat_bp, socketio

app = Flask(__name__)

# Registering blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_requests_db)
app.register_blueprint(connections_management_db)
app.register_blueprint(chat_bp)

app.config['SECERT_KEY'] = "secret123"
socketio.init_app(app)

@app.route('/')
def home():
    return render_template("index.html")


if __name__ == "__main__":
    socketio.run(debug=True)