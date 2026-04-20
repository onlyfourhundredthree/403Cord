/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// @ts-nocheck
import { Logger } from "@utils/Logger";
import { findBulk,wreq } from "@webpack";

const logger = new Logger("EditImageUploads");

export const utils = {
    /** @param {Record<string, {id: number, filter: () => boolean}>} filters */
    getBulk(filters) {
        let wrongOrMissed = false;
        const result = {};

        for (const name in filters) {
            const exports = wreq(filters[name].id);
            const { id } = filters[name];

            if (exports && filters[name].filter(exports, { id, exports, loaded: true }, `${id}`)) {
                result[name] = exports;
                delete filters[name];
                continue;
            }
            wrongOrMissed = true;
        }

        if (wrongOrMissed) {
            // Convert filters record to array for findBulk
            const filterEntries = Object.entries(filters);
            const missingResults = findBulk(...filterEntries.map(([_, f]) => f.filter));
            filterEntries.forEach(([name, _], i) => {
                result[name] = missingResults[i];
            });
            logger.warn("Mismatched id for modules, searched again.");
        }

        return result;
    },

    /** @param {object} mod @param {Record<string, string>} strs */
    getKeysInModule(mod, strs) {
        let size = Object.keys(strs).length;
        const found = Object.keys(strs).reduce((p, c) => (p[c] = undefined, p), {});

        outer: for (const key in mod) {
            const src = mod[key]?.toString?.();
            if (!src) continue;

            for (const name in strs) {
                const search = strs[name];
                if (!src.includes(search)) continue;

                found[name] = key;
                delete strs[name];
                size--;

                if (size) break;
                else break outer;
            }
        }
        return found;
    },

    /** @param {...string} classNames */
    clsx(...classNames) { return classNames.filter(Boolean).join(" "); },

    StateHistory:
    /** @template T */ class {
            #state;
            #history;
            #pointer;

            /** @param {T} initialState  */
            constructor(initialState) {
                this.#state = initialState;
                this.#history = [initialState];
                this.#pointer = 0;
            }

            get state() { return this.#state; }
            set state(value) {
                if (this.#pointer < this.#history.length - 1) {
                    this.#history = this.#history.slice(0, this.#pointer + 1);
                }
                this.#history.push(value);
                this.#pointer++;
                this.#state = value;
            }

            undo() {
                if (this.#pointer <= 0) return false;

                this.#pointer--;
                this.#state = this.#history[this.#pointer];
                return true;
            }

            redo() {
                if (this.#pointer + 1 >= this.#history.length) return false;

                this.#pointer++;
                this.#state = this.#history[this.#pointer];
                return true;
            }
            get canUndo() { return this.#pointer > 0; }
            get canRedo() { return this.#pointer < this.#history.length - 1; }
        },

    /** @param {number} x @param {number} y */
    atan2(x, y) {
        const angle = Math.round(Math.atan2(y, x) * 180 / Math.PI * 10) / 10;
        return (angle + 360) % 360;
    },

    /** @param {DOMMatrix} M */
    getAngle(M) { return utils.atan2(M.a, M.b); },

    /** @param {DOMMatrix} M */
    getScale(M) { return Math.max(Math.hypot(M.a, M.b), Math.hypot(M.c, M.d)); },

    /** @param {DOMMatrix} M */
    getTranslate(M) { return { x: M.e, y: M.f }; },

    /** @param {number[]} values */
    minAbs(...values) {
        let best = values[0];
        for (let i = 1; i < values.length; i++) {
            if (Math.abs(values[i]) < Math.abs(best)) {
                best = values[i];
            }
        }
        return best;
    },

    /** @param {number[]} values */
    maxAbs(...values) {
        let best = values[0];
        for (let i = 1; i < values.length; i++) {
            if (Math.abs(values[i]) > Math.abs(best)) {
                best = values[i];
            }
        }
        return best;
    },

    /** @param {number} min @param {number} x @param {number} max */
    clamp(min, x, max) { return Math.max(min, Math.min(x, max)); },

    /** @param {number} x @param {{minValue: number, centerValue: number, maxValue: number}} params */
    expScaling(x, { minValue, centerValue, maxValue }) {
        if (x <= 0.5) {
            return Math.exp((1 - 2 * x) * Math.log(minValue) + 2 * x * Math.log(centerValue));
        } else {
            return Math.exp((1 - (2 * x - 1)) * Math.log(centerValue) + (2 * x - 1) * Math.log(maxValue));
        }
    },

    /** @param {number} x @param {{minValue: number, centerValue: number, maxValue: number}} params */
    logScaling(x, { minValue, centerValue, maxValue }) {
        x = utils.clamp(minValue, x, maxValue);
        if (x <= centerValue) {
            const val = (Math.log(x) - Math.log(minValue)) / (Math.log(centerValue) - Math.log(minValue));
            return val / 2 * 100;
        } else {
            const val = (Math.log(x) - Math.log(centerValue)) / (Math.log(maxValue) - Math.log(centerValue));
            return (1 + val) / 2 * 100;
        }
    },

    /** @param {OffscreenCanvasRenderingContext2D} ctx @param {string} text @param {DOMPoint} origin  */
    renderMultilineText(ctx, text, origin) {
        const lines = text.split("\n");
        let height = 0;
        let width = 0;
        for (const line of lines) {
            const textMetrics = ctx.measureText(line);
            const lineheight = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;
            ctx.fillText(line, origin.x, origin.y + height + lineheight / 2);
            height += lineheight;
            width = Math.max(width, ctx.measureText(line).width);
        }
        return [width, height];
    },

    /** @param {DOMPoint} p @param {DOMRect} rect */
    pointInRect(p, rect, padding = 0) {
        return p.x >= rect.left - padding &&
            p.x <= rect.right + padding &&
            p.y >= rect.top - padding &&
            p.y <= rect.bottom + padding;
    },

    /** @param {DOMPoint} p1 @param {DOMPoint} p2 @param {DOMPoint} p3 @param {DOMPoint} p4 */
    lineLine(p1, p2, p3, p4) {
        const uA = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
        const uB = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));

        if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
            return new DOMPoint(p1.x + (uA * (p2.x - p1.x)), p1.y + (uA * (p2.y - p1.y)));
        }
        return null;
    },

    /** @param {DOMPoint} p1 @param {DOMPoint} p2 @param {DOMRect} rect @returns {DOMPoint[]} */
    lineRect(p1, p2, rect, padding = 0) {
        const top = utils.lineLine(p1, p2, new DOMPoint(rect.left - padding, rect.top - padding), new DOMPoint(rect.right + padding, rect.top - padding));
        const right = utils.lineLine(p1, p2, new DOMPoint(rect.right + padding, rect.top - padding), new DOMPoint(rect.right + padding, rect.bottom + padding));
        const bottom = utils.lineLine(p1, p2, new DOMPoint(rect.left - padding, rect.bottom + padding), new DOMPoint(rect.right + padding, rect.bottom + padding));
        const left = utils.lineLine(p1, p2, new DOMPoint(rect.left - padding, rect.top - padding), new DOMPoint(rect.left - padding, rect.bottom + padding));

        return [top, right, bottom, left].filter(Boolean);
    },

    /** @param {DOMPoint} p1 @param {DOMPoint} p2 @param {DOMRect} rect */
    clampLineToRect(p1, p2, rect, padding = 0) {
        const intersects = utils.lineRect(p1, p2, rect, padding);

        switch (intersects.length) {
            case 1: {
                return utils.pointInRect(p1, rect, padding) ? [p1, intersects[0]] : [intersects[0], p2];
            }
            case 2: {
                return intersects.sort((a, b) => {
                    const distA = Math.hypot(a.x - p1.x, a.y - p1.y);
                    const distB = Math.hypot(b.x - p1.x, b.y - p1.y);
                    return distA - distB;
                });
            }
            default: {
                return [p1, p2];
            }
        }
    },

    /** @param {DOMRect} rect1 @param {DOMRect} rect2 */
    rectRect(rect1, rect2) {
        return new DOMRect(
            Math.max(rect1.left, rect2.left),
            Math.max(rect1.top, rect2.top),
            Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
            Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
        );
    },

    /** @param {{onSubmit: () => void, bitmap: ImageBitmap, userActions: React.RefObject<any>}} */
    openEditor({ onSubmit, bitmap, userActions }) {
        const id = internals.nativeUI[internals.keys.openModal]?.(e => {
            const channelId = internals.SelectedChannelStore.getCurrentlySelectedChannelId();

            return jsx(BdApi.Components.ErrorBoundary, null, jsx(internals.ModalSystem[internals.keys.ModalRoot], {
                ...e,
                animation: "subtle",
                size: "dynamic",
                className: `${meta.slug}Root`,
                children: [
                    jsx(internals.ModalSystem[internals.keys.ModalFooter], {
                        className: "modal-footer",
                        children: internals.uploadDispatcher && channelId ? [
                            jsx(internals.ManaButton[internals.keys.ManaButton], {
                                text: "Save",
                                variant: "active",
                                type: "submit",
                                onClick: () => {
                                    onSubmit?.();
                                    internals.nativeUI[internals.keys.closeModal](id);
                                }
                            }),
                            jsx(internals.ManaButton[internals.keys.ManaButton], {
                                text: "Cancel",
                                variant: "secondary",
                                onClick: () => {
                                    internals.nativeUI[internals.keys.closeModal](id);
                                }
                            })
                        ] : jsx("div", {
                            style: { color: "var(--red-430, #d6363f)" },
                            children: "Unable to save. Please use [Ctrl] + [C] instead."
                        })
                    }),
                    jsx(internals.ModalSystem[internals.keys.ModalContent], {
                        className: "image-editor",
                        children: jsx(Components.ImageEditor, {
                            bitmap,
                            ref: userActions,
                        })
                    })
                ]
            }));
        });
    },

    /** @type {{[K in keyof LayerAdjustments]: string}} */
    filterUnits: { opacity: "", blur: "px", brightness: "%", contrast: "%", grayscale: "%", "hue-rotate": "deg", invert: "%", saturate: "%", sepia: "%" },
    paintingColors: ["#000000", 0xffffff, 0xffea00, 0xff9100, 0xff1744, 0xff4081, 0xd500f9, 0x651fff, 0x2979ff, 0x10e5ff, 0x1de9b6, 0x10e676],
    backgroundColors: [0x303038, 0x373038, 0x383032, 0x383530, 0x353830, 0x303832, 0x303738, 0x363649, 0x473649, 0x49363c, 0x494136, 0x414936, 0x36493c, 0x364749],

    paths: {
        Main: "m22.7 14.3l-1 1l-2-2l1-1c.1-.1.2-.2.4-.2c.1 0 .3.1.4.2l1.3 1.3c.1.2.1.5-.1.7M13 19.9V22h2.1l6.1-6.1l-2-2zm-1.79-4.07l-1.96-2.36L6.5 17h6.62l2.54-2.45l-1.7-2.26zM11 19.9v-.85l.05-.05H5V5h14v6.31l2-1.93V5a2 2 0 0 0-2-2H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h6z",
        FlipH: "M1.2656 20.1094 8.7188 4.4531C9.1406 3.6094 10.3594 3.8906 10.3594 4.8281L10.3594 20.4375C10.3594 21.375 9.8906 21.7969 8.9531 21.7969L2.2969 21.7969C1.3594 21.7969.8438 20.9531 1.2656 20.1094ZM22.8281 20.1094 15.375 4.4531C14.9531 3.6094 13.7344 3.8906 13.7344 4.8281L13.7344 20.4375C13.7344 21.375 14.2031 21.7969 15.1406 21.7969L21.7969 21.7969C22.7344 21.7969 23.25 20.9531 22.8281 20.1094Z",
        FlipV: "M20.1094 22.7344 4.4531 15.2812C3.6094 14.8594 3.8906 13.6406 4.8281 13.6406L20.4375 13.6406C21.375 13.6406 21.7969 14.1094 21.7969 15.0469L21.7969 21.7031C21.7969 22.6406 20.9531 23.1563 20.1094 22.7344ZM20.1094 1.1719 4.4531 8.625C3.6094 9.0469 3.8906 10.2656 4.8281 10.2656L20.4375 10.2656C21.375 10.2656 21.7969 9.7969 21.7969 8.8594L21.7969 2.2031C21.7969 1.2656 20.9531.75 20.1094 1.1719Z",
        RotR: "M9.75 7.8516 7.8516 9.75C7.5 10.1016 7.5 10.6641 7.8516 11.0157 8.2032 11.3671 8.7657 11.3671 9.1171 11.0157L12.5625 7.5704C12.9844 7.1484 12.9844 6.7266 12.5625 6.3046L9.1171 2.8594C8.7657 2.5078 8.2032 2.5078 7.8516 2.8594 7.5 3.2109 7.5 3.7734 7.8516 4.125L9.75 6.0234 5.6719 6.0234C3.8438 6.0234 2.4375 7.4296 2.4375 9.2579L2.4375 12.0704C2.4375 12.5625 2.8594 12.9844 3.3516 12.9844 3.8438 12.9844 4.2657 12.5625 4.2657 12.0704L4.2657 9.1875C4.2657 8.4844 4.8984 7.8516 5.6016 7.8516ZM16.0313 21.7969 21.75 21.7969C22.3594 21.7969 23.0625 21.2813 22.6406 20.25L16.4063 5.2969C16.0313 4.2656 14.7656 4.5469 14.7656 5.5781L14.7656 20.3906C14.7656 21.2344 15.1875 21.7969 16.0313 21.7969ZM1.3594 20.3438C.7969 20.7188.8906 21.7969 1.9219 21.7969L12.5625 21.7969C13.3125 21.7969 13.6875 21.2344 13.6875 20.625L13.6875 14.7188C13.6875 14.0625 13.0313 13.4531 12.3281 13.875Z",
        RotL: "M14.25 7.8516 16.1484 9.75C16.5 10.1016 16.5 10.6641 16.1484 11.0157 15.7968 11.3671 15.2343 11.3671 14.8829 11.0157L11.4375 7.5704C11.0156 7.1484 11.0156 6.7266 11.4375 6.3046L14.8829 2.8594C15.2343 2.5078 15.7968 2.5078 16.1484 2.8594 16.5 3.2109 16.5 3.7734 16.1484 4.125L14.25 6.0234 18.3281 6.0234C20.1562 6.0234 21.5625 7.4296 21.5625 9.2579L21.5625 12.0704C21.5625 12.5625 21.1406 12.9844 20.6484 12.9844 20.1562 12.9844 19.7343 12.5625 19.7343 12.0704L19.7343 9.1875C19.7343 8.4844 19.1016 7.8516 18.3984 7.8516ZM7.9687 21.7969 2.25 21.7969C1.6406 21.7969.9375 21.2813 1.3594 20.25L7.5937 5.2969C7.9687 4.2656 9.2344 4.5469 9.2344 5.5781L9.2344 20.3906C9.2344 21.2344 8.8125 21.7969 7.9687 21.7969ZM22.6406 20.3438C23.2031 20.7188 23.1094 21.7969 22.0781 21.7969L11.4375 21.7969C10.6875 21.7969 10.3125 21.2344 10.3125 20.625L10.3125 14.7188C10.3125 14.0625 10.9687 13.4531 11.6719 13.875Z",
        Undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8",
        Redo: "M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7z",
        Select: "M7 21v-2h2v2zM3 5V3h2v2zm4 0V3h2v2zm4 16v-2h2v2zm0-16V3h2v2zm4 0V3h2v2zm0 16v-2h2v2zm4-16V3h2v2zM3 21v-2h2v2zm0-4v-2h2v2zm0-4v-2h2v2zm0-4V7h2v2zm16 12v-2h2v2zm0-4v-2h2v2zm0-4v-2h2v2zm0-4V7h2v2z",
        Crop: "M17 15h2V7c0-1.1-.9-2-2-2H9v2h8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2z",
        Cut: "m16.9 18.3-4.9-4.9-1.645 1.645q.14.2625.1925.56T10.6 16.2q0 1.155-.8225 1.9775T7.8 19t-1.9775-.8225T5 16.2t.8225-1.9775T7.8 13.4q.2975 0 .595.0525t.56.1925L10.6 12 8.955 10.355q-.2625.14-.56.1925T7.8 10.6q-1.155 0-1.9775-.8225T5 7.8t.8225-1.9775T7.8 5t1.9775.8225T10.6 7.8q0 .2975-.0525.595t-.1925.56L19 17.6v.7zm-2.8-7-1.4-1.4 4.2-4.2H19v.7zM7.8 9.2q.5775 0 .9891-.4109T9.2 7.8t-.4109-.9884T7.8 6.4t-.9884.4116T6.4 7.8t.4116.9891T7.8 9.2m4.2 3.15q.14 0 .245-.105t.105-.245-.105-.245-.245-.105-.245.105-.105.245.105.245.245.105M7.8 17.6q.5775 0 .9891-.4109T9.2 16.2t-.4109-.9884T7.8 14.8t-.9884.4116T6.4 16.2t.4116.9891T7.8 17.6ZM1 23v-6h2v4h4v2zm16 0v-2h4v-4h2v6zM1 7V1h6v2H3v4zM21 7V3h-4V1h6v6Z",
        Rotate: "M10.217 19.339C6.62 17.623 4.046 14.136 3.65 10H2c.561 6.776 6.226 12.1 13.145 12.1.253 0 .484-.022.726-.033L11.68 17.865ZM8.855 1.9c-.253 0-.484.022-.726.044L12.32 6.135l1.463-1.463C17.38 6.377 19.954 9.864 20.35 14H22C21.439 7.224 15.774 1.9 8.855 1.9Z",
        Draw: "M4 21v-4.25L17.175 3.6q.3-.3.675-.45T18.6 3q.4 0 .763.15T20 3.6L21.4 5q.3.275.45.638T22 6.4q0 .375-.15.75t-.45.675L8.25 21zm2-2h1.4l9.825-9.8l-.7-.725l-.725-.7L6 17.6zM20 6.425L18.575 5zm-3.475 2.05l-.725-.7L17.225 9.2zM14 21q1.85 0 3.425-.925T19 17.5q0-.9-.475-1.55t-1.275-1.125L15.775 16.3q.575.25.9.55t.325.65q0 .575-.913 1.038T14 19q-.425 0-.712.288T13 20t.288.713T14 21m-9.425-7.65l1.5-1.5q-.5-.2-.788-.412T5 11q0-.3.45-.6t1.9-.925q2.2-.95 2.925-1.725T11 6q0-1.375-1.1-2.187T7 3q-1.125 0-2.013.4t-1.362.975Q3.35 4.7 3.4 5.1t.375.65q.325.275.725.225t.675-.325q.35-.35.775-.5T7 5q1.025 0 1.513.3T9 6q0 .35-.437.637T6.55 7.65q-2 .875-2.775 1.588T3 11q0 .8.425 1.363t1.15.987",
        Eraser: "m16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.01 4.01 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53l-4.95-4.95z",
        Text: "m18.5 4l1.16 4.35l-.96.26c-.45-.87-.91-1.74-1.44-2.18C16.73 6 16.11 6 15.5 6H13v10.5c0 .5 0 1 .33 1.25c.34.25 1 .25 1.67.25v1H9v-1c.67 0 1.33 0 1.67-.25c.33-.25.33-.75.33-1.25V6H8.5c-.61 0-1.23 0-1.76.43c-.53.44-.99 1.31-1.44 2.18l-.96-.26L5.5 4z",
        LockOpen: "M6 20h12V10H6zm6-3q.825 0 1.413-.587T14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17m-6 3V10zm0 2q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h7V6q0-2.075 1.463-3.537T18 1q1.775 0 3.1 1.075t1.75 2.7q.125.425-.162.825T22 6q-.425 0-.7-.175t-.4-.575q-.275-.95-1.062-1.6T18 3q-1.25 0-2.125.875T15 6v2h3q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22z",
        Lock: "M12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2m5 3c.55 0 1-.45 1-1V11c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1H17M9 8h6V6c0-1.66-1.34-3-3-3S9 4.34 9 6Zm9 0c1.1 0 2 .9 2 2V20c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2H7V6c0-2.76 2.24-5 5-5s5 2.24 5 5V8h1",
        Pan: "M23 12 18.886 7.864v2.772h-5.5v-5.5h2.75L12 1 7.886 5.136h2.75v5.5H5.092V7.886L1 12l4.136 4.136v-2.75h5.5v5.5H7.886L12 23l4.136-4.114h-2.75v-5.5h5.5v2.75L23 12Z",
        Scale: "M16 3a1 1 0 100 2h1.586L11 11.586V10A1 1 0 009 10v3.75c0 .69.56 1.25 1.25 1.25H14a1 1 0 100-2H12.414L19 6.414V8a1 1 0 102 0V4.25C21 3.56 20.44 3 19.75 3ZM5 3l-.15.005A2 2 0 003 5V19l.005.15A2 2 0 005 21H19l.15-.005A2 2 0 0021 19V13l-.007-.117A1 1 0 0019 13v6H5V5h6l.117-.007A1 1 0 0011 3Z",
        ResetTransform: "M8 9H4q-.425 0-.712-.288T3 8V4q0-.425.288-.712T4 3t.713.288T5 4v2.35Q6.25 4.8 8.063 3.9T12 3q2.475 0 4.488 1.2T19.7 7.35q.2.35.113.75t-.438.6-.763.113T18 8.375q-.925-1.525-2.5-2.45T12 5q-1.425 0-2.687.525T7.1 7H8q.425 0 .713.288T9 8t-.288.713T8 9 M18.94 16.002 11.976 12.143 5.059 15.965l6.964 3.89Zm2.544-.877a1 1 0 01.002 1.749l-8.978 5a1 1 0 01-.973-.001l-9.022-5.04a1 1 0 01.003-1.749l8.978-4.96a1 1 0 01.968.001l9.022 5z",
        ResetFilters: "M13.75 14.25h2.5q.325 0 .538.213T17 15t-.213.538-.537.212h-2.5q-.325 0-.537-.213T13 15t.213-.537.537-.213m.75 6v-.5h-.75q-.325 0-.537-.213T13 19t.213-.537.537-.213h.75v-.5q0-.325.213-.537T15.25 17t.538.213.212.537v2.5q0 .325-.213.538T15.25 21t-.537-.213-.213-.537m3.25-2h2.5q.325 0 .538.213T21 19t-.213.538-.537.212h-2.5q-.325 0-.537-.213T17 19t.213-.537.537-.213m.25-2v-2.5q0-.325.213-.537T18.75 13t.538.213.212.537v.5h.75q.325 0 .538.213T21 15t-.213.538-.537.212h-.75v.5q0 .325-.213.538T18.75 17t-.537-.213T18 16.25M12 5Q9.075 5 7.038 7.038T5 12q0 1.8.813 3.3T8 17.75V16q0-.425.288-.712T9 15t.713.288T10 16v4q0 .425-.288.713T9 21H5q-.425 0-.712-.288T4 20t.288-.712T5 19h1.35Q4.8 17.75 3.9 15.938T3 12q0-1.875.713-3.512t1.924-2.85 2.85-1.925T12 3q2.825 0 5.088 1.575t3.262 4.05q.15.4 0 .775t-.55.525-.788 0-.537-.55q-.775-1.95-2.513-3.162T12 5",
        AddLayer: "M18.94 12.002 11.976 8.143 5.059 11.965l6.964 3.89Zm2.544-.877a1 1 0 01.002 1.749l-8.978 5a1 1 0 01-.973-.001l-9.022-5.04a1 1 0 01.003-1.749l8.978-4.96a1 1 0 01.968.001l9.022 5zM12 22a1 1 0 00.485-.126l9-5-.971-1.748L12 19.856l-8.515-4.73-.971 1.748 9 5A1 1 0 0012 22m8-22h-2v3h-3v2h3v3h2V5h3V3h-3z",
        DuplicateLayer: "M14 16h-3v-2h3v-3h2v3h3v2h-3v3h-2zM20.5 9.5h-11v11h11zM20.5 7.5a2 2 0 012 2v11a2 2 0 01-2 2h-11a2 2 0 01-2-2v-11a2 2 0 012-2h11M3.5 14.5h3v2h-3a2 2 0 01-2-2v-11a2 2 0 012-2h11a2 2 0 012 2v3h-2v-3h-11z",
        CopyLayer: "M21.73 12H19A3 3 0 0116 9V6.27a3 3 0 01.88.61l4.25 4.24a3 3 0 01.6.88ZM6 18V10a4 4 0 014-4h4V9a5 5 0 005 5h3v4a4 4 0 01-4 4H10A4 4 0 016 18ZM3 16h.5a.5.5 0 00.5-.5V10a6 6 0 016-6h5.5a.5.5 0 00.5-.5V3A1 1 0 0015 2H10A8 8 0 002 10v5a1 1 0 001 1Z",
        DeleteLayer: "M5.06 11.965l6.964 3.89 6.917-3.853-6.964-3.859Zm-2.547.868a1 1 0 01.003-1.749l8.978-4.96a1 1 0 01.968.001l9.022 5a1 1 0 01.002 1.749l-8.978 5a1 1 0 01-.973-.001l-9.022-5.04M15 5h8V3H15ZM12 19.856l8.514-4.73.971 1.748-9 5a1 1 0 01-.971 0l-9-5 .971-1.748Z",
        MoveLayerUp: "M10 11l-7.484 4.084a1 1 0 000 1.75l9 5a1 1 0 001 0l9-5a1 1 0 000-1.75L14 11v2.235L19 16l-7 3.855L5 16l5-2.765Zm3-7.8284 3.4142 3.4142A1 1 0 0115 8L13 6v9.5a1 1 0 01-2 0V6L9 8A1 1 0 017.5858 6.5858L11 3.1716a1.4142 1.4142 0 012 0",
        MoveLayerDown: "M14 13l7.484-4.084a1 1 90 000-1.75l-9-5a1 1 90 00-1 0l-9 5a1 1 90 000 1.75L10 13v-2.235L5 8l7-3.855L19 8l-5 2.765Zm-3 7.8284-3.4142-3.4142A1 1 90 019 16l2 2V8.5a1 1 90 012 0V18l2-2a1 1 90 011.4142 1.4142L13 20.8284a1.4142 1.4142 90 01-2 0",
        Visibility: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5m0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3",
        VisibilityOff: "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7M2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2m4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3z",
        Settings: "M12 15.6c1.98 0 3.6-1.62 3.6-3.6S13.98 8.4 12 8.4 8.4 10.02 8.4 12s1.62 3.6 3.6 3.6m9.15-1.08c.19.14.24.39.12.61l-1.92 3.32c-.12.22-.37.3-.59.22l-2.39-.96c-.49.38-1.03.7-1.62.94l-.36 2.54c-.03.24-.23.41-.47.41H10.08c-.24 0-.43-.17-.48-.41l-.36-2.54c-.59-.24-1.12-.56-1.62-.94l-2.39.96c-.22.07-.47 0-.59-.22L2.72 15.13c-.11-.2-.06-.47.12-.61l2.03-1.58c-.05-.3-.07-.63-.07-.94s.04-.64.09-.94L2.86 9.48c-.2-.14-.24-.4-.12-.61L4.65 5.55c.12-.22.37-.3.59-.22l2.39.96c.49-.37 1.03-.7 1.62-.94l.36-2.54c.04-.24.23-.41.47-.41h3.84c.24 0 .44.17.48.41l.36 2.54c.59.24 1.12.56 1.62.94l2.39-.96c.22-.07.47 0 .59.22l1.92 3.32c.11.2.06.47-.12.61l-2.03 1.58c.05.3.07.62.07.94 0 .33-.02.64-.06.94Z",
    },
};
