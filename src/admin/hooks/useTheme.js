import { useState, useEffect } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("adminTheme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("adminTheme", isDark ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-admin-theme",
      isDark ? "dark" : "light",
    );
  }, [isDark]);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  return { isDark, toggleTheme };
}
