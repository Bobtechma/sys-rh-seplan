import React from 'react';
import LottieLoader, { LottieOverlay } from './LottieLoader';

/**
 * Spinner — Now wraps the LottieLoader for backward compatibility.
 * Existing code that imports Spinner will automatically get the Lottie animation.
 */
const Spinner = ({ size = 'md', className = '' }) => {
    // Map old sizes to LottieLoader sizes
    const sizeMap = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' };
    return <LottieLoader size={sizeMap[size] || 'md'} className={className} />;
};

export const LoadingOverlay = ({ text = 'Carregando...' }) => (
    <LottieOverlay text={text} />
);

export default Spinner;
