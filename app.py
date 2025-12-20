from flask import Flask, request, jsonify, Blueprint
import psycopg2

app = Flask(__name__)




if __name__ == "__main__":
    app.run(debug=True)