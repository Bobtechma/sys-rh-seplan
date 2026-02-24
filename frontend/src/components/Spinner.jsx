import React from 'react';

const Spinner = ({ size = 'md', className = '', color = 'text-primary' }) => {
    const sizes = { sm: 'size-4', md: 'size-8', lg: 'size-12', xl: 'size-16' };

    return (
        <svg
            className={`animate-spin ${color} ${sizes[size] || sizes.md} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
};

export const LoadingOverlay = ({ text = 'Carregando...' }) => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <Spinner size="lg" />
        {text && <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{text}</p>}
    </div>
);

export default Spinner;
