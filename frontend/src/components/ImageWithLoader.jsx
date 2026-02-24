import React, { useState } from 'react';
import { Skeleton } from './Skeleton';

export const ImageWithLoader = ({ src, alt, className, ...props }) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {!loaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
                src={src}
                alt={alt}
                className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} w-full h-full object-cover`}
                onLoad={() => setLoaded(true)}
                {...props}
            />
        </div>
    );
};
