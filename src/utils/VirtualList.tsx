/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
}

/**
 * Virtual scrolling list component for large datasets
 * Only renders visible items for better performance
 */
export function VirtualList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 3,
    className
}: VirtualListProps<T>) {
    const [scrollTop, setScrollTop] = React.useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = React.useMemo(() => {
        const result: Array<{ item: T; index: number; style: React.CSSProperties }> = [];
        for (let i = startIndex; i <= endIndex; i++) {
            result.push({
                item: items[i],
                index: i,
                style: {
                    position: "absolute" as const,
                    top: i * itemHeight,
                    width: "100%",
                    height: itemHeight
                }
            });
        }
        return result;
    }, [items, startIndex, endIndex, itemHeight]);

    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const totalHeight = items.length * itemHeight;

    return (
        <div
            className={className}
            style={{
                height: containerHeight,
                overflow: "auto",
                position: "relative"
            }}
            onScroll={handleScroll}
        >
            <div
                style={{
                    height: totalHeight,
                    position: "relative"
                }}
            >
                {visibleItems.map(({ item, index, style }) => (
                    <div key={index} style={style}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Simplified virtual list hook for custom implementations
 */
export function useVirtualList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    scrollTop: number,
    overscan =3
) {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return React.useMemo(() => {
        const visibleItems: Array<{ item: T; index: number; offsetTop: number }> = [];
        for (let i = startIndex; i <= endIndex; i++) {
            visibleItems.push({
                item: items[i],
                index: i,
                offsetTop: i * itemHeight
            });
        }
        return {
            visibleItems,
            startIndex,
            endIndex,
            totalHeight: items.length * itemHeight
        };
    }, [items, itemHeight, startIndex, endIndex]);
}
