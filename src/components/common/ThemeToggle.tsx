import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-200 focus:outline-none hover:scale-105 active:scale-95"
            style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(23, 50, 77, 0.06)',
                color: isDark ? '#D8B878' : '#17324D',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(23, 50, 77, 0.15)',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme Mode"
        >
            {isDark ? (
                // Sun Icon (Switch to Light)
                <svg className="w-4 h-4 text-[#D8B878]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon (Switch to Dark)
                <svg className="w-4 h-4 text-[#17324D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
