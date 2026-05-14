from fastapi import APIRouter, HTTPException
from app.database import SessionLocal
from app.models import User
from app.schemas import UserLogin
from app.utils.security import pwd_context, create_access_token

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

    try:
        # format email dari username input frontend
        email = f"{user.username}@apps.ipb.ac.id"

        # cari user di database
        db_user = db.query(User).filter(User.email == email).first()

        # kalau user tidak ditemukan
        if not db_user:
            raise HTTPException(status_code=401, detail="User tidak ditemukan")

        # cek password
        if not pwd_context.verify(user.password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Password salah")

        # generate token
        access_token = create_access_token({
            "user_id": db_user.user_id,
            "username": db_user.nama,   
            "role": db_user.role
        })

        # response sukses
        return {
            "message": "Login berhasil",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": db_user.user_id,
                "username": db_user.nama,   
                "email": db_user.email,
                "role": db_user.role
            }
        }

    finally:
        db.close()