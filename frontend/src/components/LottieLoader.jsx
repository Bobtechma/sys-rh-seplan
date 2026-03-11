import React from 'react';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';

/**
 * LottieLoader — Replaces the generic SVG spinner with a smooth Lottie animation.
 * Supports sizes: sm (32px), md (64px), lg (96px), xl (128px), full (200px).
 */
const LottieLoader = ({ size = 'md', text, className = '' }) => {
    const sizes = { sm: 32, md: 64, lg: 96, xl: 128, full: 200 };
    const px = sizes[size] || sizes.md;

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Lottie
                animationData={loaderAnimation}
                loop
                autoplay
                style={{ width: px, height: px }}
            />
            {text && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

/**
 * LottieOverlay — Full overlay with dimmed background and centered Lottie animation.
 * Use this when a page or section is fully loading.
 */
export const LottieOverlay = ({ text = 'Carregando...' }) => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <LottieLoader size="lg" text={text} />
    </div>
);

export default LottieLoader;
