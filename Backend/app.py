from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from uuid import uuid4

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Строка подключения к базе данных
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres_autodor:1111@localhost:5432/project_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация SQLAlchemy
db = SQLAlchemy(app)
# Инициализация миграций
migrate = Migrate(app, db)
# Модели базы данных

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    access_token = db.Column(db.String(36), unique=True, default=lambda: str(uuid4()))

class Topic(db.Model):
    __tablename__ = 'topics'
    id = db.Column(db.Integer, primary_key=True)
    lms_id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Result(db.Model):
    __tablename__ = 'results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    status = db.Column(db.Boolean, nullable=False)
    completed_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    user = db.relationship('User', back_populates='results')
    topic = db.relationship('Topic', back_populates='results')

User.results = db.relationship('Result', back_populates='user')
Topic.results = db.relationship('Result', back_populates='topic')


class UserProgress(db.Model):
    __tablename__ = 'user_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    status = db.Column(db.Boolean, nullable=False)
    completed_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship('User', backref=db.backref('progress', lazy=True))
    topic = db.relationship('Topic', backref=db.backref('progress', lazy=True))

# API маршруты
@app.route('/api/access_course/<string:token>', methods=['GET'])
def access_course(token):
    user = User.query.filter_by(access_token=token).first()
    if not user:
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"message": "Welcome to your course!"}), 200


@app.route('/api/get_course_link/<int:user_id>', methods=['GET'])
def get_course_link(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"course_link": f"http://my-lms.com/course/{user.access_token}"}), 200

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/user/points', methods=['POST'])
def receive_points():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        topic_id = data.get('topic_id')
        pointsPressedCount = data.get('pointsPressedCount')

        if not all([user_id, topic_id, pointsPressedCount is not None]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        new_result = Result(status=bool(pointsPressedCount), user_id=user_id, topic_id=topic_id)
        db.session.add(new_result)
        db.session.commit()

        return jsonify({"status": "success", "pointsPressedCount": pointsPressedCount}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/user/points', methods=['GET'])
def get_points():
    try:
        result = Result.query.order_by(Result.id.desc()).first()
        
        if result:
            return jsonify({"status": "success", "pointsPressedCount": result.status}), 200
        else:
            return jsonify({"status": "error", "message": "No data found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
   
if __name__ == '__main__':
    app.run(debug=True)