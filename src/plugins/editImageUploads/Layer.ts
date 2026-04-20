/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { utils } from "./utils";

// @ts-nocheck
    export class Layer {
        #img;
        #canvas;
        #state;
        #previewTransform;
        #subPixelCorrection;
        #filter;

        /** @param {ImageBitmap | {width: number, height: number}} bitmap @param {string} name */
        constructor(name, bitmap) {
            this.name = name;
            this.id = Date.now() + Math.random();
            this.#canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            this.#canvas.getContext("2d").imageSmoothingEnabled = false;

            this.#subPixelCorrection = { x: 0, y: 0 };
            this.#state = {
                transform: new DOMMatrix(),
                isVisible: true,
                /** @type {LayerAdjustments} */
                adjustments: {},
                /**
                 * @type {{
                 *  color: string, width?: number, clipPath: Path2D, globalCompositeOperation: string,
                 *  path2D?: Path2D, text?: string, font?: string, origin?: DOMPoint, transform: DOMMatrix
                 * }[]}
                 */
                strokes: [],
            };
            this.#filter = "none";
            this.#previewTransform = new DOMMatrix();
            this.staleThumbnail = true;
            if (bitmap instanceof ImageBitmap) {
                this.#img = bitmap;
                this.#drawImage();
            }
        }

        get filter() { return this.#filter; }
        get width() { return this.#canvas.width; }
        get height() { return this.#canvas.height; }
        get state() { return this.#state; }
        get previewTransform() { return this.#previewTransform.multiply(this.#state.transform); }

        set state(state) {
            if (this.#state.strokes.length < state.strokes.length) {
                // adding strokes
                for (let i = this.#state.strokes.length; i < state.strokes.length; i++) {
                    this.drawStroke(state.strokes[i]);
                }
            } else if (this.#state.strokes.length > state.strokes.length) {
                // removing strokes
                this.#drawImage();
                this.#drawStrokes(state.strokes);
            }
            if (this.#state.adjustments !== state.adjustments) {
                this.#filter = Object.entries(state.adjustments).reduce((acc, [key, value]) => value != null ? `${acc} ${key}(${value}${utils.filterUnits[key] ?? ""})` : acc, "") || "none";
            }
            if (state !== this.#state) { this.staleThumbnail = true; }
            this.#state = state;
        }

        toBitmap() { return createImageBitmap(this.#canvas); }

        /** @param {DOMMatrix} dM */
        previewTransformBy(dM) { this.#previewTransform.preMultiplySelf(dM); }
        /** @param {DOMMatrix} M */
        previewTransformTo(M) { this.#previewTransform = M; }

        finalizePreview() {
            if (this.#previewTransform.isIdentity) return null;
            const applied = this.#previewTransform.multiplySelf(this.#state.transform);
            this.#state = { ...this.#state, transform: applied };
            this.#previewTransform = new DOMMatrix();
            this.staleThumbnail = true;
            return this.#state;
        }

        /** @param {DOMRect} strokeRect */
        resizeFitStroke(strokeRect, strokeWidth = 0) {
            const canvasRect = new DOMRect(-this.width / 2, -this.height / 2, this.width, this.height);

            const dx = Math.max(0, canvasRect.left - (strokeRect.left - strokeWidth / utils.getScale(this.#state.transform) / 2), (strokeRect.right + strokeWidth / utils.getScale(this.#state.transform) / 2) - canvasRect.right);
            const dy = Math.max(0, canvasRect.top - (strokeRect.top - strokeWidth / utils.getScale(this.#state.transform) / 2), (strokeRect.bottom + strokeWidth / utils.getScale(this.#state.transform) / 2) - canvasRect.bottom);

            if (dx || dy) {
                this.#canvas.width += 2 * Math.ceil(dx);
                this.#canvas.height += 2 * Math.ceil(dy);
                this.#canvas.getContext("2d").imageSmoothingEnabled = false;
                this.#drawImage();
                this.#drawStrokes();
            }
        }

        /**
         * @param {{
         *  color: string, width?: number, clipPath: Path2D, globalCompositeOperation: string,
         *  path2D?: Path2D, text?: string, font?: string, origin?: DOMPoint, transform: DOMMatrix
         * }} stroke
         */
        addStroke(stroke) {
            this.#state = { ...this.#state, strokes: [...this.#state.strokes, stroke] };
            this.drawStroke(stroke);
            this.staleThumbnail = true;
            return this.#state;
        }

        /**
         * @param {{
         *  color: string, width?: number, clipPath: Path2D, globalCompositeOperation: string,
         *  path2D?: Path2D, text?: string, font?: string, origin?: DOMPoint, transform: DOMMatrix
         * }} stroke
         */
        drawStroke(stroke) {
            const ctx = this.#canvas.getContext("2d");
            ctx.save();
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.textBaseline = "middle";
            ctx.globalCompositeOperation = stroke.globalCompositeOperation;
            ctx.setTransform(new DOMMatrix().translateSelf(this.width / 2, this.height / 2).multiplySelf(stroke.transform));
            ctx.clip(stroke.clipPath);
            if (stroke.path2D) {
                ctx.lineWidth = stroke.width;
                ctx.stroke(stroke.path2D);
            }
            if (stroke.text) {
                ctx.font = stroke.font;
                utils.renderMultilineText(ctx, stroke.text, stroke.origin);
            }
            ctx.restore();
        }

        #drawStrokes(strokes = this.#state.strokes) {
            const ctx = this.#canvas.getContext("2d");
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            for (const stroke of strokes) {
                ctx.save();
                ctx.strokeStyle = stroke.color;
                ctx.fillStyle = stroke.color;
                ctx.textBaseline = "middle";
                ctx.globalCompositeOperation = stroke.globalCompositeOperation;
                ctx.setTransform(new DOMMatrix().translateSelf(this.width / 2, this.height / 2).multiplySelf(stroke.transform));
                ctx.clip(stroke.clipPath);
                if (stroke.path2D) {
                    ctx.lineWidth = stroke.width;
                    ctx.stroke(stroke.path2D);
                }
                if (stroke.text) {
                    ctx.font = stroke.font;
                    utils.renderMultilineText(ctx, stroke.text, stroke.origin);
                }
                ctx.restore();
            }
        }

        #drawImage() {
            const ctx = this.#canvas.getContext("2d");
            ctx.clearRect(0, 0, this.width, this.height);
            if (this.#img) {
                ctx.setTransform(new DOMMatrix().translateSelf(this.width / 2, this.height / 2));
                ctx.drawImage(this.#img, -this.#img.width / 2, -this.#img.height / 2);
                ctx.resetTransform();
            }
        }

        /** @param {OffscreenCanvas} canvas */
        drawOn(canvas) {
            this.#subPixelCorrection.x = ((canvas.width - this.width) & 1) / 2;
            this.#subPixelCorrection.y = ((canvas.height - this.height) & 1) / 2;

            if (!this.#state.isVisible || this.#state.adjustments.opacity === 0 || this.#state.strokes.length === 0 && !this.#img) return;

            const ctx = canvas.getContext("2d");
            ctx.save();
            ctx.filter = this.#filter;
            ctx.setTransform(new DOMMatrix()
                .translateSelf(canvas.width / 2 - this.#subPixelCorrection.x, canvas.height / 2 - this.#subPixelCorrection.y)
                .multiplySelf(this.#previewTransform)
                .multiplySelf(this.#state.transform)
            );
            ctx.drawImage(this.#canvas, -this.width / 2, -this.height / 2);
            ctx.restore();
        }

        /** @param {HTMLCanvasElement} canvas */
        drawThumbnailOn(canvas, scale = 1, forced = false) {
            if (!this.staleThumbnail && !forced) return;

            const ctx = canvas.getContext("2d");
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(new DOMMatrix()
                .translateSelf(canvas.width / 2, canvas.height / 2)
                .scaleSelf(scale, scale)
                .translateSelf(-this.#subPixelCorrection.x, -this.#subPixelCorrection.y)
                .multiplySelf(this.#previewTransform)
                .multiplySelf(this.#state.transform)
            );
            ctx.drawImage(this.#canvas, -this.width / 2, -this.height / 2);
            ctx.restore();

            this.staleThumbnail = false;
        }
    }
