from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Threat_Modeling.pdf"


ACCENT = colors.HexColor("#1F4D78")
ACCENT_2 = colors.HexColor("#2E74B5")
MUTED = colors.HexColor("#555555")
LIGHT = colors.HexColor("#F2F4F7")
LIGHT_BLUE = colors.HexColor("#E8EEF5")
RISK_RED = colors.HexColor("#9B1C1C")
RISK_ORANGE = colors.HexColor("#B35A00")
RISK_GOLD = colors.HexColor("#7A5A00")
RISK_GREEN = colors.HexColor("#1F6F43")


def p(text, style):
    return Paragraph(text, style)


def safe(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def bullet_list(items, styles):
    return ListFlowable(
        [ListItem(p(item, styles["BodySmall"]), leftIndent=10) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=16,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def numbered_list(items, styles):
    return ListFlowable(
        [ListItem(p(item, styles["BodySmall"]), leftIndent=10) for item in items],
        bulletType="1",
        leftIndent=18,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def make_table(data, col_widths, styles, header=True, font_size=8.5):
    rows = []
    for row_index, row in enumerate(data):
        style_name = "TableHead" if header and row_index == 0 else "TableCell"
        rows.append([p(safe(cell), styles[style_name]) for cell in row])

    table = Table(rows, colWidths=col_widths, repeatRows=1 if header else 0, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE if header else colors.white),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#111111")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), font_size),
                ("LEADING", (0, 0), (-1, -1), font_size + 2.2),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D4DAE3")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def risk_badge(label, styles):
    color = {
        "Critical": RISK_RED,
        "High": RISK_ORANGE,
        "Medium": RISK_GOLD,
        "Low": RISK_GREEN,
    }.get(label, MUTED)
    return Paragraph(f'<font color="{color.hexval()}"><b>{label}</b></font>', styles["TableCell"])


def page_header(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(inch, letter[1] - 0.55 * inch, "NEMU IPB | Threat Modeling & Initial Vulnerability Assessment")
    canvas.drawRightString(letter[0] - inch, 0.55 * inch, f"Page {doc.page}")
    canvas.setStrokeColor(colors.HexColor("#DADCE0"))
    canvas.setLineWidth(0.5)
    canvas.line(inch, letter[1] - 0.68 * inch, letter[0] - inch, letter[1] - 0.68 * inch)
    canvas.restoreState()


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "Title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=27,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "H1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            textColor=ACCENT_2,
            spaceBefore=14,
            spaceAfter=7,
        ),
        "H2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=15,
            textColor=ACCENT,
            spaceBefore=10,
            spaceAfter=5,
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=13.3,
            alignment=TA_LEFT,
            spaceAfter=7,
        ),
        "BodySmall": ParagraphStyle(
            "BodySmall",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.2,
            spaceAfter=4,
        ),
        "Callout": ParagraphStyle(
            "Callout",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0B2545"),
            backColor=colors.HexColor("#F4F6F9"),
            borderColor=colors.HexColor("#C9D5E3"),
            borderWidth=0.6,
            borderPadding=8,
            spaceBefore=4,
            spaceAfter=10,
        ),
        "TableHead": ParagraphStyle(
            "TableHead",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.4,
            leading=10.8,
            textColor=colors.HexColor("#111111"),
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.1,
            leading=10.6,
            textColor=colors.HexColor("#111111"),
            spaceAfter=0,
        ),
        "FooterNote": ParagraphStyle(
            "FooterNote",
            parent=base["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            spaceAfter=6,
        ),
    }
    return styles


def add_title_page(story, styles):
    story.append(Spacer(1, 0.35 * inch))
    story.append(p("Threat Modeling", styles["Title"]))
    story.append(p("Hasil Vulnerability Assessment Awal", styles["Title"]))
    story.append(
        p(
            "Perancangan dan Implementasi Protokol Keamanan AAA pada Sistem Informasi NEMU IPB",
            styles["Subtitle"],
        )
    )
    meta = [
        ["Sistem", "NEMU IPB - Sistem informasi pelaporan barang hilang dan ditemukan"],
        ["Fokus proyek", "Authentication, Authorization, Accounting (AAA), dan fitur kriptografi"],
        ["Tanggal dokumen", date.today().strftime("%d %B %Y")],
        ["Status", "Assessment awal berbasis review kode sumber lokal"],
    ]
    story.append(make_table(meta, [1.55 * inch, 4.8 * inch], styles, header=False, font_size=9))
    story.append(Spacer(1, 0.18 * inch))
    story.append(
        p(
            "<b>Ringkasan eksekutif.</b> Assessment awal menemukan fondasi keamanan yang sudah tersedia, "
            "seperti password hashing, JWT, role admin, activity log, hash dokumen, dan digital signature. "
            "Namun masih terdapat beberapa risiko penting, terutama endpoint yang belum dilindungi autentikasi, "
            "kontrol akses kepemilikan data yang belum konsisten, konfigurasi CORS yang longgar, dan accounting "
            "yang belum mencatat seluruh aktivitas sensitif.",
            styles["Callout"],
        )
    )

    summary = [
        ["Severity", "Jumlah", "Tema utama"],
        ["Critical", "1", "Endpoint data pengguna terbuka tanpa autentikasi."],
        ["High", "4", "Data laporan/serah terima/notifikasi dapat diakses atau diubah tanpa kontrol memadai."],
        ["Medium", "6", "Logging tidak lengkap, CORS longgar, rate limit belum ada, validasi file terbatas, dan kelemahan key management."],
        ["Low", "2", "Hardening token dan hygiene konfigurasi perlu diperjelas."],
    ]
    story.append(make_table(summary, [1.0 * inch, 0.75 * inch, 4.6 * inch], styles, header=True, font_size=8.6))
    story.append(Spacer(1, 0.1 * inch))
    story.append(
        p(
            "Catatan: severity ditentukan berdasarkan dampak terhadap confidentiality, integrity, availability, "
            "kemudahan eksploitasi dari permukaan API, dan posisi fitur terhadap proyek AAA.",
            styles["FooterNote"],
        )
    )
    story.append(PageBreak())


def add_scope(story, styles):
    story.append(p("1. Ruang Lingkup dan Asumsi", styles["H1"]))
    story.append(
        p(
            "Threat modeling ini dilakukan pada sistem NEMU IPB yang sudah ada. Fokusnya adalah modul backend FastAPI, "
            "frontend React sebagai client, penyimpanan data relasional, serta fitur keamanan yang relevan dengan AAA "
            "dan kriptografi. Assessment ini bersifat awal dan berbasis review kode, sehingga belum mencakup uji penetrasi "
            "penuh, uji beban, atau verifikasi konfigurasi server produksi.",
            styles["Body"],
        )
    )
    story.append(p("Komponen yang masuk scope:", styles["H2"]))
    story.append(
        bullet_list(
            [
                "Endpoint autentikasi, validasi JWT, dan password hashing.",
                "Endpoint admin, laporan, barang, notifikasi, klaim, dan serah terima.",
                "Kontrol akses berbasis role admin dan kepemilikan data pengguna.",
                "Activity log sebagai mekanisme accounting.",
                "Hash dokumen, digital signature RSA, dan verifikasi dokumen serah terima.",
            ],
            styles,
        )
    )
    story.append(p("Asumsi awal:", styles["H2"]))
    story.append(
        bullet_list(
            [
                "Aplikasi digunakan oleh pengguna internal kampus dan admin pengelola.",
                "Database menyimpan data pribadi, data laporan, data klaim, dan bukti serah terima.",
                "Frontend berkomunikasi dengan backend melalui HTTP API dan membawa JWT pada header Authorization.",
                "File environment seperti DATABASE_URL dan SECRET_KEY tidak boleh dipublikasikan.",
            ],
            styles,
        )
    )


def add_architecture(story, styles):
    story.append(p("2. Model Sistem dan Trust Boundary", styles["H1"]))
    story.append(
        p(
            "Model ancaman menggunakan sudut pandang data flow sederhana. Aset bergerak dari browser pengguna menuju "
            "backend API, kemudian diproses oleh modul bisnis dan disimpan ke database. Batas kepercayaan utama berada "
            "di antara browser dan API, API dan database, serta endpoint publik dan endpoint yang memerlukan autentikasi.",
            styles["Body"],
        )
    )
    dfd = [
        ["Elemen", "Komponen", "Threat boundary"],
        ["External entity", "Pengguna umum dan admin melalui browser React", "Tidak dipercaya sebelum login dan validasi token."],
        ["Process", "FastAPI routers: auth, barang, laporan, admin, notifikasi, klaim, serah-terima", "Harus memvalidasi autentikasi, otorisasi, dan input."],
        ["Data store", "Database relasional via SQLAlchemy", "Aset sensitif; akses hanya melalui backend yang tervalidasi."],
        ["Crypto service", "JWT signing, password hashing, SHA-256, RSA digital signature", "Kunci dan secret harus dilindungi dari kebocoran dan manipulasi."],
        ["Audit store", "Tabel activity_logs", "Harus menjaga integritas jejak tindakan penting."],
    ]
    story.append(make_table(dfd, [1.25 * inch, 2.45 * inch, 2.65 * inch], styles, header=True))

    story.append(p("Aset utama yang dilindungi:", styles["H2"]))
    assets = [
        ["Aset", "Nilai keamanan", "Dampak jika terganggu"],
        ["Data pengguna dan password hash", "Confidentiality tinggi", "Kebocoran identitas, takeover akun, dan pelanggaran privasi."],
        ["Token JWT", "Confidentiality dan integrity tinggi", "Session hijacking atau akses endpoint terlindungi."],
        ["Data laporan dan barang", "Integrity dan availability tinggi", "Laporan palsu, status barang salah, atau pencarian tidak akurat."],
        ["Data klaim", "Integrity tinggi", "Barang dapat diklaim oleh pihak yang tidak sah."],
        ["Dokumen serah terima", "Integrity dan non-repudiation tinggi", "Bukti pengembalian barang dapat dipalsukan."],
        ["Activity log", "Integrity tinggi", "Audit tidak dapat dipercaya saat investigasi insiden."],
        ["SECRET_KEY dan DATABASE_URL", "Confidentiality sangat tinggi", "Token dapat dipalsukan atau database dapat diakses langsung."],
    ]
    story.append(make_table(assets, [1.7 * inch, 1.6 * inch, 3.05 * inch], styles, header=True))


def add_stride(story, styles):
    story.append(p("3. Threat Modeling STRIDE", styles["H1"]))
    story.append(
        p(
            "STRIDE digunakan untuk memetakan ancaman terhadap fitur AAA dan aset kriptografi. Tabel berikut merangkum "
            "ancaman utama, skenario, kontrol yang sudah ada, dan rekomendasi kontrol tambahan.",
            styles["Body"],
        )
    )
    stride = [
        ["Kategori", "Skenario ancaman", "Kontrol existing", "Kontrol tambahan"],
        ["Spoofing", "Penyerang mencoba login dengan kredensial hasil tebakan atau token curian.", "Password hash, JWT bearer token, expiry token.", "Rate limit login, lockout bertahap, audit login gagal, secret rotation."],
        ["Tampering", "Status laporan, status barang, atau dokumen serah terima dimodifikasi.", "Endpoint admin untuk status, SHA-256 dan digital signature pada serah terima.", "Otorisasi ketat, audit status lama/baru, trust anchor key signing."],
        ["Repudiation", "Admin atau user menyangkal tindakan verifikasi, klaim, atau ekspor data.", "Tabel activity_logs untuk beberapa aksi admin.", "Log semua aksi sensitif termasuk login, klaim, export, dan verifikasi serah terima."],
        ["Information disclosure", "Data user, laporan, notifikasi, atau serah terima dibaca pihak tidak berhak.", "Beberapa endpoint memakai get_current_user dan ensure_admin.", "Tutup endpoint publik sensitif, periksa kepemilikan data, minimalkan response."],
        ["Denial of service", "Request login/search/filter berulang atau bug runtime mengganggu layanan.", "Validasi Pydantic pada beberapa input.", "Rate limit, pagination, query bounds, perbaiki bug schema penemuan."],
        ["Elevation of privilege", "Pengguna umum mengakses fitur admin atau data milik pengguna lain.", "Role admin pada beberapa endpoint.", "Centralized authorization dependency, test akses negatif per endpoint."],
    ]
    story.append(make_table(stride, [1.0 * inch, 2.05 * inch, 1.55 * inch, 1.75 * inch], styles, header=True, font_size=7.8))


def add_findings(story, styles):
    story.append(PageBreak())
    story.append(p("4. Hasil Vulnerability Assessment Awal", styles["H1"]))
    story.append(
        p(
            "Temuan berikut disusun dari review kode sumber lokal. Evidence merujuk pada perilaku endpoint atau konfigurasi "
            "yang terlihat pada modul aplikasi. Daftar ini menjadi baseline perbaikan untuk proyek akhir AAA.",
            styles["Body"],
        )
    )

    findings = [
        [
            "VA-01",
            "Critical",
            "Endpoint /auth/users tidak dilindungi autentikasi.",
            "Router auth menyediakan GET /auth/users tanpa dependency get_current_user. Response berisiko memuat data user sensitif termasuk password_hash.",
            "Confidentiality data pengguna sangat terdampak dan dapat menjadi awal takeover akun.",
            "Lindungi endpoint dengan admin-only atau hapus endpoint dari produksi. Gunakan response model yang mengecualikan password_hash.",
        ],
        [
            "VA-02",
            "High",
            "Endpoint laporan publik membuka data laporan.",
            "GET /laporan dan GET /laporan/{laporan_id} tidak menggunakan autentikasi. Detail laporan mengembalikan pelapor, email, status, dan data barang.",
            "Pengguna tidak sah dapat membaca data laporan dan identitas pelapor.",
            "Tambahkan autentikasi, filter berdasarkan kepemilikan user, dan admin-only untuk daftar global.",
        ],
        [
            "VA-03",
            "High",
            "Endpoint notifikasi read tidak memvalidasi user dan ownership.",
            "PATCH /notifikasi/{id}/read tidak memakai get_current_user dan tidak memeriksa Notifikasi.user_id.",
            "Pihak tidak sah dapat mengubah status notifikasi milik pengguna lain.",
            "Tambahkan get_current_user dan filter notifikasi_id bersama current_user.user_id.",
        ],
        [
            "VA-04",
            "High",
            "Endpoint pengambilan serah terima belum memeriksa ownership.",
            "GET /serah-terima/{klaim_id} memerlukan login tetapi mengembalikan dokumen berdasarkan klaim_id tanpa memeriksa admin atau user pemilik.",
            "User login lain dapat membaca dokumen serah terima yang bukan miliknya.",
            "Samakan kontrol dengan endpoint verify: hanya admin atau user pemilik dokumen.",
        ],
        [
            "VA-05",
            "High",
            "Konfigurasi CORS terlalu longgar.",
            "Backend mengatur allow_origins=['*'], allow_methods=['*'], allow_headers=['*'], dan allow_credentials=True.",
            "Memperluas permukaan serangan dari origin tidak tepercaya, terutama jika token disimpan di client.",
            "Batasi origin ke domain frontend resmi dan pisahkan konfigurasi dev/production.",
        ],
        [
            "VA-06",
            "Medium",
            "Accounting belum mencatat seluruh aktivitas sensitif.",
            "Activity log sudah ada untuk verifikasi laporan dan update status barang, tetapi belum konsisten untuk login gagal/berhasil, pengajuan klaim, verifikasi klaim, serah terima, dan ekspor.",
            "Audit trail tidak lengkap ketika terjadi insiden.",
            "Standarkan helper logging dan panggil pada semua aksi AAA sensitif.",
        ],
        [
            "VA-07",
            "Medium",
            "Tidak ada rate limiting atau lockout login.",
            "Endpoint login memverifikasi password tetapi belum terlihat kontrol pembatasan percobaan.",
            "Risiko brute force dan credential stuffing meningkat.",
            "Tambahkan rate limit per IP/user, delay bertahap, dan log percobaan gagal.",
        ],
        [
            "VA-08",
            "Medium",
            "Key management digital signature belum memiliki trust anchor kuat.",
            "Key pair RSA dibuat saat serah terima, public key disimpan bersama signature dan dokumen. Jika database dapat dimodifikasi, attacker dapat mengganti dokumen, hash, signature, dan public key sekaligus.",
            "Integritas dokumen bergantung penuh pada integritas database.",
            "Gunakan signing key server yang dikelola terpisah, simpan public key tepercaya, dan audit perubahan dokumen.",
        ],
        [
            "VA-09",
            "Medium",
            "Validasi dokumentasi barang hanya berbasis ekstensi.",
            "Schema memvalidasi dokumentasi dengan ekstensi .jpg/.jpeg/.png/.webp, belum memvalidasi MIME, ukuran, atau storage path.",
            "Risiko file spoofing, referensi path tidak valid, atau konten berbahaya jika upload ditambahkan.",
            "Validasi MIME, ukuran, lokasi penyimpanan, dan gunakan object storage/path sanitizer.",
        ],
        [
            "VA-10",
            "Medium",
            "Endpoint barang publik mengembalikan seluruh data barang.",
            "GET /barang, search, status, dan filter dapat diakses tanpa login dan mengembalikan lokasi, dokumentasi, dan status.",
            "Jika data barang dianggap internal, terjadi information disclosure.",
            "Tentukan kebijakan publik; tampilkan hanya barang terverifikasi dan minimalkan data sensitif.",
        ],
        [
            "VA-11",
            "Medium",
            "Bug pada laporan penemuan dapat menyebabkan kegagalan runtime.",
            "Fungsi buat_laporan_penemuan mengakses data.user_id, sementara schema LaporanCreate tidak memiliki field user_id.",
            "Endpoint penemuan berpotensi gagal dan mengganggu availability fitur.",
            "Gunakan current_user.user_id seperti laporan kehilangan dan tambahkan test endpoint penemuan.",
        ],
        [
            "VA-12",
            "Low",
            "JWT hardening belum lengkap.",
            "Token memuat user_id, username, role, dan exp, tetapi belum terlihat issuer, audience, token id, atau mekanisme revocation.",
            "Kontrol sesi masih dasar dan sulit dicabut sebelum expiry.",
            "Tambahkan iss, aud, jti, refresh strategy, dan blacklist/rotation jika diperlukan.",
        ],
        [
            "VA-13",
            "Low",
            "Konfigurasi secret perlu fail-fast dan dokumentasi environment.",
            "SECRET_KEY diambil dari environment. Jika kosong atau lemah, signing JWT menjadi berisiko.",
            "Kesalahan deployment dapat melemahkan seluruh autentikasi.",
            "Validasi SECRET_KEY saat startup dan dokumentasikan minimum entropy serta rotasi secret.",
        ],
    ]

    for finding in findings:
        fid, severity, title, evidence, impact, rec = finding
        story.append(KeepTogether([
            p(f"{fid} - {title}", styles["H2"]),
            make_table(
                [
                    ["Severity", "Evidence", "Dampak", "Rekomendasi"],
                    [severity, evidence, impact, rec],
                ],
                [0.85 * inch, 2.05 * inch, 1.55 * inch, 1.9 * inch],
                styles,
                header=True,
                font_size=7.8,
            ),
            Spacer(1, 0.08 * inch),
        ]))


def add_remediation(story, styles):
    story.append(PageBreak())
    story.append(p("5. Prioritas Remediasi", styles["H1"]))
    story.append(
        p(
            "Prioritas perbaikan disusun agar proyek akhir langsung memperkuat komponen AAA yang paling berisiko. "
            "Urutan berikut disarankan untuk sprint implementasi.",
            styles["Body"],
        )
    )
    priorities = [
        ["Prioritas", "Area", "Aksi utama"],
        ["P0", "Data exposure", "Amankan /auth/users, /laporan, /laporan/{id}, /notifikasi/{id}/read, dan /serah-terima/{klaim_id}."],
        ["P0", "Authorization", "Buat dependency admin_required dan owner_or_admin_required yang dipakai konsisten."],
        ["P1", "Accounting", "Catat login, login gagal, klaim, verifikasi klaim, serah terima, export, dan akses ditolak."],
        ["P1", "CORS", "Batasi origin produksi dan pisahkan konfigurasi development."],
        ["P1", "Authentication", "Tambahkan rate limiting, lockout bertahap, dan audit percobaan login."],
        ["P2", "Kriptografi", "Perbaiki key management digital signature dengan signing key yang menjadi trust anchor."],
        ["P2", "Data minimization", "Batasi response publik barang/laporan dan gunakan response schema eksplisit."],
        ["P2", "Quality", "Tambahkan test negatif untuk akses tanpa token, role salah, dan data bukan milik user."],
    ]
    story.append(make_table(priorities, [0.85 * inch, 1.25 * inch, 4.25 * inch], styles, header=True, font_size=8.3))

    story.append(p("6. Rencana Pengujian Keamanan", styles["H1"]))
    tests = [
        ["Skenario uji", "Kontrol yang diuji", "Ekspektasi"],
        ["Akses endpoint admin dengan user biasa", "Authorization", "HTTP 403 dan log akses ditolak tercatat."],
        ["Akses /laporan/{id} milik user lain", "Owner-based access", "HTTP 403 atau data tidak ditemukan."],
        ["PATCH notifikasi milik user lain", "Owner-based access", "Status notifikasi tidak berubah."],
        ["GET serah terima klaim user lain", "Confidentiality", "HTTP 403."],
        ["Login password salah berulang", "Authentication hardening", "Rate limit/lockout aktif dan log gagal tercatat."],
        ["Admin export laporan", "Accounting", "Export berhasil dan activity log mencatat admin serta waktu."],
        ["Dokumen serah terima dimodifikasi", "Integrity crypto", "Hash/signature verification gagal."],
        ["JWT dimodifikasi manual", "JWT signing", "Token ditolak."],
        ["Request dari origin tidak sah", "CORS", "Browser menolak akses response."],
    ]
    story.append(make_table(tests, [2.2 * inch, 1.75 * inch, 2.4 * inch], styles, header=True, font_size=8.2))

    story.append(p("7. Kesimpulan Assessment Awal", styles["H1"]))
    story.append(
        p(
            "NEMU IPB sudah memiliki fondasi keamanan yang relevan dengan proyek akhir AAA, tetapi penerapannya belum "
            "merata di seluruh endpoint. Risiko terbesar saat ini adalah kebocoran data melalui endpoint yang belum "
            "dilindungi, kontrol kepemilikan data yang belum konsisten, dan jejak accounting yang belum lengkap. "
            "Remediasi awal sebaiknya memprioritaskan penutupan endpoint sensitif, standardisasi authorization dependency, "
            "dan perluasan activity log. Setelah itu, fitur kriptografi dokumen serah terima dapat diperkuat melalui "
            "key management yang lebih tepercaya.",
            styles["Callout"],
        )
    )


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)

    styles = build_styles()
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=0.85 * inch,
        bottomMargin=0.78 * inch,
        title="Threat Modeling - NEMU IPB",
        author="Codex",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=page_header)])

    story = []
    add_title_page(story, styles)
    add_scope(story, styles)
    add_architecture(story, styles)
    add_stride(story, styles)
    add_findings(story, styles)
    add_remediation(story, styles)

    doc.build(story)
    print(OUT)


if __name__ == "__main__":
    build()
