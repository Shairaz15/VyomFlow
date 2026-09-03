import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none hover:scale-105 active:scale-95 ${
                isDark 
                    ? 'bg-[#17324D]/10 hover:bg-[#17324D]/20 border border-[#17324D]/20 text-[#17324D]' 
                    : 'bg-white/15 hover:bg-white/25 border border-white/25 text-[#F7F4EC]'
            } ${className}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme Mode"
        >
            {isDark ? (
                // Sun Icon (Switch to Light - sharp dark navy/gold)
                <svg className="w-4 h-4 text-[#17324D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon (Switch to Dark - sharp bright ivory/gold)
                <svg className="w-4 h-4 text-[#F7F4EC]" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}

