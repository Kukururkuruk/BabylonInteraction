import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Строка подключения
DATABASE_URL = "postgres://myuser:1111@localhost:5432/project_db"

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Ошибка подключения к базе данных: {e}")
        return None

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/user/points', methods=['POST'])
def receive_points():
    try:
        data = request.get_json()
        print(f"Полученные данные на сервере: {data}")
        
        pointsPressedCount = data.get('pointsPressedCount')
        
        if pointsPressedCount is None:
            return jsonify({"status": "error", "message": "pointsPressedCount is required"}), 400
        
        print(f"Получено количество нажатых точек: {pointsPressedCount}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Ошибка подключения к базе данных"}), 500
        
        cursor = conn.cursor()
        
        # Сохраняем значение, переданное с клиента, в базу данных без увеличения
        cursor.execute('INSERT INTO user_points (points) VALUES (%s)', (pointsPressedCount,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "pointsPressedCount": pointsPressedCount}), 200
    except Exception as e:
        print(f"Ошибка обработки запроса: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/user/points', methods=['GET'])
def get_points():
    try:
        # Открываем соединение с базой данных
        conn = get_db_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Ошибка подключения к базе данных"}), 500

        cursor = conn.cursor()

        # Выполняем запрос на выборку последнего количества точек
        cursor.execute("SELECT points FROM user_points ORDER BY id DESC LIMIT 1")
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        # Если результат есть, возвращаем его, иначе отправляем ошибку
        if result:
            points = result[0]
            return jsonify({"status": "success", "pointsPressedCount": points}), 200
        else:
            return jsonify({"status": "error", "message": "No data found"}), 404
    except Exception as e:
        print(f"Ошибка обработки запроса: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


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