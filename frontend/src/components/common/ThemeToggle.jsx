
import { useTheme } from '../../hooks/useTheme';

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="theme-toggle-icon">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 1.75v3M12 19.25v3M4.75 12h-3M22.25 12h-3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="theme-toggle-icon">
      <path
        d="M14.9 2.35a1 1 0 0 1 1.17 1.3 8.45 8.45 0 1 0 4.28 10.56 1 1 0 0 1 1.84-.1 1.58 1.58 0 0 1 .06.97A10.45 10.45 0 1 1 13.92 1.8a1.56 1.56 0 0 1 .98.05Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLightTheme = theme === 'light';

  return (
    <button
      type="button"
      className="btn theme-toggle"
      onClick={toggleTheme}
      aria-label={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLightTheme ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLightTheme ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}