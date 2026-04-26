import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`toggle-track ${isDark ? 'dark' : 'light'}`}>
        <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon size={14} className="toggle-icon" />
          ) : (
            <Sun size={14} className="toggle-icon" />
          )}
        </div>
      </div>
    </button>
  );
}

export default ThemeToggle;
