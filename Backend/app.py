from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})  # Убедитесь, что путь корректен

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/data', methods=['GET'])
def get_data():
    print("Запрос на получение данных получен")  # Логируем запрос
    return jsonify({"key": "value"})

if __name__ == '__main__':
    app.run(debug=True)