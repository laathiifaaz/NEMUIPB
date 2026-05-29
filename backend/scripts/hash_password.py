from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "admin"  # pastikan ini string biasa
hashed = pwd.hash(password)

print(hashed)