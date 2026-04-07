/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
    threshold?: number;
}

/**
 * Lazy loading image component with Intersection Observer
 * Falls back to native lazy loading if IntersectionObserver is not available
 */
export function LazyImage({
    src,
    fallback,
    threshold = 0.1,
    className,
    style,
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
        const img = imgRef.current;
        if (!img) return;

        // Use native lazy loading as fallback
        if ("loading" in HTMLImageElement.prototype) {
            return;
        }

        // Use Intersection Observer for browsers that don't support native lazy loading
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target as HTMLImageElement;
                        if (target.dataset.src) {
                            target.src = target.dataset.src;
                            observer.unobserve(target);
                        }
                    }
                });
            },
            { threshold }
        );

        if (img.dataset.src) {
            observer.observe(img);
        }

        return () => observer.disconnect();
    }, [threshold]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
        if (fallback && imgRef.current) {
            imgRef.current.src = fallback;
        }
    };

    return (
        <img
            ref={imgRef}
            src={src}
            className={className}
            style={{
                ...style,
                opacity: isLoaded ? 1 : 0,
                transition: "opacity 0.15s ease-out"
            }}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            {...props}
        />
    );
}

/**
 * Preload an image and return a promise
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Batch preload images with concurrency limit
 */
export async function preloadImages(
    urls: string[],
    concurrency = 3
): Promise<HTMLImageElement[]> {
    const results: HTMLImageElement[] = [];

    for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(url => preloadImage(url)));
        results.push(...batchResults);
    }

    return results;
}
