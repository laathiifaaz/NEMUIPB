const SIDEBAR_STATE_KEY = "nemuipb_sidebar_expanded";

export const getStoredSidebarExpanded = () => {
  try {
    return localStorage.getItem(SIDEBAR_STATE_KEY) === "true";
  } catch (error) {
    return false;
  }
};

export const setStoredSidebarExpanded = (expanded) => {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, expanded ? "true" : "false");
  } catch (error) {
    // Ignore storage failures so sidebar toggling still works in memory.
  }
};
