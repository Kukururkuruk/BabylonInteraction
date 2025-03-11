from app import app, db
from sqlalchemy import text

with app.app_context():
    # Выполняем запрос, чтобы получить список таблиц в схеме public
    result = db.session.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
    
    # Извлекаем все строки результата
    tables = result.fetchall()
    
    # Печатаем список таблиц
    if tables:
        print("Существующие таблицы в базе данных:")
        for table in tables:
            print(table[0])  # table[0] содержит название таблицы
    else:
        print("Таблицы в базе данных не найдены.")