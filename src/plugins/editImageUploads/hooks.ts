/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// @ts-nocheck
import { React } from "@webpack/common";
const { useState, useEffect, useCallback, useRef } = React;
const Data = { load: () => null, save: () => { } };
const meta = { slug: "EditImageUploads" };

export const hooks = {
    /**
     * @template T
     * @param {T | (() => T)} initialvalue
     * @param {string} key
     * @returns {[T, typeof setval]}
     */
    useStoredState(key, initialvalue) {
        const [val, setval] = useState(() => {
            /** @type {T | null} */
            const stored = Data.load(meta.slug, key);
            if (stored == null) {
                if (initialvalue instanceof Function) {
                    return initialvalue();
                } else {
                    return initialvalue;
                }
            } else {
                return stored;
            }
        });

        useEffect(() => {
            Data.save(meta.slug, key, val);
        }, [val, key]);

        return [val, setval];
    },

    /**
     * @param {{
     *  buttons?: number,
     *  onStart?: (e: Omit<React.PointerEvent, "currentTarget">, store: Record<string, any>) => void,
     *  onChange?:(e: Omit<React.PointerEvent, "currentTarget">, store: Record<string, any>) => void,
     *  onSubmit?: (e: Omit<React.PointerEvent, "currentTarget">, store: Record<string, any>) => void
     * }} props
     */
    usePointerCapture({ onStart, onChange, onSubmit, buttons = 5 }) {
        /** @type {React.RefObject<number?>} */
        const pointerId = useRef(null);
        /** @type {React.RefObject<number?>} */
        const rafId = useRef(null);
        const smolStore = useRef({});

        /** @type {(e: React.PointerEvent<HTMLElement>) => void} */
        const onPointerDown = useCallback(e => {
            if (!(e.buttons & buttons) || pointerId.current != null) return;

            e.currentTarget.setPointerCapture(e.pointerId);
            e.preventDefault();
            pointerId.current = e.pointerId;
            onStart?.(e, smolStore.current);
        }, [onStart]);

        /** @type {(e: React.PointerEvent<HTMLElement>) => void} */
        const onPointerMove = useCallback(e => {
            if (!(e.buttons & buttons) || pointerId.current !== e.pointerId || rafId.current) return;

            rafId.current = requestAnimationFrame(() => {
                onChange?.(e, smolStore.current);
                rafId.current = null;
            });
        }, [onChange]);

        /** @type {(e: React.PointerEvent<HTMLElement>) => void} */
        const onPointerUp = useCallback(e => {
            if (pointerId.current !== e.pointerId) return;

            e.preventDefault();
            e.currentTarget.releasePointerCapture(e.pointerId);
            pointerId.current = null;
            rafId.current && cancelAnimationFrame(rafId.current);
            rafId.current = null;
            onSubmit?.(e, smolStore.current);
            smolStore.current = {};
        }, [onSubmit]);

        return {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onLostPointerCapture: onPointerUp,
        };
    },

    /**
     * @param {{
     *  onStart?: (e: React.WheelEvent<HTMLCanvasElement>, store: Record<string, any>) => void,
     *  onChange?: (e: React.WheelEvent<HTMLCanvasElement>, store: Record<string, any>) => void,
     *  onSubmit?: (e: React.WheelEvent<HTMLCanvasElement>, store: Record<string, any>) => void,
     *  wait?: number,
     * }} params
     */
    useDebouncedWheel({ onStart, onChange, onSubmit, wait = 250 }) {
        /** @type {React.RefObject<number?>} */
        const timer = useRef(null);

        /** @type {(e: React.WheelEvent<HTMLCanvasElement>) => void} */
        const onWheel = useCallback(e => {
            if (!e.deltaY) return;

            onChange?.(e);

            timer.current && clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                onSubmit?.(e);
                timer.current = null;
            }, wait);

        }, [onStart, onChange, onSubmit, wait]);

        return onWheel;
    }
};
