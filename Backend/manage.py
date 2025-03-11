from flask import Flask
from flask_migrate import MigrateCommand
from app import db  # или твой файл с конфигурацией базы данных и моделями
from flask_script import Manager

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://myuser:1111@localhost:5432/project_db'
db.init_app(app)

migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == "__main__":
    manager.run()