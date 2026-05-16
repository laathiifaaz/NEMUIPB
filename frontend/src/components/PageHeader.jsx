import React from "react";
import AuthService from "../services/AuthService";

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

        {showProfile && (
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
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
