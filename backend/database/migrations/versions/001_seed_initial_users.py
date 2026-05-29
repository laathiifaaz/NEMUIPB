"""seed initial users

Revision ID: 001_seed_initial_users
Revises: df85a3f7a115
Create Date: 2026-05-29

"""
from typing import Sequence, Union

from alembic import op


revision: str = "001_seed_initial_users"
down_revision: Union[str, Sequence[str], None] = "df85a3f7a115"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO users (
            user_id,
            nama,
            email,
            identitas,
            no_hp,
            password_hash,
            role,
            status_akun
        )
        VALUES
        (
            1,
            'Budi Santoso',
            'budisantoso@apps.ipb.ac.id',
            'G6401231001',
            '081234567890',
            '$2b$12$ISJyjzpZOe0109.pkIoUge8HdTPU6VTwDrRpjlT475ElaJ.08kh7u',
            'civitas',
            true
        ),
        (
            2,
            'Admin Sistem',
            'admin@apps.ipb.ac.id',
            'ADMIN001',
            '081234567891',
            '$2b$12$C2KeAu84A8g82T/mWtAk6uEs3NSao1NbBvs/dEl.M2l8zQCYD7q3e',
            'admin',
            true
        ),
        (
            3,
            'Jamilah Husain',
            'jamilah@apps.ipb.ac.id',
            'G6401231200',
            '081234567892',
            '$2b$12$ISJyjzpZOe0109.pkIoUge8HdTPU6VTwDrRpjlT475ElaJ.08kh7u',
            'civitas',
            true
        )
        ON CONFLICT (user_id) DO UPDATE SET
            nama = EXCLUDED.nama,
            email = EXCLUDED.email,
            identitas = EXCLUDED.identitas,
            no_hp = EXCLUDED.no_hp,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            status_akun = EXCLUDED.status_akun;
    """)

    op.execute("""
        SELECT setval(
            pg_get_serial_sequence('users', 'user_id'),
            COALESCE((SELECT MAX(user_id) FROM users), 1)
        );
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM users
        WHERE email IN (
            'budisantoso@apps.ipb.ac.id',
            'admin@apps.ipb.ac.id',
            'jamilah@apps.ipb.ac.id'
        );
    """)

    op.execute("""
        SELECT setval(
            pg_get_serial_sequence('users', 'user_id'),
            COALESCE((SELECT MAX(user_id) FROM users), 1)
        );
    """)