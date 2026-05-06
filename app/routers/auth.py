from fastapi import APIRouter, HTTPException

from app.database import SessionLocal
from app.models import User
from app.schemas import UserLogin
from app.utils.security import pwd_context

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/users")
def get_users():
    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return users

@router.post("/login")
def login(user: UserLogin):
    db = SessionLocal()

    email = f"{user.username}@apps.ipb.ac.id"

    db_user = db.query(User).filter(User.email == email).first()

    # kalau user belum ada → buat otomatis
    if not db_user:
        hashed_password = pwd_context.hash(user.password)

        new_user = User(
            nama=user.username,
            email=email,
            password_hash=hashed_password,
            role="civitas",
            status_akun=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        db.close()

        return {
            "message": "User baru dibuat & login berhasil",
            "user_id": new_user.user_id,
            "username": user.username
        }

    # kalau user sudah ada → cek password
    if not pwd_context.verify(user.password, db_user.password_hash):
        db.close()
        raise HTTPException(status_code=401, detail="Password salah")

    db.close()

    return {
        "message": "Login berhasil",
        "user_id": db_user.user_id,
        "username": user.username
    }