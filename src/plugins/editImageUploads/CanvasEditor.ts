/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// @ts-nocheck
import { Layer } from "./Layer";
import { utils } from "./utils";

export class CanvasEditor {
    #mainCanvas;
    #viewportCanvas;
    #viewportTransform;
    #viewportTransform_inv;

    #staleViewportInv;

    #state;
    #activeLayerIndex;

    #bottomCache;
    #middleCache;
    #topCache;

    #interactionCache;
    /** @type {"medium" | "low" | "high" | "off" | "auto"} */
    #imageSmoothing;

    /** @param {HTMLCanvasElement} canvas @param {ImageBitmap} bitmap */
    constructor(canvas, bitmap) {
        this.#mainCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        this.#bottomCache = new OffscreenCanvas(bitmap.width, bitmap.height);
        this.#middleCache = new OffscreenCanvas(bitmap.width, bitmap.height);
        this.#topCache = new OffscreenCanvas(bitmap.width, bitmap.height);
        this.#viewportCanvas = canvas;

        /** @type {string} */
        this.backgroundColor = Data.load(meta.slug, "backgroundColor") ?? "#393946";
        const initialScale = Math.min(canvas.width / bitmap.width * 0.96, canvas.height / bitmap.height * 0.96);
        this.#viewportTransform = new DOMMatrix().scaleSelf(initialScale, initialScale);
        this.#viewportTransform_inv = new DOMMatrix()
            .translateSelf(this.#viewportCanvas.width / 2, this.#viewportCanvas.height / 2)
            .multiplySelf(this.#viewportTransform)
            .translateSelf(-this.#mainCanvas.width / 2, -this.#mainCanvas.height / 2)
            .invertSelf();
        this.#staleViewportInv = false;

        [this.#mainCanvas, this.#bottomCache, this.#middleCache, this.#topCache].forEach(canv => {
            canv.getContext("2d").imageSmoothingEnabled = false;
        });
        this.setImageSmoothing(Data.load(meta.slug, "smoothing") ?? "auto");

        const layer = new Layer("Main", bitmap);
        this.#state = new utils.StateHistory({
            width: bitmap.width,
            height: bitmap.height,
            layers: [{ layer, state: layer.state }]
        });
        this.#activeLayerIndex = 0;
        this.fullRender();

        this.#interactionCache = {
            layerTransform_inv: new DOMMatrix(),
            path2D: new Path2D(),
            lastPoint: new DOMPoint(NaN, NaN),
            lastMidPoint: new DOMPoint(NaN, NaN),
            /** @type {DOMRect | null} */
            rect: null,
            /** @type {DOMRect | null} */
            clipRect: null,
            width: 0,
            color: "#000",
            globalCompositeOperation: "source-over",
            text: "",
            font: "1rem sans-serif"
        };
    }

    get layers() { return this.#state.state.layers; }
    get #activeLayer() { return this.layers[this.activeLayerIndex].layer; }
    get viewportTransform() { return this.#viewportTransform; }
    get viewportTransform_inv() {
        if (this.#staleViewportInv) {
            this.#viewportTransform_inv = new DOMMatrix()
                .translateSelf(this.#viewportCanvas.width / 2, this.#viewportCanvas.height / 2)
                .multiplySelf(this.#viewportTransform)
                .translateSelf(-this.#mainCanvas.width / 2, -this.#mainCanvas.height / 2)
                .invertSelf();
            this.#staleViewportInv = false;
        }
        return this.#viewportTransform_inv;
    }
    get lastPoint() {
        return Number.isNaN(this.#interactionCache.lastPoint.x) || Number.isNaN(this.#interactionCache.lastPoint.y) ? null : this.#interactionCache.lastPoint.matrixTransform(this.viewportTransform_inv.inverse());
    }
    get regionRect() {
        if (!this.#interactionCache.rect) return null;

        const T = this.viewportTransform_inv.inverse();
        const topLeft = new DOMPoint(this.#interactionCache.rect.left, this.#interactionCache.rect.top).matrixTransform(T);
        const bottomRight = new DOMPoint(this.#interactionCache.rect.right, this.#interactionCache.rect.bottom).matrixTransform(T);
        return new DOMRect(
            Math.min(topLeft.x, bottomRight.x) / this.#viewportCanvas.width,
            Math.min(topLeft.y, bottomRight.y) / this.#viewportCanvas.height,
            Math.abs(topLeft.x - bottomRight.x) / this.#viewportCanvas.width,
            Math.abs(topLeft.y - bottomRight.y) / this.#viewportCanvas.height,
        );
    }
    get clipRect() {
        if (!this.#interactionCache.clipRect) return null;

        const T = this.viewportTransform_inv.inverse();
        const topLeft = new DOMPoint(this.#interactionCache.clipRect.left, this.#interactionCache.clipRect.top).matrixTransform(T);
        const bottomRight = new DOMPoint(this.#interactionCache.clipRect.right, this.#interactionCache.clipRect.bottom).matrixTransform(T);
        return new DOMRect(
            Math.min(topLeft.x, bottomRight.x) / this.#viewportCanvas.width,
            Math.min(topLeft.y, bottomRight.y) / this.#viewportCanvas.height,
            Math.abs(topLeft.x - bottomRight.x) / this.#viewportCanvas.width,
            Math.abs(topLeft.y - bottomRight.y) / this.#viewportCanvas.height,
        );
    }

    get canUndo() { return this.#state.canUndo; }
    get canRedo() { return this.#state.canRedo; }
    get previewLayerTransform() { return this.#activeLayer.previewTransform; }
    get layerTransform() { return this.#activeLayer.state.transform; }

    get viewportDims() { return { width: this.#viewportCanvas.width, height: this.#viewportCanvas.height }; }
    set viewportDims(dims) {
        this.#staleViewportInv = true;
        this.#viewportCanvas.width = dims.width;
        this.#viewportCanvas.height = dims.height;
    }

    get canvasDims() { return { width: this.#mainCanvas.width, height: this.#mainCanvas.height }; }
    set canvasDims(dims) {
        this.#resizeCanvas(dims.width, dims.height);
        this.#state.state = { ...this.#state.state, width: dims.width, height: dims.height };
    }

    get activeLayerIndex() { return this.#activeLayerIndex; }
    set activeLayerIndex(layerIndex) {
        this.#activeLayerIndex = utils.clamp(0, layerIndex, this.layers.length - 1);
        this.sandwichLayer();
    }

    sandwichLayer(layerIndex = this.#activeLayerIndex) {
        if (!(layerIndex in this.layers)) return;

        this.#bottomCache.getContext("2d").clearRect(0, 0, this.#bottomCache.width, this.#bottomCache.height);
        this.#topCache.getContext("2d").clearRect(0, 0, this.#topCache.width, this.#topCache.height);

        this.layers.slice(0, layerIndex).forEach(layer => { layer.layer.drawOn(this.#bottomCache); });
        this.layers.slice(layerIndex + 1).forEach(layer => { layer.layer.drawOn(this.#topCache); });
    }

    /** @param {ImageBitmap | null} bitmap */
    createNewLayer(bitmap) {
        const newLayer = new Layer(
            `Layer ${(this.layers.length)}`,
            bitmap instanceof ImageBitmap ? bitmap : { width: 2 - (this.#activeLayer.width & 1), height: 2 - (this.#activeLayer.height & 1) }
        );
        this.#state.state = {
            ...this.#state.state,
            layers: [
                ...this.#state.state.layers,
                { layer: newLayer, state: newLayer.state }
            ]
        };
        this.activeLayerIndex = this.layers.length - 1;
        this.render();
    }

    deleteLayer(layerIndex = this.activeLayerIndex) {
        if (layerIndex in this.layers && this.layers.length > 1) {
            const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
            updated.layers.splice(layerIndex, 1);
            this.#state.state = updated;
            this.activeLayerIndex = Math.min(this.activeLayerIndex, updated.layers.length - 1);
            this.render();
        }
    }

    /** @param {number} layerIndex */
    toggleLayerVisibility(layerIndex) {
        if (!(layerIndex in this.layers)) return;

        const isVisible = !this.layers[layerIndex].state.isVisible;
        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[layerIndex] = { ...updated.layers[layerIndex], state: { ...updated.layers[layerIndex].state, isVisible } };
        this.#state.state = updated;
        this.layers[layerIndex].layer.state = this.layers[layerIndex].state;

        this.fullRender();
    }

    /**
     * @typedef {Partial<{
     *  blur: number, brightness: number, contrast: number, grayscale: number,
     * ["hue-rotate"]: number, invert: number, saturate: number, sepia: number
     * }>} LayerAdjustments
     *
     * @param {(current: LayerAdjustments) => LayerAdjustments} setter
     * @param {number} layerIndex
     * @param {boolean} shouldPushToStack
     */
    setLayerAdjustment(layerIndex, setter, shouldPushToStack) {
        const adjustments = setter(this.layers[layerIndex].state.adjustments);
        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[layerIndex] = { ...updated.layers[layerIndex], state: { ...updated.layers[layerIndex].state, adjustments } };
        if (shouldPushToStack) {
            this.#state.state = updated;
        }
        updated.layers[layerIndex].layer.state = updated.layers[layerIndex].state;

        this.render(layerIndex);
    }

    /** @param {number} layerIndex */
    resetLayerTransform(layerIndex) {
        if (!(layerIndex in this.layers)) return;

        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[layerIndex] = { ...updated.layers[layerIndex], state: { ...updated.layers[layerIndex].state, transform: new DOMMatrix() } };
        this.#state.state = updated;
        this.layers[layerIndex].layer.state = this.layers[layerIndex].state;

        this.render(layerIndex);
    }

    /** @param {number} layerIndex */
    async copyLayerContents(layerIndex) {
        if (!(layerIndex in this.layers)) return;

        const ctx = this.#middleCache.getContext("2d");
        ctx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);
        this.layers[layerIndex].layer.drawOn(this.#middleCache);
        const blob = await this.#middleCache.convertToBlob({ type: "image/png" });
        ctx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);
        return blob;
    }

    async duplicateLayer(layerIndex = this.#activeLayerIndex) {
        if (!(layerIndex in this.layers)) return;

        const targetLayer = this.layers[layerIndex].layer;
        const bitmap = await targetLayer.toBitmap();
        const newLayer = new Layer(targetLayer.name, bitmap);
        newLayer.state = { ...targetLayer.state, strokes: [] };

        this.#state.state = {
            ...this.#state.state,
            layers: [
                ...this.#state.state.layers,
                { layer: newLayer, state: newLayer.state }
            ]
        };
        this.activeLayerIndex = this.layers.length - 1;
        this.render();
    }

    /** @param {number} delta */
    moveLayers(delta, layerIndex = this.activeLayerIndex) {
        if (!((layerIndex + delta) in this.layers) || !(layerIndex in this.layers) || delta === 0) return;

        const activeLayer = this.#activeLayer;

        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers.splice(layerIndex + delta, 0, updated.layers.splice(layerIndex, 1)[0]);
        this.#state.state = updated;

        this.activeLayerIndex = this.#state.state.layers.findIndex(layer => layer.layer === activeLayer);
        this.render();
    }

    /** @param {string} smoothing */
    setImageSmoothing(smoothing) {
        const ctx = this.#viewportCanvas.getContext("2d");

        switch (smoothing) {
            case "auto": {
                this.#autoSmooth();
                break;
            }
            case "off": {
                ctx.imageSmoothingEnabled = false;
                break;
            }
            case "low":
            case "medium":
            case "high": {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = smoothing;
                break;
            }
            default: throw new Error("Unsupported image smoothing quality.");
        }
        this.#imageSmoothing = smoothing;
    }

    #autoSmooth() {
        const scale = utils.getScale(this.#viewportTransform);
        const ctx = this.#viewportCanvas.getContext("2d");

        switch (true) {
            case scale > 2: {
                ctx.imageSmoothingEnabled = false;
                break;
            }
            case scale > 1 / 2: {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "low";
                break;
            }
            case scale > 1 / 8: {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "medium";
                break;
            }
            default: {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                break;
            }
        }
    }

    translateViewportBy(dx = 0, dy = 0) {
        this.#viewportTransform.preMultiplySelf(new DOMMatrix().translateSelf(dx, dy));
        this.refreshViewport();
        this.#staleViewportInv = true;
    }

    scaleViewportBy(ds = 1, x = 0.5, y = 0.5) {
        const Tx = (x - 0.5) * this.#viewportCanvas.width;
        const Ty = (y - 0.5) * this.#viewportCanvas.height;

        this.#viewportTransform.preMultiplySelf(new DOMMatrix().scaleSelf(ds, ds, 1, Tx, Ty));
        this.#imageSmoothing === "auto" && this.#autoSmooth();
        this.refreshViewport();
        this.#staleViewportInv = true;
    }

    resetViewport() {
        const scale = Math.min(this.#viewportCanvas.width / this.#mainCanvas.width * 0.96, this.#viewportCanvas.height / this.#mainCanvas.height * 0.96);
        this.#viewportTransform = new DOMMatrix().scaleSelf(scale, scale);
        this.#imageSmoothing === "auto" && this.#autoSmooth();
        this.#staleViewportInv = true;
    }

    refreshViewport() {
        const ctx = this.#viewportCanvas.getContext("2d");

        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.#viewportCanvas.width, this.#viewportCanvas.height);
        ctx.setTransform(new DOMMatrix().translateSelf(this.#viewportCanvas.width / 2, this.#viewportCanvas.height / 2).multiplySelf(this.#viewportTransform));

        ctx.clearRect(-this.#mainCanvas.width / 2, -this.#mainCanvas.height / 2, this.#mainCanvas.width, this.#mainCanvas.height);
        ctx.drawImage(this.#mainCanvas, -this.#mainCanvas.width / 2, -this.#mainCanvas.height / 2);

        ctx.resetTransform();
    }

    /** @param {DOMMatrix} M */
    previewLayerTransformBy(M) {
        this.#activeLayer.previewTransformBy(M);
        this.render();
    }
    /** @param {DOMMatrix} M  */
    previewLayerTransformTo(M) {
        this.#activeLayer.previewTransformTo(M);
        this.render();
    }
    finalizeLayerPreview() {
        const layerState = this.#activeLayer.finalizePreview();
        if (!layerState) return;

        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[this.activeLayerIndex] = { ...updated.layers[this.activeLayerIndex], state: layerState };
        this.#state.state = updated;
    }

    #prepareMiddleCanvas() {
        const adjustments = { ...this.#activeLayer.state.adjustments };
        this.setLayerAdjustment(this.#activeLayerIndex, () => ({}));
        this.#activeLayer.drawOn(this.#middleCache);
        this.setLayerAdjustment(this.#activeLayerIndex, () => adjustments);
    }

    /** @param {DOMPoint} startPoint @param {number} width @param {string} color */
    startDrawing(startPoint, width, color, globalCompositeOperation = "source-over") {
        const ctx = this.#middleCache.getContext("2d");
        ctx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);
        this.#prepareMiddleCanvas();
        ctx.save();
        ctx.beginPath();

        this.#interactionCache.width = width;
        this.#interactionCache.color = color;
        this.#interactionCache.globalCompositeOperation = globalCompositeOperation;

        ctx.globalCompositeOperation = globalCompositeOperation;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        this.#interactionCache.path2D = new Path2D();
        this.#interactionCache.lastPoint = startPoint.matrixTransform(this.viewportTransform_inv);
        this.#interactionCache.lastMidPoint = startPoint.matrixTransform(this.viewportTransform_inv);

        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        const clipPath = new Path2D();
        clipPath.rect(availRect.x, availRect.y, availRect.width, availRect.height);
        ctx.clip(clipPath);

        const isOOB = !utils.pointInRect(this.#interactionCache.lastPoint, availRect, Math.ceil(width / 2));

        this.#interactionCache.layerTransform_inv = new DOMMatrix()
            .translateSelf(
                this.#mainCanvas.width / 2 - ((this.#mainCanvas.width - this.#activeLayer.width) & 1) / 2,
                this.#mainCanvas.height / 2 - ((this.#mainCanvas.height - this.#activeLayer.height) & 1) / 2
            ).multiplySelf(this.layerTransform).invertSelf();

        if (isOOB) {
            this.#interactionCache.rect = new DOMRect();
            return;
        }

        const rawPoint = this.#interactionCache.lastPoint.matrixTransform(this.#interactionCache.layerTransform_inv);
        this.#interactionCache.rect = new DOMRect(rawPoint.x, rawPoint.y);

        if (this.#activeLayer.state.isVisible) {
            ctx.beginPath();
            ctx.arc(this.#interactionCache.lastPoint.x, this.#interactionCache.lastPoint.y, width / 2, 0, 2 * Math.PI);
            ctx.fill();

            const p1 = new DOMPoint(
                Math.floor(this.#interactionCache.lastPoint.x - this.#interactionCache.width / 2),
                Math.floor(this.#interactionCache.lastPoint.y - this.#interactionCache.width / 2)
            );
            const p2 = new DOMPoint(
                Math.ceil(this.#interactionCache.lastPoint.x + this.#interactionCache.width / 2),
                Math.ceil(this.#interactionCache.lastPoint.y + this.#interactionCache.width / 2)
            );

            const mainCtx = this.#mainCanvas.getContext("2d");
            mainCtx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            this.#activeLayerIndex > 0 && mainCtx.drawImage(this.#bottomCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

            mainCtx.filter = this.#activeLayer.filter;
            mainCtx.drawImage(this.#middleCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            mainCtx.filter = "none";

            this.#activeLayerIndex < this.layers.length - 1 && mainCtx.drawImage(this.#topCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

            this.refreshViewport();
        }

        this.#interactionCache.path2D.moveTo(this.#interactionCache.lastPoint.x, this.#interactionCache.lastPoint.y);
        this.#interactionCache.path2D.lineTo(this.#interactionCache.lastPoint.x, this.#interactionCache.lastPoint.y);
        this.#interactionCache.path2D.moveTo(this.#interactionCache.lastPoint.x, this.#interactionCache.lastPoint.y);
    }

    /** @param {DOMPoint} point */
    curveTo(point) {
        const ctx = this.#middleCache.getContext("2d");
        const to_inv = point.matrixTransform(this.viewportTransform_inv);

        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        // out of bounds
        const isOOB = !utils.pointInRect(to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));
        const prevIsOOB = !utils.pointInRect(this.#interactionCache.lastPoint, availRect, Math.ceil(this.#interactionCache.width / 2));

        const intersections = utils.lineRect(this.#interactionCache.lastPoint, to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));

        if (isOOB && prevIsOOB && !intersections.length) {
            this.#interactionCache.lastPoint = to_inv;
            this.#interactionCache.lastMidPoint = to_inv;
            return;
        }

        const [clampedFrom, clampedTo] = utils.clampLineToRect(this.#interactionCache.lastPoint, to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));
        const midpoint = new DOMPoint((clampedTo.x + clampedFrom.x) / 2, (clampedTo.y + clampedFrom.y) / 2);

        if (isOOB && !prevIsOOB) {
            clampedFrom.x = midpoint.x;
            clampedFrom.y = midpoint.y;
            midpoint.x = clampedTo.x;
            midpoint.y = clampedTo.y;
        }

        if (this.#activeLayer.state.isVisible) {
            ctx.beginPath();
            ctx.moveTo(this.#interactionCache.lastMidPoint.x, this.#interactionCache.lastMidPoint.y);
            ctx.quadraticCurveTo(clampedFrom.x, clampedFrom.y, midpoint.x, midpoint.y);
            ctx.stroke();

            const p1 = new DOMPoint(
                Math.floor(Math.min(this.#interactionCache.lastMidPoint.x, clampedFrom.x, midpoint.x) - this.#interactionCache.width / 2),
                Math.floor(Math.min(this.#interactionCache.lastMidPoint.y, clampedFrom.y, midpoint.y) - this.#interactionCache.width / 2)
            );
            const p2 = new DOMPoint(
                Math.ceil(Math.max(this.#interactionCache.lastMidPoint.x, clampedFrom.x, midpoint.x) + this.#interactionCache.width / 2),
                Math.ceil(Math.max(this.#interactionCache.lastMidPoint.y, clampedFrom.y, midpoint.y) + this.#interactionCache.width / 2)
            );

            const mainCtx = this.#mainCanvas.getContext("2d");
            mainCtx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            this.#activeLayerIndex > 0 && mainCtx.drawImage(this.#bottomCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            mainCtx.filter = this.#activeLayer.filter;
            mainCtx.drawImage(this.#middleCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            mainCtx.filter = "none";
            this.#activeLayerIndex < this.layers.length - 1 && mainCtx.drawImage(this.#topCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

            this.refreshViewport();
        }

        prevIsOOB && this.#interactionCache.path2D.moveTo(this.#interactionCache.lastMidPoint.x, this.#interactionCache.lastMidPoint.y);
        this.#interactionCache.path2D.quadraticCurveTo(clampedFrom.x, clampedFrom.y, midpoint.x, midpoint.y);

        const rawMidpoint = midpoint.matrixTransform(this.#interactionCache.layerTransform_inv);
        this.#interactionCache.rect.width += Math.max(this.#interactionCache.rect.left - rawMidpoint.x, rawMidpoint.x - this.#interactionCache.rect.right, 0);
        this.#interactionCache.rect.height += Math.max(this.#interactionCache.rect.top - rawMidpoint.y, rawMidpoint.y - this.#interactionCache.rect.bottom, 0);
        this.#interactionCache.rect.x = Math.min(rawMidpoint.x, this.#interactionCache.rect.left);
        this.#interactionCache.rect.y = Math.min(rawMidpoint.y, this.#interactionCache.rect.top);

        this.#interactionCache.lastPoint = to_inv;
        this.#interactionCache.lastMidPoint = midpoint;
    }

    /** @param {DOMPoint} point */
    lineTo(point) {
        const ctx = this.#middleCache.getContext("2d");
        const to_inv = point.matrixTransform(this.viewportTransform_inv);

        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        // out of bounds
        const isOOB = !utils.pointInRect(to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));
        const prevIsOOB = !utils.pointInRect(this.#interactionCache.lastPoint, availRect, Math.ceil(this.#interactionCache.width / 2));

        const intersections = utils.lineRect(this.#interactionCache.lastPoint, to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));

        if (isOOB && prevIsOOB && !intersections.length) {
            this.#interactionCache.lastPoint = to_inv;
            return;
        }

        const [clampedFrom, clampedTo] = utils.clampLineToRect(this.#interactionCache.lastPoint, to_inv, availRect, Math.ceil(this.#interactionCache.width / 2));

        if (this.#activeLayer.state.isVisible) {
            ctx.beginPath();
            ctx.moveTo(clampedFrom.x, clampedFrom.y);
            ctx.lineTo(clampedTo.x, clampedTo.y);
            ctx.stroke();

            const p1 = new DOMPoint(
                Math.floor(Math.min(clampedFrom.x, clampedTo.x) - this.#interactionCache.width / 2),
                Math.floor(Math.min(clampedFrom.y, clampedTo.y) - this.#interactionCache.width / 2)
            );
            const p2 = new DOMPoint(
                Math.ceil(Math.max(clampedFrom.x, clampedTo.x) + this.#interactionCache.width / 2),
                Math.ceil(Math.max(clampedFrom.y, clampedTo.y) + this.#interactionCache.width / 2)
            );

            const mainCtx = this.#mainCanvas.getContext("2d");
            mainCtx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            this.#activeLayerIndex > 0 && mainCtx.drawImage(this.#bottomCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            mainCtx.filter = this.#activeLayer.filter;
            mainCtx.drawImage(this.#middleCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            mainCtx.filter = "none";
            this.#activeLayerIndex < this.layers.length - 1 && mainCtx.drawImage(this.#topCache, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y, p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

            this.refreshViewport();
        }

        prevIsOOB && this.#interactionCache.path2D.moveTo(clampedFrom.x, clampedFrom.y);
        this.#interactionCache.path2D.lineTo(clampedTo.x, clampedTo.y);

        const rawClampedTo = clampedTo.matrixTransform(this.#interactionCache.layerTransform_inv);
        this.#interactionCache.rect.width += Math.max(this.#interactionCache.rect.left - rawClampedTo.x, rawClampedTo.x - this.#interactionCache.rect.right, 0);
        this.#interactionCache.rect.height += Math.max(this.#interactionCache.rect.top - rawClampedTo.y, rawClampedTo.y - this.#interactionCache.rect.bottom, 0);
        this.#interactionCache.rect.x = Math.min(rawClampedTo.x, this.#interactionCache.rect.left);
        this.#interactionCache.rect.y = Math.min(rawClampedTo.y, this.#interactionCache.rect.top);

        this.#interactionCache.lastPoint = to_inv;
    }

    endDrawing() {
        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        const clipPath = new Path2D();
        clipPath.rect(availRect.x, availRect.y, availRect.width, availRect.height);

        this.#activeLayer.resizeFitStroke(this.#interactionCache.rect, this.#interactionCache.width);
        this.#interactionCache.rect = null;
        const layerState = this.#activeLayer.addStroke({
            color: this.#interactionCache.color,
            width: this.#interactionCache.width,
            path2D: this.#interactionCache.path2D,
            globalCompositeOperation: this.#interactionCache.globalCompositeOperation,
            clipPath,
            transform: this.#interactionCache.layerTransform_inv
        });

        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[this.activeLayerIndex] = { ...updated.layers[this.activeLayerIndex], state: layerState };
        this.#state.state = updated;

        const middleCtx = this.#middleCache.getContext("2d");
        middleCtx.restore();
        middleCtx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);
        this.render();
    }

    /** @param {DOMPoint} startPoint */
    startRegionSelect(startPoint, fixedAspect = false) {
        const start_T = startPoint.matrixTransform(this.viewportTransform_inv);
        start_T.x = Math.round(utils.clamp(0, start_T.x, this.#mainCanvas.width));
        start_T.y = Math.round(utils.clamp(0, start_T.y, this.#mainCanvas.height));
        this.#interactionCache.clipRect = new DOMRect(start_T.x, start_T.y, 0, 0);
        this.#interactionCache.width = Number(fixedAspect);
    }

    /** @param {DOMPoint} to */
    regionSelect(to) {
        const to_T = to.matrixTransform(this.viewportTransform_inv);
        to_T.x = Math.round(utils.clamp(0, to_T.x, this.#mainCanvas.width));
        to_T.y = Math.round(utils.clamp(0, to_T.y, this.#mainCanvas.height));

        this.#interactionCache.clipRect.width = to_T.x - this.#interactionCache.clipRect.x;
        this.#interactionCache.clipRect.height = to_T.y - this.#interactionCache.clipRect.y;

        if (this.#interactionCache.width) {
            // fixed Aspect ratio
            const aspect = this.#mainCanvas.width / this.#mainCanvas.height;

            this.#interactionCache.clipRect.width = utils.maxAbs(this.#interactionCache.clipRect.width, (Math.sign(this.#interactionCache.clipRect.width) || 1) * Math.abs(this.#interactionCache.clipRect.height) * aspect);
            this.#interactionCache.clipRect.height = utils.maxAbs(this.#interactionCache.clipRect.height, (Math.sign(this.#interactionCache.clipRect.height) || 1) * Math.abs(this.#interactionCache.clipRect.width) / aspect);

            this.#interactionCache.clipRect.width = utils.clamp(-this.#interactionCache.clipRect.x, this.#interactionCache.clipRect.width, this.#mainCanvas.width - this.#interactionCache.clipRect.x);
            this.#interactionCache.clipRect.height = utils.clamp(-this.#interactionCache.clipRect.y, this.#interactionCache.clipRect.height, this.#mainCanvas.height - this.#interactionCache.clipRect.y);

            this.#interactionCache.clipRect.width = Math.round(utils.minAbs(this.#interactionCache.clipRect.width, (Math.sign(this.#interactionCache.clipRect.width) || 1) * Math.abs(this.#interactionCache.clipRect.height) * aspect));
            this.#interactionCache.clipRect.height = Math.round(utils.minAbs(this.#interactionCache.clipRect.height, (Math.sign(this.#interactionCache.clipRect.height) || 1) * Math.abs(this.#interactionCache.clipRect.width) / aspect));
        }
    }

    endRegionSelect() {
        if (!this.#interactionCache.clipRect || Math.abs(this.#interactionCache.clipRect.width) < 1 || Math.abs(this.#interactionCache.clipRect.height) < 1) {
            this.#interactionCache.clipRect = null;
        }
    }

    cropToRegionRect() {
        if (!this.#interactionCache.clipRect || Math.abs(this.#interactionCache.clipRect.width) < 1 || Math.abs(this.#interactionCache.clipRect.height) < 1) {
            this.#interactionCache.clipRect = null;
            return false;
        }
        const width = Math.abs(this.#interactionCache.clipRect.width);
        const height = Math.abs(this.#interactionCache.clipRect.height);

        const ccx = this.#interactionCache.clipRect.left + width / 2;
        const ccy = this.#interactionCache.clipRect.top + height / 2;

        const cx = this.#mainCanvas.width / 2;
        const cy = this.#mainCanvas.height / 2;

        const subPixelX = ((width - this.#activeLayer.width) & 1) / 2;
        const subPixelY = ((height - this.#activeLayer.height) & 1) / 2;

        const T = new DOMMatrix().translateSelf(cx - ccx + subPixelX, cy - ccy + subPixelY);

        const updated = { ...this.#state.state, width, height };
        updated.layers = updated.layers.map(({ layer, state }) => {
            const newState = { ...state, transform: T.multiply(state.transform) };
            layer.state = newState;
            return { layer, state: newState };
        });
        this.#state.state = updated;
        this.#resizeCanvas(width, height);
        this.fullRender();

        this.#interactionCache.clipRect = null;
        return true;
    }

    /** @param {DOMPoint} point @param {string} font @param {string} color */
    insertTextAt(point, font, color) {
        const ctx = this.#middleCache.getContext("2d");
        ctx.save();
        ctx.font = font;

        this.#interactionCache.layerTransform_inv = new DOMMatrix()
            .translateSelf(
                this.#mainCanvas.width / 2 - ((this.#mainCanvas.width - this.#activeLayer.width) & 1) / 2,
                this.#mainCanvas.height / 2 - ((this.#mainCanvas.height - this.#activeLayer.height) & 1) / 2
            ).multiplySelf(this.layerTransform).invertSelf();

        const textMetrics = ctx.measureText("");
        const width = Math.ceil(textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft);
        const height = Math.ceil(textMetrics.fontBoundingBoxDescent + textMetrics.fontBoundingBoxAscent);
        ctx.restore();

        const to_inv = point.matrixTransform(this.viewportTransform_inv);
        this.#interactionCache.rect = new DOMRect(Math.round(to_inv.x), Math.round(to_inv.y - height / 2), width, height);
        this.#interactionCache.color = color;
        this.#interactionCache.font = font;
    }

    updateText(text = this.#interactionCache.text, font = this.#interactionCache.font) {
        const ctx = this.#middleCache.getContext("2d");
        ctx.save();
        ctx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);
        this.#prepareMiddleCanvas();

        ctx.textBaseline = "middle";
        ctx.fillStyle = this.#interactionCache.color;
        ctx.font = font;
        this.#interactionCache.text = text;
        this.#interactionCache.font = font;

        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        const clipPath = new Path2D();
        clipPath.rect(availRect.x, availRect.y, availRect.width, availRect.height);
        ctx.clip(clipPath);

        const [w, h] = utils.renderMultilineText(
            ctx, this.#interactionCache.text,
            new DOMPoint(this.#interactionCache.rect.x + 1, this.#interactionCache.rect.y)
        );
        ctx.restore();

        this.#interactionCache.rect.width = Math.ceil(w + !!(w));
        this.#interactionCache.rect.height = Math.ceil(h);

        const mainCtx = this.#mainCanvas.getContext("2d");
        mainCtx.clearRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        this.#activeLayerIndex > 0 && mainCtx.drawImage(this.#bottomCache, 0, 0);

        mainCtx.filter = this.#activeLayer.filter;
        mainCtx.drawImage(this.#middleCache, 0, 0);
        mainCtx.filter = "none";

        this.#activeLayerIndex < this.layers.length - 1 && mainCtx.drawImage(this.#topCache, 0, 0);

        this.refreshViewport();
    }

    finalizeText() {
        const ctx = this.#middleCache.getContext("2d");

        if (this.#interactionCache.text === "") {
            ctx.restore();
            this.#interactionCache.rect = null;
            return;
        }

        const availRect = this.#interactionCache.clipRect ?? new DOMRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);
        const clipPath = new Path2D();
        clipPath.rect(availRect.x, availRect.y, availRect.width, availRect.height);

        const intersect = utils.rectRect(availRect, this.#interactionCache.rect);
        const rawOrigin1 = new DOMPoint(intersect.left, intersect.top).matrixTransform(this.#interactionCache.layerTransform_inv);
        const rawOrigin2 = new DOMPoint(intersect.right, intersect.bottom).matrixTransform(this.#interactionCache.layerTransform_inv);
        this.#activeLayer.resizeFitStroke(new DOMRect(rawOrigin1.x, rawOrigin1.y, rawOrigin2.x - rawOrigin1.x, rawOrigin2.y - rawOrigin1.y));

        const layerState = this.#activeLayer.addStroke({
            text: this.#interactionCache.text,
            font: this.#interactionCache.font,
            origin: new DOMPoint(this.#interactionCache.rect.x + 1, this.#interactionCache.rect.y),
            color: this.#interactionCache.color,
            globalCompositeOperation: "source-over",
            clipPath,
            transform: this.#interactionCache.layerTransform_inv
        });

        this.#interactionCache.text = "";
        this.#interactionCache.rect = null;
        ctx.restore();
        ctx.clearRect(0, 0, this.#middleCache.width, this.#middleCache.height);

        const updated = { ...this.#state.state, layers: [...this.#state.state.layers] };
        updated.layers[this.activeLayerIndex] = { ...updated.layers[this.activeLayerIndex], state: layerState };
        this.#state.state = updated;

        this.render();
    }

    /** @param {number} width @param {number} height  */
    #resizeCanvas(width, height) {
        this.#staleViewportInv = true;
        [this.#mainCanvas, this.#bottomCache, this.#middleCache, this.#topCache].forEach(c => {
            c.width = width;
            c.height = height;
            c.getContext("2d").imageSmoothingEnabled = false;
        });

        this.layers.forEach(({ layer }) => { layer.staleThumbnail = true; });
    }

    /** @param {1 | -1} x @param {-1 | 1} y */
    scale(x, y) {
        const S = new DOMMatrix().scaleSelf(x, y);
        const layers = this.layers.map(({ layer }) => {
            layer.previewTransformBy(S);
            return { layer, state: layer.finalizePreview() };
        });
        this.#state.state = { ...this.#state.state, layers };
    }

    /** @param {90 | -90} angle  */
    rotate(angle) {
        const R = new DOMMatrix().rotateSelf(angle);
        const layers = this.layers.map(({ layer }) => {
            layer.previewTransformBy(R);
            return { layer, state: layer.finalizePreview() };
        });
        this.#resizeCanvas(this.#state.state.height, this.#state.state.width);
        this.#state.state = { ...this.#state.state, layers, width: this.#state.state.height, height: this.#state.state.width };

        this.resetViewport();
        this.fullRender();
    }

    /** @type {typeof OffscreenCanvas.prototype.convertToBlob} */
    toBlob(options) { return this.#mainCanvas.convertToBlob(options); }

    render(layerIndex = this.#activeLayerIndex) {
        const ctx = this.#mainCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.#mainCanvas.width, this.#mainCanvas.height);

        layerIndex > 0 && ctx.drawImage(this.#bottomCache, 0, 0);
        this.layers[layerIndex].layer.drawOn(this.#mainCanvas);
        layerIndex < this.layers.length - 1 && ctx.drawImage(this.#topCache, 0, 0);

        this.refreshViewport();
    }

    fullRender() {
        this.sandwichLayer();
        this.render();
    }

    undo() {
        const oldWidth = this.#mainCanvas.width;
        const oldHeight = this.#mainCanvas.height;
        if (!this.#state.undo()) return false;
        if (this.#state.state.width !== oldWidth || this.#state.state.height !== oldHeight) {
            this.#resizeCanvas(this.#state.state.width, this.#state.state.height);
            this.resetViewport();
        }
        this.#state.state.layers.forEach(({ layer, state }) => { layer.state = state; });
        this.activeLayerIndex = utils.clamp(0, this.activeLayerIndex, this.#state.state.layers.length - 1);
        this.render();
        return true;
    }

    redo() {
        const oldWidth = this.#mainCanvas.width;
        const oldHeight = this.#mainCanvas.height;
        if (!this.#state.redo()) return false;
        if (this.#state.state.width !== oldWidth || this.#state.state.height !== oldHeight) {
            this.#resizeCanvas(this.#state.state.width, this.#state.state.height);
            this.resetViewport();
        }
        this.#state.state.layers.forEach(({ layer, state }) => { layer.state = state; });
        this.activeLayerIndex = utils.clamp(0, this.activeLayerIndex, this.#state.state.layers.length - 1);
        this.render();
        return true;
    }
}
