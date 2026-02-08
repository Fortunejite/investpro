import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
};

const ThemeSwitch = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);

  // Sync DOM class with React state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-muted hover:bg-accent transition-colors"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-4 h-4 text-warning" />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
};

export default ThemeSwitch;