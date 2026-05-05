from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "123456"  # pastikan ini string biasa
hashed = pwd.hash(password)

print(hashed)