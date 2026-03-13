import { useEffect, useState } from 'react';

const THEME_KEY = 'chm_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.setAttribute('data-bs-theme', theme);
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  return { theme, toggleTheme };
};

export default useTheme;