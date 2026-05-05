from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

result = db.execute(text("SELECT 1"))
print(result.fetchone())

print("Database connected!")