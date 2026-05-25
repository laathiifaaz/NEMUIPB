import React from "react";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import PageFooter from "./PageFooter";

const UserPageLayout = ({
  children,
  currentPath,
  isSidebarExpanded,
  onToggleSidebar,
  onLogout,
  navigate,
  userRole,
  userName,
  showAdminModeButton = true,
  backgroundClass = "bg-[#F8FAFC]",
  mainClassName = "",
  footerClassName,
}) => (
  <div className={`flex min-h-screen ${backgroundClass} font-['Plus_Jakarta_Sans']`}>
    <Sidebar
      expanded={isSidebarExpanded}
      currentPath={currentPath}
      handleLogout={onLogout}
      navigate={navigate}
    />

    <main
      className={`
        flex-1 px-6 md:px-12 py-8 overflow-y-auto
        transition-[margin] duration-300
        ${isSidebarExpanded ? "ml-64" : "ml-16"}
        ${mainClassName}
      `}
    >
      <PageHeader
        onToggleSidebar={onToggleSidebar}
        navigate={navigate}
        showAdminModeButton={showAdminModeButton}
        userRole={userRole}
        userName={userName}
      />

      {children}

      <PageFooter className={footerClassName} />
    </main>
  </div>
);

export default UserPageLayout;
