import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

/**
 * useStaggerReveal — Anime.js-powered hook that staggers child elements into view.
 * Apply the returned ref to a container, and children with the `selector` class
 * will animate in one-by-one with a smooth fade + slide effect.
 */
export function useStaggerReveal(selector = '.animate-item', deps = [], options = {}) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let animation;

        // Small delay to let React commit the DOM updates before selecting
        const timeout = setTimeout(() => {
            if (!containerRef.current) return;
            const targets = containerRef.current.querySelectorAll(selector);
            if (targets.length === 0) return;

            // Reset initial state safely
            targets.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px) scale(0.97)';
            });

            animation = anime({
                targets,
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.97, 1],
                delay: anime.stagger(options.staggerDelay || 60, { start: options.startDelay || 100 }),
                duration: options.duration || 500,
                easing: options.easing || 'easeOutCubic',
            });
        }, 50);

        return () => {
            clearTimeout(timeout);
            if (animation) animation.pause();
        };
    }, deps);

    return containerRef;
}

/**
 * useCountUp — Anime.js-powered counter animation for dashboard stat numbers.
 */
export function useCountUp(targetValue, isLoading, duration = 1200) {
    const elRef = useRef(null);

    useEffect(() => {
        if (isLoading || !elRef.current || targetValue === undefined || targetValue === null) return;

        const obj = { value: 0 };
        const animation = anime({
            targets: obj,
            value: targetValue,
            round: 1,
            duration,
            easing: 'easeOutExpo',
            update: () => {
                if (elRef.current) {
                    elRef.current.textContent = obj.value;
                }
            }
        });

        return () => animation.pause();
    }, [targetValue, isLoading]);

    return elRef;
}

/**
 * useModalReveal — Anime.js-powered modal entrance animation.
 */
export function useModalReveal(isOpen) {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        // Reset before animating
        modalRef.current.style.opacity = '0';
        modalRef.current.style.transform = 'scale(0.9)';

        const animation = anime({
            targets: modalRef.current,
            opacity: [0, 1],
            scale: [0.9, 1],
            duration: 350,
            easing: 'easeOutBack',
        });

        return () => animation.pause();
    }, [isOpen]);

    return modalRef;
}
