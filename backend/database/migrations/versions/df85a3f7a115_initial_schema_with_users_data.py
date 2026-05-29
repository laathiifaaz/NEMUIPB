from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'df85a3f7a115'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema without dropping anything"""
    # Users table: just ensure columns nullable and indexes
    op.alter_column('users', 'nama',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.alter_column('users', 'email',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    op.alter_column('users', 'password_hash',
               existing_type=sa.TEXT(),
               nullable=True)
    op.alter_column('users', 'role',
               existing_type=postgresql.ENUM('civitas', 'admin', name='user_role'),
               type_=sa.String(),
               nullable=True,
               existing_server_default=sa.text("'civitas'::user_role"))
    op.alter_column('users', 'status_akun',
               existing_type=sa.BOOLEAN(),
               nullable=True,
               existing_server_default=sa.text('true'))
    op.create_index(op.f('ix_users_user_id'), 'users', ['user_id'], unique=False)

    # Barang table: just ensure indexes and type adjustments, no drops
    op.alter_column('barang', 'nama_barang',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    op.alter_column('barang', 'kategori',
               existing_type=sa.VARCHAR(length=50),
               nullable=False)
    op.alter_column('barang', 'status_barang',
               existing_type=sa.String(),
               type_=postgresql.ENUM('hilang', 'ditemukan', 'diklaim', 'selesai', name='status_barang'),
               nullable=False,
               existing_server_default=sa.text("'hilang'::status_barang"))
    op.create_index(op.f('ix_barang_barang_id'), 'barang', ['barang_id'], unique=False)

    # Klaim_barang table: indexes and foreign keys, no drops
    op.alter_column('klaim_barang', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('klaim_barang', 'barang_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('klaim_barang', 'laporan_kehilangan_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('klaim_barang', 'status_klaim',
               existing_type=sa.String(),
               type_=postgresql.ENUM('diproses', 'diterima', 'ditolak', name='status_klaim'),
               nullable=False,
               existing_server_default=sa.text("'diproses'::status_klaim"))
    op.create_index(op.f('ix_klaim_barang_klaim_id'), 'klaim_barang', ['klaim_id'], unique=False)
    op.create_foreign_key(None, 'klaim_barang', 'users', ['user_id'], ['user_id'])
    op.create_foreign_key(None, 'klaim_barang', 'barang', ['barang_id'], ['barang_id'])
    op.create_foreign_key(None, 'klaim_barang', 'laporan', ['laporan_kehilangan_id'], ['laporan_id'])

    # Laporan table: only alter columns to match type, indexes, foreign keys
    op.alter_column('laporan', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('laporan', 'barang_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('laporan', 'status_verifikasi',
               existing_type=sa.String(),
               type_=postgresql.ENUM('belum_diverifikasi', 'terverifikasi', 'ditolak', name='status_verifikasi'),
               nullable=False)
    op.alter_column('laporan', 'status_laporan',
               existing_type=sa.String(),
               type_=postgresql.ENUM('menunggu', 'disetujui', 'ditolak', 'siap_diambil', 'selesai', name='status_laporan'),
               nullable=False)
    op.alter_column('laporan', 'jenis_laporan',
               existing_type=sa.String(),
               type_=postgresql.ENUM('kehilangan', 'penemuan', name='jenis_laporan'),
               nullable=False)
    op.create_index(op.f('ix_laporan_laporan_id'), 'laporan', ['laporan_id'], unique=False)
    op.create_foreign_key(None, 'laporan', 'users', ['verified_by'], ['user_id'])
    op.create_foreign_key(None, 'laporan', 'users', ['user_id'], ['user_id'])
    op.create_foreign_key(None, 'laporan', 'barang', ['barang_id'], ['barang_id'])

    # Notifikasi table: ensure foreign keys, indexes
    op.alter_column('notifikasi', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('notifikasi', 'pesan',
               existing_type=sa.TEXT(),
               nullable=False)
    op.create_index(op.f('ix_notifikasi_notifikasi_id'), 'notifikasi', ['notifikasi_id'], unique=False)
    op.create_foreign_key(None, 'notifikasi', 'users', ['user_id'], ['user_id'])
    op.create_foreign_key(None, 'notifikasi', 'laporan', ['laporan_id'], ['laporan_id'])

    # Serah_terima table
    op.alter_column('serah_terima', 'public_key',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('serah_terima', 'digital_signature',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('serah_terima', 'dokumen_hash',
               existing_type=sa.TEXT(),
               nullable=False)
    op.alter_column('serah_terima', 'dokumen_text',
               existing_type=sa.TEXT(),
               nullable=False)
    op.create_index(op.f('ix_serah_terima_serah_terima_id'), 'serah_terima', ['serah_terima_id'], unique=False)

    # Sessions table: only create if not exist (optional, Alembic does not drop anything)
    op.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT sessions_pkey PRIMARY KEY (session_id),
        CONSTRAINT fk_session_user FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE,
        CONSTRAINT sessions_token_key UNIQUE (token)
    );
    """)


def downgrade() -> None:
    """Downgrade schema: only revert type/index changes, no drop of tables/columns"""
    # Users table
    op.drop_index(op.f('ix_users_user_id'), table_name='users')
    # Sessions table
    op.drop_index(op.f('ix_serah_terima_serah_terima_id'), table_name='serah_terima')
    # Laporan table
    op.drop_index(op.f('ix_laporan_laporan_id'), table_name='laporan')
    # Notifikasi table
    op.drop_index(op.f('ix_notifikasi_notifikasi_id'), table_name='notifikasi')
    # Klaim_barang table
    op.drop_index(op.f('ix_klaim_barang_klaim_id'), table_name='klaim_barang')
    # Barang table
    op.drop_index(op.f('ix_barang_barang_id'), table_name='barang')