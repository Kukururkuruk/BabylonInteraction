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

@app.route('/api/map', methods=['GET'])
def get_map():
    # Путь к карте, доступный на сервере
    return jsonify({'map_url': 'http://127.0.0.1:5000/models/Map_1.gltf'})


if __name__ == '__main__':
    app.run(debug=True)