import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Check local storage first, default to 'light'
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;

        // Explicitly default to light as requested, ignoring system preference for initial load
        // if user hasn't set a preference yet.
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old classes to ensure clean state
        root.classList.remove('light', 'dark');

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
