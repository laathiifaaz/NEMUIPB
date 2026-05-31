import React, { useEffect, useMemo, useRef, useState } from "react";
import AuthService from "../services/AuthService";
import NotifikasiService from "../services/NotifikasiService";
import AdminService from "../services/AdminService";
import ReportService from "../services/ReportService";

const formatNotificationDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserNotificationTitle = (notification) => {
  const message = (notification.pesan || "").toLowerCase();
  const reportType = notification.jenis_laporan;
  const itemName = notification.judul_laporan || `Laporan #${notification.laporan_id}`;

  if (message.includes("klaim barang anda diterima")) {
    return `Klaim barang disetujui: ${itemName}`;
  }

  if (message.includes("klaim barang anda ditolak")) {
    return `Klaim barang ditolak: ${itemName}`;
  }

  if (reportType === "kehilangan") {
    return `Laporan kehilangan: ${itemName}`;
  }

  if (reportType === "penemuan") {
    return `Laporan penemuan: ${itemName}`;
  }

  return itemName || notification.pesan;
};

const getUserNotificationDescription = (notification) => {
  const statusDate =
    notification.tanggal_verifikasi ||
    notification.tanggal_kirim ||
    notification.tanggal_laporan;
  const formattedDate = formatNotificationDate(statusDate);
  const itemName = notification.judul_laporan || `Laporan #${notification.laporan_id}`;
  const message = notification.pesan || "";
  const normalizedMessage = message.toLowerCase();

  const displayMessage = normalizedMessage.includes("klaim barang anda diterima")
    ? "Klaim diterima. Ambil barang di Pos Keamanan NEMU IPB, Senin-Jumat 08.00-17.00 WIB."
    : message;

  if (!notification.laporan_id) return message;

  return [
    `Laporan #${notification.laporan_id} - ${itemName}.`,
    formattedDate ? `Diperbarui pada ${formattedDate}.` : "",
    displayMessage,
  ]
    .filter(Boolean)
    .join(" ");
};

const isNotificationUnread = (notification, isAdmin) => {
  if (isAdmin || notification.synthetic) {
    return (notification.count || 0) > 0 && !notification.readLocally;
  }

  return !notification.status_baca;
};

const getNotificationTimestamp = (notification) => {
  const value =
    notification.tanggal_kirim ||
    notification.tanggal_verifikasi ||
    notification.tanggal_laporan;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortUserNotifications = (notifications) =>
  [...notifications].sort((a, b) => {
    const unreadDiff = Number(Boolean(a.status_baca)) - Number(Boolean(b.status_baca));

    if (unreadDiff !== 0) return unreadDiff;

    const timeDiff = getNotificationTimestamp(b) - getNotificationTimestamp(a);

    if (timeDiff !== 0) return timeDiff;

    return Number(b.notifikasi_id || 0) - Number(a.notifikasi_id || 0);
  });

const getStoredNotificationScope = () => {
  if (typeof window === "undefined") return "admin";

  return sessionStorage.getItem("nemuipb_notification_scope") || "admin";
};

const NotificationBell = ({ navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [activeNotificationScope, setActiveNotificationScope] = useState(
    getStoredNotificationScope
  );
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const unreadCount = useMemo(
    () => {
      const adminUnread = isAdmin
        ? adminNotifications.reduce(
            (total, item) =>
              total + (isNotificationUnread(item, true) ? item.count || 0 : 0),
            0
          )
        : 0;
      const userUnread = userNotifications.filter((item) => !item.status_baca).length;

      return adminUnread + userUnread;
    },
    [adminNotifications, userNotifications, isAdmin]
  );

  const displayingAdminNotifications = isAdmin && activeNotificationScope === "admin";
  const displayedNotifications = displayingAdminNotifications
    ? adminNotifications
    : userNotifications;
  const displayedUnreadCount = displayingAdminNotifications
    ? adminNotifications.reduce(
        (total, item) =>
          total + (isNotificationUnread(item, true) ? item.count || 0 : 0),
        0
      )
    : userNotifications.filter((item) => !item.status_baca).length;
  const adminPendingCount = adminNotifications.reduce(
    (total, item) => total + (item.count || 0),
    0
  );
  const userUnreadCount = userNotifications.filter((item) => !item.status_baca)
    .length;

  const changeNotificationScope = (scope) => {
    setActiveNotificationScope(scope);
    sessionStorage.setItem("nemuipb_notification_scope", scope);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const adminDataPromise = isAdmin
          ? Promise.all([
              AdminService.getAllReports(),
              AdminService.getPendingClaims(),
            ])
          : Promise.resolve(null);
        const userDataPromise = NotifikasiService.getNotifikasi();
        const [adminData, data] = await Promise.all([
          adminDataPromise,
          userDataPromise,
        ]);

        if (isAdmin && adminData) {
          const [reportsData, claimsData] = adminData;

          const pendingReports = (Array.isArray(reportsData) ? reportsData : [])
            .filter((report) => report.status_verifikasi === "belum_diverifikasi");
          const pendingClaims = Array.isArray(claimsData) ? claimsData : [];
          const lostCount = pendingReports.filter(
            (report) => report.jenis_laporan === "kehilangan"
          ).length;
          const foundCount = pendingReports.filter(
            (report) => report.jenis_laporan === "penemuan"
          ).length;

          const adminNotifications = [
            {
              id: "admin-lost",
              synthetic: true,
              count: lostCount,
              title: "Laporan kehilangan baru",
              message: `${lostCount} laporan kehilangan menunggu verifikasi`,
              icon: "fa-search-minus",
              path: "/admin/verifikasi?view=laporan&type=kehilangan",
            },
            {
              id: "admin-found",
              synthetic: true,
              count: foundCount,
              title: "Laporan penemuan baru",
              message: `${foundCount} laporan penemuan menunggu verifikasi`,
              icon: "fa-search-plus",
              path: "/admin/verifikasi?view=laporan&type=penemuan",
            },
            {
              id: "admin-claims",
              synthetic: true,
              count: pendingClaims.length,
              title: "Klaim barang baru",
              message: `${pendingClaims.length} klaim barang menunggu verifikasi`,
              icon: "fa-handshake",
              path: "/admin/verifikasi?view=klaim",
            },
          ];

          if (isMounted) {
            setAdminNotifications(
              adminNotifications.filter((notification) => notification.count > 0)
            );
          }
        }

        const enrichedNotifications = await Promise.all(
          (Array.isArray(data) ? data : []).map(async (notification) => {
            if (!notification.laporan_id) return notification;

            const detail = await ReportService.getReportDetail(
              notification.laporan_id
            );
            const barang = detail?.barang;

            return {
              ...notification,
              judul_laporan: barang?.nama_barang || `Laporan #${notification.laporan_id}`,
              tanggal_laporan: barang?.tanggal_kejadian || detail?.tanggal_verifikasi,
              tanggal_verifikasi: detail?.tanggal_verifikasi,
              jenis_laporan: detail?.jenis_laporan,
            };
          })
        );

        if (isMounted) {
          setUserNotifications(sortUserNotifications(enrichedNotifications));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setAdminNotifications([]);
          setUserNotifications([]);
          setLoading(false);
        }
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAdmin]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleRead = async (notification) => {
    if (notification.synthetic) {
      setAdminNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readLocally: true }
            : item
        )
      );

      if (notification.path && navigate) {
        navigate(notification.path);
        setIsOpen(false);
      }

      return;
    }

    if (!notification.status_baca) {
      setUserNotifications((current) =>
        sortUserNotifications(
          current.map((item) =>
            item.notifikasi_id === notification.notifikasi_id
              ? { ...item, status_baca: true }
              : item
          )
        )
      );

      try {
        await NotifikasiService.markAsRead(notification.notifikasi_id);
      } catch (error) {
        setUserNotifications((current) =>
          sortUserNotifications(
            current.map((item) =>
              item.notifikasi_id === notification.notifikasi_id
                ? { ...item, status_baca: false }
                : item
            )
          )
        );
      }
    }

    if (notification.laporan_id && navigate) {
      navigate(`/verifikasi?laporan=${notification.laporan_id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative w-11 h-11 rounded-2xl bg-white border border-gray-100 text-[#0B2B5B] hover:bg-blue-50 transition-colors shadow-sm"
        aria-label="Buka notifikasi"
      >
        <i className="far fa-bell text-sm"></i>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 w-[min(360px,calc(100vw-2rem))] bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-slate-900/10 z-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#0B2B5B]">
                Notifikasi
              </h2>
              <p className="text-[11px] text-gray-400">
                {displayedUnreadCount} belum dibaca
              </p>
            </div>

            <i className="fas fa-inbox text-blue-500 text-sm"></i>
          </div>

          {isAdmin && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] rounded-xl p-1">
                {[
                  { value: "admin", label: "Admin" },
                  { value: "user", label: "User" },
                ].map((option) => {
                  const hasPending =
                    option.value === "admin"
                      ? adminPendingCount > 0
                      : userUnreadCount > 0;

                  return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeNotificationScope(option.value)}
                    className={`relative py-2 rounded-lg text-xs font-black transition-colors ${
                      activeNotificationScope === option.value
                        ? "bg-[#002B5B] text-white"
                        : "text-[#002B5B] hover:bg-white"
                    }`}
                  >
                    {option.label}
                    {hasPending && (
                      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#2563EB]"></span>
                    )}
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Memuat notifikasi...
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Belum ada notifikasi.
              </div>
            ) : (
              displayedNotifications.map((notification) => (
                <button
                  key={notification.notifikasi_id || notification.id}
                  type="button"
                  onClick={() => handleRead(notification)}
                  className={`w-full text-left px-5 py-4 border-b border-gray-50 last:border-b-0 hover:bg-blue-50/70 transition-colors ${
                    isNotificationUnread(notification, displayingAdminNotifications)
                      ? "bg-blue-50/60"
                      : "bg-white"
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        isNotificationUnread(notification, displayingAdminNotifications)
                          ? "bg-[#2563EB]"
                          : "bg-gray-200"
                      }`}
                    ></span>

                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold text-[#0B2B5B] leading-relaxed">
                        {notification.synthetic
                          ? notification.title
                          : getUserNotificationTitle(notification)}
                      </span>
                      <span className="block text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {notification.synthetic
                          ? notification.message
                          : getUserNotificationDescription(notification)}
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-1">
                        {notification.synthetic
                          ? notification.count > 0
                            ? "Perlu ditinjau"
                            : "Tidak ada item baru"
                          : `${notification.jenis_laporan ? `${notification.jenis_laporan} - ` : ""}${formatNotificationDate(notification.tanggal_laporan || notification.tanggal_kirim)}`}
                      </span>
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PageHeader = ({
  onToggleSidebar,
  navigate,
  actions = null,
  showProfile = true,
  showAdminModeButton = false,
  profileIcon = "fa-user",
  userName,
  userRole,
}) => {
  const currentUser = AuthService.getCurrentUser();
  const displayName =
    userName || currentUser?.nama || currentUser?.username || "";
  const role = userRole || currentUser?.role;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="text-[#002B5B] hover:bg-gray-100 p-2 rounded-lg transition-colors"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>

        <h1 className="font-extrabold text-[#002B5B] text-xl sm:text-2xl">
          NEMUIPB
        </h1>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:justify-end">
        {showAdminModeButton && role === "admin" && navigate && (
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-200 transition-all"
          >
            <i className="fas fa-user-shield mr-2"></i>
            MODE ADMIN
          </button>
        )}

        {actions}

        <NotificationBell navigate={navigate} />

        {showProfile && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
            {displayName && (
              <span className="text-xs font-bold text-[#002B5B] hidden md:block">
                {displayName}
              </span>
            )}

            <div className="w-8 h-8 bg-[#002B5B]/10 rounded-full flex items-center justify-center">
              <i className={`fas ${profileIcon} text-[#002B5B] text-xs`}></i>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
