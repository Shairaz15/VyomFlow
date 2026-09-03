import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <label
            className={`theme-switch ${className}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme Mode"
        >
            <input
                type="checkbox"
                className="theme-switch__checkbox"
                checked={isDark}
                onChange={toggleTheme}
            />
            <div className="theme-switch__container">
                <div className="theme-switch__clouds" />
                <div className="theme-switch__stars-container">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M138.5 25.5C138.5 25.5 137.5 24 136 24C134.5 24 133.5 25.5 133.5 25.5C133.5 25.5 132.5 24 131 24C129.5 24 128.5 25.5 128.5 25.5C128.5 25.5 129.5 27 131 27C132.5 27 133.5 25.5 133.5 25.5C133.5 25.5 134.5 27 136 27C137.5 27 138.5 25.5 138.5 25.5ZM107.5 8.5C107.5 8.5 106.5 7 105 7C103.5 7 102.5 8.5 102.5 8.5C102.5 8.5 101.5 7 100 7C98.5 7 97.5 8.5 97.5 8.5C97.5 8.5 98.5 10 100 10C101.5 10 102.5 8.5 102.5 8.5C102.5 8.5 103.5 10 105 10C106.5 10 107.5 8.5 107.5 8.5ZM72.5 12.5C72.5 12.5 71.5 11 70 11C68.5 11 67.5 12.5 67.5 12.5C67.5 12.5 66.5 11 65 11C63.5 11 62.5 12.5 62.5 12.5C62.5 12.5 63.5 14 65 14C66.5 14 67.5 12.5 67.5 12.5C67.5 12.5 68.5 14 70 14C71.5 14 72.5 12.5 72.5 12.5ZM116.5 39.5C116.5 39.5 115.5 38 114 38C112.5 38 111.5 39.5 111.5 39.5C111.5 39.5 110.5 38 109 38C107.5 38 106.5 39.5 106.5 39.5C106.5 39.5 107.5 41 109 41C110.5 41 111.5 39.5 111.5 39.5C111.5 39.5 112.5 41 114 41C115.5 41 116.5 39.5 116.5 39.5ZM47.5 28.5C47.5 28.5 46.5 27 45 27C43.5 27 42.5 28.5 42.5 28.5C42.5 28.5 41.5 27 40 27C38.5 27 37.5 28.5 37.5 28.5C37.5 28.5 38.5 30 40 30C41.5 30 42.5 28.5 42.5 28.5C42.5 28.5 43.5 30 45 30C46.5 30 47.5 28.5 47.5 28.5ZM17.5 19.5C17.5 19.5 16.5 18 15 18C13.5 18 12.5 19.5 12.5 19.5C12.5 19.5 11.5 18 10 18C8.5 18 7.5 19.5 7.5 19.5C7.5 19.5 8.5 21 10 21C11.5 21 12.5 19.5 12.5 19.5C12.5 19.5 13.5 21 15 21C16.5 21 17.5 19.5 17.5 19.5Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
                <div className="theme-switch__circle-container">
                    <div className="theme-switch__sun-moon-container">
                        <div className="theme-switch__moon">
                            <div className="theme-switch__spot" />
                            <div className="theme-switch__spot" />
                            <div className="theme-switch__spot" />
                        </div>
                    </div>
                </div>
            </div>
        </label>
    );
}
