/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

import { CanvasEditor } from "./CanvasEditor";
import { hooks } from "./hooks";
import { utils } from "./utils";
const { jsx } = React;
// Some BD APIs are mocked or translated
const ContextMenu = { open: () => { }, buildMenu: () => { } };
const UI = { showToast: msg => console.log(msg) };
const BdApi = { Components: { ErrorBoundary: ({ children }) => children, Tooltip: ({ children }) => children, Spinner: () => null } };
const internals = {
    actionIconClass: {},
    nativeUI: {},
    keys: {},
    actionButtonClass: {},
    ManaButton: {},
    scrollbarClass: {},
    contextMenuClass: {},
    SelectedChannelStore: { getCurrentlySelectedChannelId: () => "0" },
    uploadDispatcher: { setFile: () => { }, addFile: () => { } }
};
const meta = { slug: "EditImageUploads" };

// @ts-nocheck
export const Components = {
    injectUploadButton(args: any) {
        return null; // TODO: return the UploadIcon
    },
    injectRemixButton(args: any, hooks: any, utils: any) {
        return null; // TODO: wrap the remix button
    },
    /** @param {React.PropsWithChildren<{fallback?: React.ReactNode}>} props */
    ErrorBoundary({ fallback, ...restProps }) {
        return jsx(BdApi.Components.ErrorBoundary, {
            ...restProps,
            fallback: fallback ?? jsx("div", { style: { color: "var(--red-430, #d6363f)" } }, "Component Error")
        });
    },

    /** @param {{d: string}} props */
    Icon({ d }) {
        return jsx("svg", {
            className: internals.actionIconClass?.actionBarIcon,
            "aria-hidden": "true",
            role: "img",
            xmlns: "http://www.w3.org/2000/svg",
            width: "16",
            height: "16",
            fill: "none",
            viewBox: "0 0 24 24",
            children: jsx("path", {
                fill: "currentColor",
                d
            })
        });
    },

    /**
     * @param {{
     *  onClick?: (e: React.MouseEvent<HTMLElement>) => void, tooltip?: string, disabled?: boolean,
     *  active?: boolean, position?: string, className?: string, d?: string
     * }} props
     */
    IconButton({ onClick, tooltip, d, disabled, active, className }) {
        return jsx(Components.ErrorBoundary, {
            children: jsx(BdApi.Components.Tooltip, {
                spacing: 11,
                text: tooltip,
                children: ({ onContextMenu, ...restProps }) => jsx(internals.nativeUI[internals.keys.FocusRing], {
                    children: jsx("div", {
                        ...restProps,
                        onClick: e => { if (onClick && !disabled) { e.stopPropagation(); onClick(e); } },
                        onKeyDown: e => { if (!e.repeat && (e.key === "Enter" || e.key === " ") && !disabled) onClick?.(e); },
                        className: utils.clsx(internals.actionButtonClass?.button, className, "icon-button", disabled && "disabled", active && "active"),
                        role: "button",
                        tabIndex: disabled ? null : 0,
                        children: jsx(Components.Icon, { d }),
                    })
                })
            })
        });
    },

    /** @param {{url: string}} props */
    RemixIcon({ url }) {
        const [isPending, startTransition] = useTransition();
        const ctrl = useRef(new AbortController());
        const userActions = useRef(null);

        useEffect(() => () => ctrl.current.abort(), []);

        return !isPending ? jsx(BdApi.Components.Tooltip, {
            spacing: 11,
            position: "bottom",
            text: "Edit Image",
            children: ({ onContextMenu, ...tooltipProps }) => jsx(internals.ManaButton[internals.keys.ManaButton], {
                ...tooltipProps,
                size: "sm",
                variant: "icon-only",
                icon: () => jsx(Components.Icon, { d: utils.paths.Main }),
                onClick: () => {
                    startTransition(async () => {
                        try {
                            const response = await fetch(url, { signal: ctrl.current.signal }); // BdApi.Net.fetch will reject blobs
                            if (!response.headers.get("Content-Type").startsWith("image")) {
                                throw new Error("Url is not an image");
                            }
                            const blob = await response.blob();
                            const bitmap = await createImageBitmap(blob);

                            internals.nativeUI[internals.keys.closeModalInAllContexts]?.("Media Viewer Modal");
                            utils.openEditor({
                                onSubmit: () => { userActions.current?.upload(); },
                                userActions,
                                bitmap
                            });
                        } catch (e) {
                            if (e.name === "AbortError") return;

                            BdApi.Logger.error(meta.slug, e);
                            UI.showToast("Could not fetch image.", { type: "error" });
                        }
                    });
                },
            })
        }) : jsx(BdApi.Components.Spinner, {
            type: BdApi.Components.Spinner.Type.SPINNING_CIRCLE_SIMPLE
        });
    },

    UploadIcon({ args }) {
        const [isPending, startTransition] = useTransition();
        const userActions = useRef(null);

        return !isPending ? jsx(Components.IconButton, {
            onClick: () => {
                startTransition(async () => {
                    try {
                        const bitmap = await createImageBitmap(args.upload.item.file);
                        utils.openEditor({
                            onSubmit: () => {
                                userActions.current?.replace({
                                    draftType: args.draftType,
                                    upload: args.upload,
                                });
                            },
                            userActions,
                            bitmap,
                        });
                    } catch {
                        UI.showToast("Could not load image", { type: "error" });
                    }
                });
            },
            tooltip: "Edit Image",
            d: utils.paths.Main
        }) : jsx(BdApi.Components.Spinner, {
            type: BdApi.Components.Spinner.Type.SPINNING_CIRCLE_SIMPLE
        });
    },

    /**
     * @typedef {{ visible: boolean, adjustments: LayerAdjustments, active: boolean, name: string, id: number }} LayerState
     *
     * @param {{
     *  layers: LayerState[],
     *  onChange: () => void, width: number, height: number, editor: React.RefObject<CanvasEditor>
     * }} props
     */
    LayerThumbnails({ layers, onChange, width, height, editor }) {
        /** @type {React.RefObject<number?>} */
        const dragIndex = useRef(null);
        const stableLayers = useRef(layers);
        /** @type {React.RefObject<(() => Promise<void>)[] >} */
        const actions = useRef([]);
        /** @type {React.RefObject<number?>} */
        const timer = useRef(null);

        useEffect(() => {
            if (stableLayers.current.length !== layers.length) {
                stableLayers.current = layers;
            } else {
                Object.assign(stableLayers.current, layers);
            }
        }, [layers]);

        /** @type {(e: React.MouseEvent<HTMLLIElement>, i: number) => void} */
        const handleContextMenu = useCallback((e, i) => {
            (i !== editor.current.activeLayerIndex) && editor.current.sandwichLayer(i);

            ContextMenu.open(e, ContextMenu.buildMenu([{
                label: "Name",
                type: "custom",
                render: () => jsx(Components.TextInput, {
                    className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                    label: "Name",
                    value: stableLayers.current[i].name,
                    onChange: newName => { editor.current.layers[i].layer.name = newName; onChange(); },
                })
            }, {
                label: "Visible",
                type: "toggle",
                checked: stableLayers.current[i].visible,
                action: () => {
                    editor.current.toggleLayerVisibility(i);
                    onChange();
                }
            }, {
                label: "Reset Transform",
                disabled: editor.current.layers[i].state.transform.isIdentity,
                action: () => {
                    actions.current.push(() => {
                        editor.current.resetLayerTransform(i);
                        onChange();
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.ResetTransform })
            }, {
                label: "Color Adjustments",
                type: "submenu",
                items: [{
                    label: "Reset Adjustments",
                    action: () => {
                        actions.current.push(() => {
                            if (editor.current.layers[i].layer.filter === "none") return;

                            editor.current.setLayerAdjustment(i, () => ({}), true);
                            onChange();
                        });
                    },
                    icon: () => jsx(Components.Icon, { d: utils.paths.ResetFilters })
                }, { type: "separator" }, {
                    label: "Opacity",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.opacity ?? 1,
                        minValue: 0,
                        maxValue: 1,
                        label: "Opacity",
                        decimals: 2,
                        expScaling: false,
                        onChange: val => {
                            const opacity = val === 1 ? undefined : val;
                            if (opacity === editor.current.layers[i].state.adjustments.opacity) return;
                            editor.current.setLayerAdjustment(i, ({ opacity: o, ...p }) => ({ ...p, opacity }), true);
                            onChange();
                        },
                        onSlide: opacity => editor.current.setLayerAdjustment(i, ({ opacity: o, ...p }) => ({ ...p, opacity }))
                    })
                }, {
                    label: "Brightness",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Brightness",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.brightness ?? 100,
                        minValue: 0,
                        maxValue: 300,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const brightness = val === 100 ? undefined : val;
                            if (brightness === editor.current.layers[i].state.adjustments.brightness) return;
                            editor.current.setLayerAdjustment(i, ({ brightness: b, ...p }) => ({ ...p, brightness }), true);
                            onChange();
                        },
                        onSlide: brightness => editor.current.setLayerAdjustment(i, ({ brightness: b, ...p }) => ({ ...p, brightness }))
                    })
                }, {
                    label: "Contrast",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Contrast",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.contrast ?? 100,
                        minValue: 0,
                        maxValue: 300,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const contrast = val === 100 ? undefined : val;
                            if (contrast === editor.current.layers[i].state.adjustments.contrast) return;
                            editor.current.setLayerAdjustment(i, ({ contrast: c, ...p }) => ({ ...p, contrast }), true);
                            onChange();
                        },
                        onSlide: contrast => editor.current.setLayerAdjustment(i, ({ contrast: c, ...p }) => ({ ...p, contrast }))
                    })
                }, {
                    label: "Greyscale",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Greyscale",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.grayscale ?? 0,
                        minValue: 0,
                        maxValue: 100,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const grayscale = val === 0 ? undefined : val;
                            if (grayscale === editor.current.layers[i].state.adjustments.grayscale) return;
                            editor.current.setLayerAdjustment(i, ({ grayscale: g, ...p }) => ({ ...p, grayscale }), true);
                            onChange();
                        },
                        onSlide: grayscale => editor.current.setLayerAdjustment(i, ({ grayscale: g, ...p }) => ({ ...p, grayscale }))
                    })
                }, {
                    label: "Hue-Rotate",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Hue-Rotate",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments["hue-rotate"] ?? 0,
                        minValue: 0,
                        maxValue: 360,
                        suffix: "°",
                        expScaling: false,
                        onChange: val => {
                            const hueRotate = val === 0 ? undefined : val;
                            if (hueRotate === editor.current.layers[i].state.adjustments["hue-rotate"]) return;
                            editor.current.setLayerAdjustment(i, ({ "hue-rotate": h, ...p }) => ({ ...p, "hue-rotate": hueRotate }), true);
                            onChange();
                        },
                        onSlide: hueRotate => editor.current.setLayerAdjustment(i, ({ "hue-rotate": h, ...p }) => ({ ...p, "hue-rotate": hueRotate }))
                    })
                }, {
                    label: "Invert",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Invert",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.invert ?? 0,
                        minValue: 0,
                        maxValue: 100,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const invert = val === 0 ? undefined : val;
                            if (invert === editor.current.layers[i].state.adjustments.invert) return;
                            editor.current.setLayerAdjustment(i, ({ invert: i, ...p }) => ({ ...p, invert }), true);
                            onChange();
                        },
                        onSlide: invert => editor.current.setLayerAdjustment(i, ({ invert: i, ...p }) => ({ ...p, invert }))
                    })
                }, {
                    label: "Saturate",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Saturate",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.saturate ?? 100,
                        minValue: 0,
                        maxValue: 300,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const saturate = val === 100 ? undefined : val;
                            if (saturate === editor.current.layers[i].state.adjustments.saturate) return;
                            editor.current.setLayerAdjustment(i, ({ saturate: s, ...p }) => ({ ...p, saturate }), true);
                            onChange();
                        },
                        onSlide: saturate => editor.current.setLayerAdjustment(i, ({ saturate: s, ...p }) => ({ ...p, saturate }))
                    })
                }, {
                    label: "Sepia",
                    type: "custom",
                    render: () => jsx(Components.NumberSlider, {
                        label: "Sepia",
                        className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                        value: stableLayers.current[i].adjustments.sepia ?? 0,
                        minValue: 0,
                        maxValue: 100,
                        suffix: "%",
                        expScaling: false,
                        onChange: val => {
                            const sepia = val === 0 ? undefined : val;
                            if (sepia === editor.current.layers[i].state.adjustments.sepia) return;
                            editor.current.setLayerAdjustment(i, ({ sepia: s, ...p }) => ({ ...p, sepia }), true);
                            onChange();
                        },
                        onSlide: sepia => editor.current.setLayerAdjustment(i, ({ sepia: s, ...p }) => ({ ...p, sepia }))
                    })
                }]
            }, { type: "separator" }, {
                label: "Copy Layer Contents",
                action: () => {
                    actions.current.push(async () => {
                        if (!DiscordNative?.clipboard?.copyImage) return;

                        UI.showToast("Processing...", { type: "warning" });
                        try {
                            const blob = await editor.current.copyLayerContents(i);
                            if (!blob) throw new Error("Layer index out of range.");

                            const buffer = await blob.arrayBuffer();
                            await DiscordNative.clipboard.copyImage(new Uint8Array(buffer), "image.png");
                            UI.showToast("Layer copied", { type: "success" });
                        } catch (err) {
                            UI.showToast("Failed to copy image", { type: "error" });
                            BdApi.Logger.error(meta.slug, err);
                        }
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.CopyLayer })
            }, {
                label: "Duplicate Layer",
                action: () => {
                    actions.current.push(async () => {
                        await editor.current.duplicateLayer(i);
                        onChange();
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.DuplicateLayer })
            }, { type: "separator" }, {
                label: "Move Layer Up",
                disabled: i >= stableLayers.current.length - 1,
                action: () => {
                    if (i >= editor.current.layers.length - 1) return;

                    actions.current.push(() => {
                        editor.current.moveLayers(1, i);
                        onChange();
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.MoveLayerUp })
            }, {
                label: "Move Layer Down",
                disabled: i <= 0,
                action: () => {
                    if (i <= 0) return;

                    actions.current.push(() => {
                        editor.current.moveLayers(-1, i);
                        onChange();
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.MoveLayerDown })
            }, {
                label: "Remove Layer",
                color: "danger",
                disabled: stableLayers.current.length <= 1,
                action: () => {
                    if (editor.current.layers.length <= 1) return;

                    actions.current.push(() => {
                        editor.current.deleteLayer(i);
                        onChange();
                    });
                },
                icon: () => jsx(Components.Icon, { d: utils.paths.DeleteLayer })
            }]), {
                align: "bottom",
                position: "center",
                onClose: () => {
                    // For some stupid reason, onClose is called before the action of a menu item.
                    // So use timeout to "wait" until the action is added to the set,
                    // then execute them as callbacks, and only then we can cleanup...
                    if (timer.current != null) {
                        clearTimeout(timer.current);
                        timer.current == null;
                    }
                    timer.current = setTimeout(async () => {
                        await Promise.all(actions.current.map(f => f()));
                        actions.current = [];
                        timer.current = null;

                        if (i !== editor.current.activeLayerIndex) {
                            editor.current.sandwichLayer();
                        }
                    });
                }
            });
        }, [onChange]);

        return jsx(Components.ErrorBoundary, null, jsx("div", {
            className: utils.clsx("thumbnails", internals.scrollbarClass?.thin),
            children: jsx("ul", {
                className: "thumbnails-wrapper",
                children: layers.map((state, i) => jsx(internals.nativeUI[internals.keys.FocusRing], {
                    key: state.id,
                    children: jsx("li", {
                        tabIndex: 0,
                        draggable: true,
                        onDragStart: e => {
                            e.currentTarget.classList.add("dragging");
                            e.dataTransfer.setData("text/plain", String(i));
                            e.dataTransfer.effectAllowed = "move";
                            dragIndex.current = i;
                        },
                        onDragEnd: e => {
                            e.currentTarget.classList.remove("dragging");
                            dragIndex.current = null;
                        },
                        onDragEnter: e => { e.currentTarget.classList.add("droptarget"); },
                        onDragLeave: e => { !e.currentTarget.contains(e.relatedTarget) && e.currentTarget.classList.remove("droptarget"); },
                        onDrop: e => {
                            e.currentTarget.classList.remove("droptarget");
                            if (dragIndex.current != null) {
                                editor.current.moveLayers(i - dragIndex.current, dragIndex.current);
                                onChange();
                            }
                        },
                        onContextMenu: e => { handleContextMenu(e, i); },
                        onClick: e => {
                            if (editor.current.activeLayerIndex === i) return;
                            editor.current.activeLayerIndex = i;
                            e.currentTarget.scrollIntoView({ block: "nearest" });
                            onChange();
                        },
                        onKeyDown: e => {
                            if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                e.currentTarget.click();
                            }
                        },
                        className: utils.clsx("thumbnail", state.active && "active"),
                        children: [
                            jsx(Components.Thumbnail, { index: i, editor, width, height }),
                            jsx("span", { className: "layer-label" }, state.name),
                            jsx(Components.IconButton, {
                                className: "layer-visibility",
                                tooltip: state.visible ? "Visible" : "Hidden",
                                d: state.visible ? utils.paths.Visibility : utils.paths.VisibilityOff,
                                onClick: () => {
                                    editor.current.toggleLayerVisibility(i);
                                    onChange();
                                },
                            }),
                        ]
                    })
                }))
            })
        }));
    },

    /** @param {{index: number, editor: React.RefObject<CanvasEditor>, width: number, height: number}} */
    Thumbnail({ index, editor, width, height }) {
        /** @type {React.RefObject<HTMLCanvasElement | null>} */
        const canvas = useRef(null);

        useEffect(() => {
            canvas.current.getContext("2d").imageSmoothingEnabled = false;
        }, [width, height]);

        useEffect(() => {
            // on mount, force render initial thumbnail.
            const s = Math.max(canvas.current.width / width, canvas.current.height / height);
            editor.current.layers[index].layer.drawThumbnailOn(canvas.current, s, true);
        }, []);

        useEffect(() => {
            const s = Math.max(canvas.current.width / width, canvas.current.height / height);
            editor.current.layers[index].layer.drawThumbnailOn(canvas.current, s);
        }); // yes, no dependency! Update the thumbnail on rerenders. However, repainting will only occur if thumbnail is stale!

        return jsx("canvas", {
            width: ~~Math.min(40, 40 * width / height),
            height: ~~Math.min(40, 40 / width * height),
            className: "canvas-thumbnail",
            ref: canvas,
        });
    },

    /** @param {{bitmap: ImageBitmap, ref: React.RefObject<any>}} props */
    ImageEditor({ bitmap, ref }) {
        const [canUndoRedo, setCanUndoRedo] = useState(0);
        /** @type {[LayerState[], React.Dispatch<React.SetStateAction<LayerState[]>>]} */
        const [layers, setLayers] = useState(() => []);
        const [dims, setDims] = useState({ width: bitmap.width, height: bitmap.height });

        const [mode, _setMode] = useState(null);
        const [font, setFont] = hooks.useStoredState("font", () => ({ family: "gg sans", weight: 500 }));
        const [fixedAspect, setFixedAspect] = hooks.useStoredState("fixedAspectRatio", true);
        const [strokeStyle, setStrokeStyle] = hooks.useStoredState("strokeStyle", () => ({ width: 25, color: "#000000" }));

        const isInteracting = useRef(false);
        /** @type { React.RefObject<HTMLCanvasElement?> } */
        const canvasRef = useRef(null);
        const canvasRect = useRef(new DOMRect());
        /** @type { React.RefObject<CanvasEditor?> } */
        const editor = useRef(null);
        /** @type { React.RefObject<HTMLDivElement?> } */
        const overlay = useRef(null);
        /** @type { React.RefObject<{ focus: () => void }> } */
        const textarea = useRef(null);
        /**  @type { React.RefObject<{ setValue: (value: number) => void, previewValue: (value: number) => void }?> } */
        const auxRef = useRef(null);

        const setMode = useCallback(newVal => {
            if (isInteracting.current) return;

            _setMode(oldMode => {
                const newMode = newVal instanceof Function ? newVal(oldMode) : newVal;
                ["--translate", "--line-from", "--phi", "r", "--brushsize"].forEach(prop => { overlay.current.style.removeProperty(prop); });

                if (newMode === 1) {
                    const { x: ctx, y: cty } = utils.getTranslate(editor.current.viewportTransform);
                    overlay.current.style.setProperty("--translate", `${ctx.toFixed(1)}px ${cty.toFixed(1)}px`);
                }
                return newMode;
            });
        }, []);

        useImperativeHandle(ref, () => ({
            replace({ draftType, upload }) {
                UI.showToast("Processing...", { type: "warning" });
                editor.current?.toBlob({ type: Data.load(meta.slug, "exportType") ?? "image/webp" }).then(blob => {
                    internals.uploadDispatcher.setFile({
                        channelId: upload.channelId,
                        id: upload.id,
                        draftType,
                        file: {
                            file: new File([blob], upload.item.file.name.match(/.*\./i)[0] + (blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg"), { type: blob.type }),
                            isThumbnail: upload.isThumbnail,
                            origin: upload.origin,
                            platform: upload.item.platform,
                            compressionMetadata: {
                                compressTimeMs: 0,
                                earlyClipboardCompressionAttempted: false,
                                originalContentType: blob.type,
                                preCompressionSize: blob.size,
                            }
                        }
                    });
                    UI.showToast("Saved changes", { type: "success" });
                }).catch(() => {
                    UI.showToast("Failed to process image.", { type: "error" });
                });
            },
            upload() {
                const channelId = internals.SelectedChannelStore.getCurrentlySelectedChannelId();
                if (!channelId) return;

                UI.showToast("Processing...", { type: "warning" });
                editor.current?.toBlob({ type: Data.load(meta.slug, "exportType") ?? "image/webp" }).then(blob => {
                    internals.uploadDispatcher.addFile({
                        file: {
                            file: new File([blob], `image.${(blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg")}`, { type: blob.type }),
                            isThumbnail: false,
                            origin: "clipboard",
                            platform: 1 // 0: React Native, 1: Web
                        },
                        channelId,
                        showLargeMessageDialog: false,
                        draftType: 0,
                    });
                    UI.showToast("Saved changes", { type: "success" });
                }).catch(() => {
                    UI.showToast("Failed to process image.", { type: "error" });
                });
            }
        }), []);

        const updateClipRect = useCallback(() => {
            const { clipRect } = editor.current;
            if (!clipRect) return;

            overlay.current.style.setProperty("--cx1", `${100 * clipRect.left}%`);
            overlay.current.style.setProperty("--cx2", `${100 * clipRect.right}%`);
            overlay.current.style.setProperty("--cy1", `${100 * clipRect.top}%`);
            overlay.current.style.setProperty("--cy2", `${100 * clipRect.bottom}%`);
        }, []);

        const updateRegionRect = useCallback(() => {
            const rect = editor.current.regionRect;
            if (!rect) return;

            overlay.current.style.setProperty("--rx1", `${100 * rect.left}%`);
            overlay.current.style.setProperty("--rx2", `${100 * rect.right}%`);
            overlay.current.style.setProperty("--ry1", `${100 * rect.top}%`);
            overlay.current.style.setProperty("--ry2", `${100 * rect.bottom}%`);
        }, []);

        const syncStates = useCallback(() => {
            setCanUndoRedo(editor.current.canUndo << 1 ^ editor.current.canRedo);
            setDims(d => {
                const { width, height } = editor.current.canvasDims;
                if (d.width === width && d.height === height)
                    return d;
                editor.current.startRegionSelect(new DOMPoint(0, 0));
                editor.current.endRegionSelect();
                ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                return { width, height };
            });
            setLayers(editor.current.layers.map((layer, i) => ({
                visible: layer.state.isVisible,
                adjustments: layer.state.adjustments,
                active: i === editor.current.activeLayerIndex,
                name: layer.layer.name,
                id: layer.layer.id,
            })));
        }, []);

        useEffect(() => {
            const rect = canvasRef.current.offsetParent.getBoundingClientRect();
            canvasRef.current.width = ~~(rect.width);
            canvasRef.current.height = ~~(rect.height);
            canvasRect.current = canvasRef.current.getBoundingClientRect();
            editor.current = new CanvasEditor(canvasRef.current, bitmap);
            setLayers(editor.current.layers.map((layer, i) => ({
                visible: layer.state.isVisible,
                adjustments: layer.state.adjustments,
                active: i === editor.current.activeLayerIndex,
                name: layer.layer.name,
                id: layer.layer.id
            })));

            const ctrl = new AbortController();
            addEventListener("keydown", e => {
                if (document.activeElement.tagName === "INPUT") return;

                let matchedCase = true;
                switch (e.key) {
                    case !isInteracting.current && (e.ctrlKey || e.metaKey) && "z":
                        if (editor.current.undo()) { e.preventDefault(); syncStates(); }
                        break;

                    case !isInteracting.current && (e.ctrlKey || e.metaKey) && "y":
                        if (editor.current.redo()) { e.preventDefault(); syncStates(); }
                        break;

                    case !isInteracting.current && !e.repeat && (e.ctrlKey || e.metaKey) && DiscordNative?.clipboard?.copyImage && "c":
                        UI.showToast("Processing...", { type: "warning" });
                        editor.current.toBlob({
                            type: "image/png"
                        }).then(blob =>
                            blob.arrayBuffer()
                        ).then(buffer => {
                            DiscordNative.clipboard.copyImage(new Uint8Array(buffer), "image.png");
                        }).then(() => {
                            UI.showToast("Image copied", { type: "success" });
                        }).catch(() => {
                            UI.showToast("Failed to copy image", { type: "error" });
                        });
                        break;

                    case !e.repeat && (e.ctrlKey || e.metaKey) && "b":
                        editor.current.resetViewport();
                        editor.current.refreshViewport();
                        if (canvasRef.current?.matches(".rotating")) {
                            overlay.current.style.removeProperty("--translate");
                        }
                        if (canvasRef.current?.matches(".texting")) {
                            updateRegionRect();
                        }
                        updateClipRect();
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "c":
                        setMode(m => m === 0 ? null : 0);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "r":
                        setMode(m => m === 1 ? null : 1);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "m":
                        setMode(m => m === 2 ? null : 2);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "s":
                        setMode(m => m === 3 ? null : 3);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "b":
                        setMode(m => m === 4 ? null : 4);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "t":
                        setMode(m => m === 5 ? null : 5);
                        break;

                    case !e.repeat && !(e.ctrlKey || e.metaKey) && "e":
                        setMode(m => m === 6 ? null : 6);
                        break;

                    case !e.repeat && "p":
                        if (e.ctrlKey || e.metaKey) {
                            if (isInteracting.current) break;
                            editor.current.startRegionSelect(new DOMPoint(0, 0));
                            editor.current.endRegionSelect();
                            ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                        } else {
                            setMode(m => m === 7 ? null : 7);
                        }
                        break;

                    case !e.repeat && canvasRef.current.matches(".drawing") && "Shift": {
                        const { lastPoint } = editor.current;
                        if (!lastPoint || isInteracting.current) break;
                        overlay.current.style.setProperty("--line-from", `${lastPoint.x}px ${lastPoint.y}px`);
                        overlay.current.style.setProperty("--phi", "0deg");
                        overlay.current.style.setProperty("--r", "0px");
                        break;
                    }

                    case "Escape": {
                        if (!isInteracting.current && editor.current.clipRect) {
                            editor.current.startRegionSelect(new DOMPoint(0, 0));
                            editor.current.endRegionSelect();
                            ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                            break;
                        }
                        if (isInteracting.current && !canvasRef.current.matches(".texting")) {
                            break;
                        }
                        /* falls through */
                    }

                    default: {
                        matchedCase = false;
                    }
                }
                matchedCase && e.stopPropagation();
            }, { signal: ctrl.signal, capture: true });
            addEventListener("keyup", e => {
                if (e.key === "Shift") {
                    overlay.current.style.removeProperty("--line-from");
                    overlay.current.style.removeProperty("--phi");
                    overlay.current.style.removeProperty("--r");
                }
            }, ctrl);
            addEventListener("resize", () => {
                const rect = canvasRef.current.offsetParent.getBoundingClientRect();
                editor.current.viewportDims = { width: ~~(rect.width), height: ~~(rect.height) };
                editor.current.setImageSmoothing(Data.load(meta.slug, "smoothing") ?? "auto");
                editor.current.refreshViewport();

                updateClipRect();
                canvasRect.current = canvasRef.current.getBoundingClientRect();
            }, ctrl);
            addEventListener("paste", async e => {
                e.stopPropagation();
                const { items } = e.clipboardData;
                for (const index in items) {
                    const item = items[index];
                    if (item.kind === "file") {
                        const file = item.getAsFile();
                        if (!file) continue;

                        const bitmap = await createImageBitmap(file);
                        editor.current.createNewLayer(bitmap);
                        syncStates();
                        break;
                    }
                }
            }, { signal: ctrl.signal, capture: true });

            return () => {
                ctrl.abort();
                editor.current = null;
                bitmap?.close();
            };
        }, []);

        /** @type {(e: React.MouseEvent<HTMLElement>) => void} */
        const handleMouseMove = useCallback(e => {
            if (mode !== 4 && mode !== 6 || (e.buttons & ~4)) return;

            if (e.shiftKey) {
                const { lastPoint } = editor.current;
                if (!lastPoint) return;
                overlay.current.style.setProperty("--line-from", `${lastPoint.x}px ${lastPoint.y}px`);
                const phi = utils.atan2(e.clientX - canvasRect.current.x - lastPoint.x, e.clientY - canvasRect.current.y - lastPoint.y);
                const r = Math.hypot(e.clientY - canvasRect.current.y - lastPoint.y, e.clientX - canvasRect.current.x - lastPoint.x);
                overlay.current.style.setProperty("--phi", `${phi || 0}deg`);
                overlay.current.style.setProperty("--r", `${r || 0}px`);
            } else if (overlay.current.style.getPropertyValue("--r")) {
                ["--line-from", "--phi", "--r"].forEach(prop => { overlay.current.style.removeProperty(prop); });
            }
        }, [mode]);

        const handleWheel = hooks.useDebouncedWheel({
            onChange: e => {
                if (mode === 3 && !(e.ctrlKey || e.metaKey)) {
                    const delta = 1 - 0.05 * Math.sign(e.deltaY);
                    const { x: ctx, y: cty } = utils.getTranslate(editor.current.viewportTransform);
                    const viewportScale = utils.getScale(editor.current.viewportTransform);
                    const boxScale = canvasRect.current.width / canvasRef.current.width;

                    const Tx = (e.clientX - (canvasRect.current.x + canvasRect.current.width / 2 + ctx * boxScale)) / viewportScale;
                    const Ty = (e.clientY - (canvasRect.current.y + canvasRect.current.height / 2 + cty * boxScale)) / viewportScale;

                    editor.current.previewLayerTransformBy(new DOMMatrix().scaleSelf(delta, delta, 1, Tx, Ty));

                    const cs = utils.getScale(editor.current.previewLayerTransform).toFixed(2);
                    auxRef.current?.previewValue(cs);

                    isInteracting.current = true;
                } else {
                    const delta = 1 - 0.05 * Math.sign(e.deltaY);
                    const x = (e.clientX - canvasRect.current.x) / canvasRect.current.width;
                    const y = (e.clientY - canvasRect.current.y) / canvasRect.current.height;
                    editor.current.scaleViewportBy(delta, x, y);
                    updateClipRect();

                    switch (mode) {
                        case 1: {
                            const { x: ctx, y: cty } = utils.getTranslate(editor.current.viewportTransform);
                            overlay.current.style.setProperty("--translate", `${ctx.toFixed(1)}px ${cty.toFixed(1)}px`);
                            break;
                        }
                        case isInteracting.current && 5: {
                            updateRegionRect();
                            break;
                        }
                        case 4:
                        case 6: {
                            handleMouseMove(e);
                            break;
                        }
                    }
                }
            },
            onSubmit: () => {
                if (mode === 3 && isInteracting.current) {
                    isInteracting.current = false;
                    editor.current.finalizeLayerPreview();
                    syncStates();

                    const cs = utils.getScale(editor.current.previewLayerTransform).toFixed(2);
                    auxRef.current?.setValue(cs);
                }
            }
        });

        const pointerHandlers = hooks.usePointerCapture({
            onStart: (e, store) => {
                Object.assign(store, {
                    changed: false,
                    startX: e.clientX,
                    startY: e.clientY,
                });

                if (mode !== 5 && !(e.buttons & 4 || mode == null || mode === 3)) isInteracting.current = true;

                switch (mode) {
                    case !!(e.buttons & 1) && 7:
                    case !!(e.buttons & 1) && 0: {
                        canvasRef.current.classList.add("pointerdown");
                        const boxScale = canvasRect.current.width / canvasRef.current.width;
                        const startX = (e.clientX - canvasRect.current.x) / boxScale;
                        const startY = (e.clientY - canvasRect.current.y) / boxScale;
                        editor.current.startRegionSelect(new DOMPoint(startX, startY), mode === 0 ? fixedAspect : false);
                        ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                        break;
                    }
                    case !!(e.buttons & 1) && 1: {
                        canvasRef.current.classList.add("pointerdown");
                        break;
                    }
                    case !!(e.buttons & 1) && 5: {
                        store.changed = true;

                        const boxScale = canvasRect.current.width / canvasRef.current.width;
                        const startX = (e.clientX - canvasRect.current.x) / boxScale;
                        const startY = (e.clientY - canvasRect.current.y) / boxScale;
                        editor.current.insertTextAt(new DOMPoint(startX, startY), `${font.weight} ${strokeStyle.width}px ${font.family}`, strokeStyle.color);
                        editor.current.updateText();
                        updateRegionRect();
                        break;
                    }
                    case !!(e.buttons & 1) && 4:
                    case !!(e.buttons & 1) && 6: {
                        store.changed = true;

                        const { lastPoint } = editor.current;
                        if (e.shiftKey && lastPoint) {
                            const boxScale = canvasRect.current.width / canvasRef.current.width;
                            const toX = (e.clientX - canvasRect.current.x) / boxScale;
                            const toY = (e.clientY - canvasRect.current.y) / boxScale;

                            editor.current.startDrawing(
                                lastPoint,
                                strokeStyle.width,
                                strokeStyle.color,
                                mode === 6 ? "destination-out" : "source-over"
                            );

                            editor.current.lineTo(new DOMPoint(toX, toY));

                            canvasRef.current.releasePointerCapture(e.pointerId);

                            ["--line-from", "--phi", "--r"].forEach(prop => { overlay.current.style.removeProperty(prop); });
                        } else {
                            const boxScale = canvasRect.current.width / canvasRef.current.width;
                            const startX = (e.clientX - canvasRect.current.x) / boxScale;
                            const startY = (e.clientY - canvasRect.current.y) / boxScale;
                            editor.current.startDrawing(
                                new DOMPoint(startX, startY),
                                strokeStyle.width,
                                strokeStyle.color,
                                mode === 6 ? "destination-out" : "source-over"
                            );
                        }
                        break;
                    }
                }
            },
            onChange: (e, store) => {
                if (e.buttons & 4 || mode == null || mode === 3) {
                    const dx = (e.clientX - store.startX) / canvasRect.current.width * canvasRef.current.width;
                    const dy = (e.clientY - store.startY) / canvasRect.current.height * canvasRef.current.height;
                    editor.current.translateViewportBy(dx, dy);

                    updateClipRect();

                    if (isInteracting.current && mode === 5) {
                        updateRegionRect();
                    }

                    if (mode === 1) {
                        const { x: ctx, y: cty } = utils.getTranslate(editor.current.viewportTransform);
                        overlay.current.style.setProperty("--translate", `${ctx.toFixed(1)}px ${cty.toFixed(1)}px`);
                    }

                    if (e.shiftKey && (mode === 4 || mode === 6)) {
                        handleMouseMove(e);
                    }
                } else {
                    store.changed = true;
                    switch (mode) {
                        case 7:
                        case 0: {
                            const boxScale = canvasRect.current.width / canvasRef.current.width;
                            const startX = (e.clientX - canvasRect.current.x) / boxScale;
                            const startY = (e.clientY - canvasRect.current.y) / boxScale;
                            editor.current.regionSelect(new DOMPoint(startX, startY));

                            updateClipRect();
                            break;
                        }
                        case 1: {
                            const currentTranslate = utils.getTranslate(editor.current.viewportTransform);
                            const boxScale = canvasRect.current.width / canvasRef.current.width;

                            const currentX = e.clientX - (canvasRect.current.x + canvasRect.current.width / 2 + currentTranslate.x * boxScale);
                            const currentY = e.clientY - (canvasRect.current.y + canvasRect.current.height / 2 + currentTranslate.y * boxScale);

                            const previousX = currentX - (e.clientX - store.startX);
                            const previousY = currentY - (e.clientY - store.startY);

                            const dTheta = utils.atan2(
                                previousX * currentX + previousY * currentY,
                                previousX * currentY - previousY * currentX
                            );

                            editor.current.previewLayerTransformBy(new DOMMatrix().rotateSelf(dTheta));

                            const cr = utils.getAngle(editor.current.previewLayerTransform).toFixed(1);
                            auxRef.current?.previewValue(cr);
                            break;
                        }
                        case 5: {
                            store.changed = true;

                            const boxScale = canvasRect.current.width / canvasRef.current.width;
                            const startX = (e.clientX - canvasRect.current.x) / boxScale;
                            const startY = (e.clientY - canvasRect.current.y) / boxScale;
                            editor.current.insertTextAt(new DOMPoint(startX, startY), `${font.weight} ${strokeStyle.width}px ${font.family}`, strokeStyle.color);
                            editor.current.updateText();
                            updateRegionRect();
                            break;
                        }
                        case 2: {
                            const dx = (e.clientX - store.startX) / utils.getScale(editor.current.viewportTransform);
                            const dy = (e.clientY - store.startY) / utils.getScale(editor.current.viewportTransform);
                            editor.current.previewLayerTransformBy(new DOMMatrix().translateSelf(dx, dy));
                            break;
                        }
                        case 6:
                        case 4: {
                            const boxScale = canvasRect.current.width / canvasRef.current.width;
                            const startX = (e.clientX - canvasRect.current.x) / boxScale;
                            const startY = (e.clientY - canvasRect.current.y) / boxScale;
                            editor.current.curveTo(new DOMPoint(startX, startY));
                            break;
                        }
                    }
                }
                Object.assign(store, {
                    startX: e.clientX,
                    startY: e.clientY
                });
            },
            onSubmit: (e, store) => {
                if (mode !== 5 && !(e.buttons & 4 || mode == null || mode === 3)) isInteracting.current = false;

                switch (mode) {
                    case 7: {
                        editor.current.endRegionSelect();
                        canvasRef.current.classList.remove("pointerdown");
                        ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                        updateClipRect();
                        break;
                    }
                    case 0: {
                        editor.current.endRegionSelect();
                        canvasRef.current.classList.remove("pointerdown");
                        ["--cx1", "--cx2", "--cy1", "--cy2"].forEach(a => { overlay.current.style.removeProperty(a); });
                        if (store.changed && editor.current.cropToRegionRect()) {
                            syncStates();
                            editor.current.resetViewport();
                            editor.current.refreshViewport();
                        }
                        break;
                    }
                    case store.changed && 1: {
                        canvasRef.current.classList.remove("pointerdown");
                        const cr = utils.getAngle(editor.current.previewLayerTransform).toFixed(1);
                        auxRef.current?.setValue(cr);
                    } /* falls through */
                    case store.changed && 2: {
                        editor.current.finalizeLayerPreview();
                        syncStates();
                        break;
                    }
                    case store.changed && 5: {
                        isInteracting.current = true;
                        textarea.current.focus();
                        break;
                    }
                    case store.changed && 4:
                    case store.changed && 6: {
                        editor.current.endDrawing();
                        syncStates();
                        break;
                    }
                }
            }
        });

        return jsx(Fragment, {
            children: [
                jsx("div", {
                    className: "canvas-wrapper",
                    children: [
                        jsx("canvas", {
                            className: utils.clsx("canvas", ["cropping", "rotating", "moving", "scaling", "drawing", "texting", "drawing", "selecting"][mode]),
                            ref: canvasRef,
                            onWheel: handleWheel,
                            onMouseMove: handleMouseMove,
                            ...pointerHandlers,
                        }),
                        jsx("div", {
                            className: "canvas-overlay",
                            ref: overlay,
                            children: [
                                jsx("div", { className: "cropper-region" }),
                                jsx("div", {
                                    className: "cropper-border",
                                    children: mode === 5 && jsx(Components.TextAreaHidden, {
                                        ref: textarea,
                                        onSubmit: () => {
                                            editor.current.finalizeText();
                                            syncStates();
                                            isInteracting.current = false;
                                            ["--rx1", "--rx2", "--ry1", "--ry2"].forEach(prop => { overlay.current.style.removeProperty(prop); });
                                        },
                                        onChange: value => {
                                            editor.current.updateText(value);
                                            updateRegionRect();
                                        }
                                    })
                                })
                            ]
                        })
                    ]
                }),
                jsx("aside", {
                    className: utils.clsx("sidebar", internals.scrollbarClass?.thin),
                    children: [
                        jsx(Components.Resizer, {
                            dimensions: dims,
                            layerCount: editor.current?.layers.length ?? 0,
                            onCanvasResize: ({ width: w, height: h }) => {
                                const { width, height } = editor.current.canvasDims;
                                if (w === width && h === height) return;

                                editor.current.canvasDims = { width: w, height: h };
                                editor.current.resetViewport();
                                editor.current.fullRender();
                                syncStates();
                            },
                            onImageResize: p => {
                                if (p === 1) return;

                                const { width, height } = editor.current.canvasDims;
                                const newWidth = Math.round(width * p);
                                const newHeight = Math.round(height * p);
                                p = Math.max(newWidth / width, newHeight / height);

                                editor.current.canvasDims = { width: newWidth, height: newHeight };
                                editor.current.scale(p, p);
                                editor.current.resetViewport();
                                editor.current.fullRender();
                                syncStates();
                            }
                        }),
                        jsx("div", {
                            className: "canvas-actions",
                            children: [
                                jsx(Components.IconButton, {
                                    tooltip: "Draw (B)",
                                    d: utils.paths.Draw,
                                    active: mode === 4,
                                    onClick: () => setMode(m => m === 4 ? null : 4)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Eraser (E)",
                                    d: utils.paths.Eraser,
                                    active: mode === 6,
                                    onClick: () => setMode(m => m === 6 ? null : 6)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Text (T)",
                                    d: utils.paths.Text,
                                    active: mode === 5,
                                    onClick: () => setMode(m => m === 5 ? null : 5)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Clip (P)",
                                    d: utils.paths.Select,
                                    active: mode === 7,
                                    onClick: () => setMode(m => m === 7 ? null : 7)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Move (M)",
                                    d: utils.paths.Pan,
                                    active: mode === 2,
                                    onClick: () => setMode(m => m === 2 ? null : 2)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Rotate (R)",
                                    d: utils.paths.Rotate,
                                    active: mode === 1,
                                    onClick: () => setMode(m => m === 1 ? null : 1)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Scale (S)",
                                    d: utils.paths.Scale,
                                    active: mode === 3,
                                    onClick: () => setMode(m => m === 3 ? null : 3)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Crop (C)",
                                    d: utils.paths.Crop,
                                    active: mode === 0,
                                    onClick: () => setMode(m => m === 0 ? null : 0)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Flip Horizontal",
                                    d: utils.paths.FlipH,
                                    onClick: () => {
                                        editor.current.scale(-1, 1);
                                        editor.current.fullRender();
                                        syncStates();
                                        if (mode === 1) {
                                            auxRef.current.setValue(utils.getAngle(editor.current.layerTransform).toFixed(1));
                                        }
                                    },
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Flip Vertical",
                                    d: utils.paths.FlipV,
                                    onClick: () => {
                                        editor.current.scale(1, -1);
                                        editor.current.fullRender();
                                        syncStates();
                                        if (mode === 1) {
                                            auxRef.current.setValue(utils.getAngle(editor.current.layerTransform).toFixed(1));
                                        }
                                    },
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Rotate Left",
                                    d: utils.paths.RotL,
                                    onClick: () => {
                                        editor.current.rotate(-90);
                                        syncStates();
                                        if (mode === 1) {
                                            auxRef.current.setValue(utils.getAngle(editor.current.layerTransform).toFixed(1));
                                        }
                                    },
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Rotate Right",
                                    d: utils.paths.RotR,
                                    onClick: () => {
                                        editor.current.rotate(90);
                                        syncStates();
                                        if (mode === 1) {
                                            auxRef.current.setValue(utils.getAngle(editor.current.layerTransform).toFixed(1));
                                        }
                                    },
                                })
                            ]
                        }),
                        jsx("div", {
                            className: "aux-inputs",
                            children: [
                                (mode === 4 || mode === 5) && jsx(Components.ColorInput, {
                                    colors: utils.paintingColors,
                                    value: strokeStyle.color,
                                    onChange: c => setStrokeStyle(s => ({ ...s, color: c }))
                                }),
                                (mode === 4 || mode === 5 || mode === 6) && jsx(Components.NumberSlider, {
                                    ref: auxRef,
                                    label: "Size",
                                    suffix: "px",
                                    minValue: 1,
                                    centerValue: 100,
                                    maxValue: 400,
                                    value: strokeStyle.width,
                                    onSlide: value => {
                                        switch (mode) {
                                            case 4:
                                            case 6: {
                                                const boxScale = canvasRect.current.width / canvasRef.current.width;
                                                const cs = utils.getScale(editor.current.viewportTransform);
                                                overlay.current.style.setProperty("--brushsize", (value * cs * boxScale).toFixed(4));
                                                break;
                                            }
                                            case isInteracting.current && 5: {
                                                editor.current.updateText(undefined, `${font.weight} ${value}px ${font.family}`);
                                                updateRegionRect();
                                                break;
                                            }
                                        }
                                    },
                                    onChange: value => {
                                        switch (mode) {
                                            case 4:
                                            case 6: {
                                                overlay.current.style.removeProperty("--brushsize");
                                                break;
                                            }
                                            case isInteracting.current && 5: {
                                                editor.current.updateText(undefined, `${font.weight} ${value}px ${font.family}`);
                                                updateRegionRect();
                                                break;
                                            }
                                        }
                                        setStrokeStyle(s => ({ ...s, width: value }));
                                    }
                                }),
                                mode === 5 && jsx(Components.ErrorBoundary, null, jsx(Components.FontSelector, { // to-do: Wrap in <Activity/> once Discord hits React 19.2.0
                                    value: font,
                                    onChange: setFont
                                })),
                                mode === 0 && jsx(Components.IconButton, {
                                    tooltip: fixedAspect ? "Preserve aspect ratio" : "Free region select",
                                    d: fixedAspect ? utils.paths.Lock : utils.paths.LockOpen,
                                    onClick: () => !isInteracting.current && setFixedAspect(e => !e),
                                }),
                                mode === 1 && jsx(Components.NumberSlider, {
                                    ref: auxRef,
                                    label: "Angle",
                                    suffix: "°",
                                    withSlider: false,
                                    value: editor.current ? Number(utils.getAngle(editor.current.layerTransform).toFixed(1)) : 0,
                                    onChange: value => {
                                        const cr = utils.getAngle(editor.current.layerTransform);
                                        const r = new DOMMatrix().rotateSelf(value - cr);
                                        editor.current.previewLayerTransformBy(r);
                                        editor.current.finalizeLayerPreview();
                                        syncStates();
                                    }
                                }),
                                mode === 3 && jsx(Components.NumberSlider, {
                                    ref: auxRef,
                                    label: "Scale",
                                    suffix: "x",
                                    decimals: 2,
                                    minValue: 0.01,
                                    centerValue: 1,
                                    maxValue: 10,
                                    value: editor.current ? Number(utils.getScale(editor.current.layerTransform).toFixed(2)) : 1,
                                    onSlide: s => {
                                        const cs = utils.getScale(editor.current.layerTransform);
                                        const S = new DOMMatrix().scaleSelf(s / cs, s / cs);
                                        editor.current.previewLayerTransformTo(S);
                                    },
                                    onChange: s => {
                                        const cs = utils.getScale(editor.current.layerTransform);
                                        const S = new DOMMatrix().scaleSelf(s / cs, s / cs);
                                        editor.current.previewLayerTransformTo(S);
                                        editor.current.finalizeLayerPreview();
                                        syncStates();
                                    }
                                }),
                            ]
                        }),
                        jsx(Components.LayerThumbnails, {
                            editor: editor,
                            width: dims.width,
                            height: dims.height,
                            layers,
                            onChange: syncStates
                        }),
                        jsx("div", {
                            className: "layer-actions",
                            children: [
                                jsx(Components.IconButton, {
                                    tooltip: "Add Layer",
                                    d: utils.paths.AddLayer,
                                    onClick: () => {
                                        editor.current.createNewLayer();
                                        syncStates();
                                    }
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Remove Layer",
                                    d: utils.paths.DeleteLayer,
                                    disabled: layers.length <= 1,
                                    onClick: () => {
                                        editor.current.deleteLayer();
                                        syncStates();
                                    }
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Move Layer Up",
                                    d: utils.paths.MoveLayerUp,
                                    disabled: editor.current?.activeLayerIndex >= layers.length - 1,
                                    onClick: () => {
                                        editor.current.moveLayers(1);
                                        syncStates();
                                    }
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Move Layer Down",
                                    d: utils.paths.MoveLayerDown,
                                    disabled: editor.current?.activeLayerIndex <= 0,
                                    onClick: () => {
                                        editor.current.moveLayers(-1);
                                        syncStates();
                                    }
                                }),
                            ]
                        }),
                        jsx("div", {
                            className: "undo-redo-actions",
                            children: [
                                jsx(Components.IconButton, {
                                    tooltip: "Undo (Ctrl + Z)",
                                    d: utils.paths.Undo,
                                    onClick: () => { if (editor.current.undo()) syncStates(); },
                                    disabled: !(canUndoRedo & 2)
                                }),
                                jsx(Components.IconButton, {
                                    tooltip: "Redo (Ctrl + Y)",
                                    d: utils.paths.Redo,
                                    onClick: () => { if (editor.current.redo()) syncStates(); },
                                    disabled: !(canUndoRedo & 1)
                                }),
                                jsx(Components.Settings, {
                                    onChange: ({ smoothing, background }) => {
                                        if (smoothing != null) editor.current.setImageSmoothing(smoothing);
                                        if (background != null) editor.current.backgroundColor = background;
                                        editor.current.refreshViewport();
                                    }
                                })
                            ]
                        })
                    ]
                }),
            ]
        });
    },

    /**
     * @param {{
     *  dimensions: {width: number, height: number}, onImageResize: (percentage: number) => void,
     *  layerCount: number, onCanvasResize: ({width: number, height: number}) => void
     * }}
     */
    Resizer({ dimensions, layerCount, onCanvasResize, onImageResize }) {
        /** @type {React.RefObject<{mode: number, keepAspect: boolean}?>} */
        const resize = useRef(Data.load(meta.slug, "resize") ?? { mode: 0, keepAspect: false });
        const menuData = useRef({ ...dimensions, canvasP: 100, imageP: 100 });

        const handleClick = e => {
            Object.assign(menuData.current, { width: dimensions.width, height: dimensions.height, canvasP: 100, imageP: 100 });
            const id = ContextMenu.open(e, ContextMenu.buildMenu([{
                label: "resize-selector",
                type: "custom",
                render: () => jsx(Components.ErrorBoundary, null, jsx(Components.MenuItemSelect, {
                    label: "Resize...",
                    options: [
                        { label: "Canvas (px)", value: 0 },
                        { label: "Canvas (%)", value: 1 },
                        { label: "Image  (%)", value: 2 },
                    ],
                    initialValue: resize.current.mode,
                    onChange: v => {
                        resize.current.mode = v;
                        Data.save(meta.slug, "resize", resize.current);
                    }
                }))
            }, {
                label: "resizer",
                type: "custom",
                render: () => jsx("div", {
                    className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                    children: [
                        jsx("style", null, `@scope {
                :scope {
                  display: grid;
                  justify-content: stretch;
                  font-size: 16px;
                  cursor: auto;
                }

                .number-input-wrapper label { font-size: 0.875em }
                #resizer-x .number-input { anchor-name: --resizer-x }
                #resizer-y .number-input { anchor-name: --resizer-y }

                .resizer-lock {
                  position: absolute;
                  top: anchor(--resizer-x center);
                  bottom: anchor(--resizer-y center);
                  right: max(anchor(--resizer-x left) + 8px, anchor(--resizer-y left) + 8px);
                  display: grid;
                  
                  .icon-button {
                    background: none;
                    padding: 0;
                    width: auto;
                    height: auto;
                    svg {
                      width: 14px;
                      height: 14px;
                    }
                  }
                  &::before,
                  &::after {
                    content: "";
                    position: relative;
                    left: 50%;
                    width: calc(50% + 4px);
                    border-inline-start: 1px solid hsl(from currentColor h s l / 0.5);
                  }
                  &::before {
                    border-block-start: 1px solid hsl(from currentColor h s l / 0.5);
                    border-start-start-radius: 4px;
                  }
                  &::after {
                    border-block-end: 1px solid hsl(from currentColor h s l / 0.5);
                    border-end-start-radius: 4px;
                  }
                }
              }`),
                        resize.current.mode === 0 && jsx(Fragment, null,
                            jsx(Components.NumberSlider, {
                                id: "resizer-x",
                                value: menuData.current.width,
                                minValue: 1,
                                label: "Width",
                                suffix: "px",
                                withSlider: false,
                                onChange: v => {
                                    menuData.current.width = Math.round(v);
                                    if (resize.current.keepAspect) {
                                        menuData.current.height = Math.round(menuData.current.width * dimensions.height / dimensions.width);
                                    }
                                }
                            }),
                            jsx(Components.NumberSlider, {
                                id: "resizer-y",
                                value: menuData.current.height,
                                minValue: 1,
                                label: "Height",
                                suffix: "px",
                                withSlider: false,
                                onChange: v => {
                                    menuData.current.height = Math.round(v);
                                    if (resize.current.keepAspect) {
                                        menuData.current.width = Math.round(menuData.current.height * dimensions.width / dimensions.height);
                                    }
                                }
                            }),
                            jsx("div", {
                                className: "resizer-lock",
                                children: jsx(Components.IconButton, {
                                    d: resize.current.keepAspect ? utils.paths.Lock : utils.paths.LockOpen,
                                    onClick: e => {
                                        resize.current.keepAspect = !resize.current.keepAspect;
                                        if (resize.current.keepAspect) {
                                            menuData.current.height = Math.round(menuData.current.width * dimensions.height / dimensions.width);
                                        }
                                        e.currentTarget.blur();
                                        e.currentTarget.focus();
                                        Data.save(meta.slug, "resize", resize.current);
                                    }
                                })
                            })
                        ),
                        resize.current.mode === 1 && jsx(Components.NumberSlider, {
                            value: menuData.current.canvasP,
                            minValue: 0.1,
                            label: "Scale",
                            decimals: 1,
                            suffix: "%",
                            withSlider: false,
                            onChange: v => { menuData.current.canvasP = v; }
                        }),
                        resize.current.mode === 2 && jsx(Components.NumberSlider, {
                            value: menuData.current.imageP,
                            minValue: 0.1,
                            label: "Scale",
                            decimals: 1,
                            suffix: "%",
                            withSlider: false,
                            onChange: v => { menuData.current.imageP = v; }
                        })
                    ]
                })
            }, { type: "separator" }, {
                label: "size-indicator",
                type: "custom",
                render: () => jsx("div", {
                    children: [
                        jsx("style", null, `@scope { :scope {
                display: flex;
                align-items: flex-end;
                justify-content: flex-end;
                gap: 4px;
                padding-inline: 8px;
                font-size: smaller;
              } }`),
                        jsx("span", { style: { marginInlineEnd: "auto" } },
                            `${((resize.current.mode === 0 ? menuData.current.width * menuData.current.height :
                                resize.current.mode === 1 ? Math.round(dimensions.width * dimensions.height * menuData.current.canvasP ** 2 / 100 ** 2) :
                                    Math.round(dimensions.width * dimensions.height * menuData.current.imageP ** 2 / 100 ** 2)) * layerCount / 65536).toFixed(2)} MiB`
                        ),
                        jsx("span", null,
                            resize.current.mode === 0 ? menuData.current.width :
                                resize.current.mode === 1 ? Math.round(dimensions.width * menuData.current.canvasP / 100) :
                                    Math.round(dimensions.width * menuData.current.imageP / 100)
                        ),
                        jsx("span", null, "⨯"),
                        jsx("span", null,
                            resize.current.mode === 0 ? menuData.current.height :
                                resize.current.mode === 1 ? Math.round(dimensions.height * menuData.current.canvasP / 100) :
                                    Math.round(dimensions.height * menuData.current.imageP / 100)
                        ),
                    ]
                })
            }, {
                label: "save",
                type: "custom",
                render: () => jsx(Components.ErrorBoundary, null, jsx("div", {
                    style: { minWidth: 200 },
                    className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                    children: jsx(internals.ManaButton[internals.keys.ManaButton], {
                        size: "sm",
                        fullWidth: true,
                        text: "Apply",
                        onClick: () => {
                            switch (resize.current.mode) {
                                case 0: {
                                    onCanvasResize({ width: menuData.current.width, height: menuData.current.height });
                                    break;
                                }
                                case 1: {
                                    const newWidth = Math.round(dimensions.width * menuData.current.canvasP / 100);
                                    const newHeight = Math.round(dimensions.height * menuData.current.canvasP / 100);
                                    onCanvasResize({ width: newWidth, height: newHeight });
                                    break;
                                }
                                case 2: {
                                    onImageResize(menuData.current.imageP / 100);
                                    break;
                                }
                            }
                            ContextMenu.close(id);
                        }
                    })
                }))
            }]), {
                align: "top",
                position: "left"
            });
        };

        return jsx("span", {
            className: "canvas-dims",
            children: jsx(internals.ManaButton[internals.keys.ManaButton], {
                variant: "secondary",
                fullWidth: true,
                size: "sm",
                text: jsx("div", {
                    className: "canvas-dims-resizer",
                    children: [
                        jsx("span", { className: "canvas-dims-resizer-number" }, dimensions.width),
                        jsx("span", null, "⨯"),
                        jsx("span", { className: "canvas-dims-resizer-number" }, dimensions.height),
                    ]
                }),
                onClick: handleClick
            }),
        });
    },

    /** @param {{onChange?: (e: {exportType?: string, smoothing?: string | false, background?: string}) => void}} */
    Settings({ onChange }) {
        const [exportType, setExportType] = hooks.useStoredState("exportType", "image/webp");
        const [smoothing, setSmoothing] = hooks.useStoredState("smoothing", "auto");
        const [background, setBackground] = hooks.useStoredState("backgroundColor", "#303038");

        const exportOptions = useRef([{ label: "jpg", value: "image/jpeg" }, { label: "png", value: "image/png" }, { label: "webp", value: "image/webp" }]);
        const smoothingOptions = useRef(["Auto", "High", "Medium", "Low", "Off"].map(e => ({ label: e, value: e.toLowerCase() })));

        const handleClick = e => {
            ContextMenu.open(e, ContextMenu.buildMenu([{
                label: "background",
                type: "custom",
                render: () => jsx("div", {
                    className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
                    children: [
                        jsx("style", null, `@scope {
                :scope { 
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: 4px;
                }
                .bd-color-picker-container {
                  display: grid;
                  gap: 4px;
                }
                .bd-color-picker-swatch {
                  max-width: 156px;
                  margin: 0 !important;
                  display: grid;
                  place-items: center;
                  grid-template-columns: repeat(auto-fill, minmax(21px, 1fr));
                }
                .bd-color-picker {
                  width: 155px;
                  height: 56px;
                  outline: 1px solid var(--border-normal);
                }
                .bd-color-picker-swatch-item {
                  margin: 3px;
                  outline: 1px solid var(--border-normal);
                }
              }`),
                        jsx("span", null, "Background color"),
                        jsx(Components.ColorInput, {
                            colors: utils.backgroundColors,
                            value: background,
                            onChange: bg => {
                                setBackground(bg);
                                onChange({ background: bg });
                            }
                        })
                    ]
                })
            }, {
                label: "Smoothing",
                type: "custom",
                render: () => jsx(Components.ErrorBoundary, null, jsx(Components.MenuItemSelect, {
                    label: "Image smoothing",
                    options: smoothingOptions.current,
                    initialValue: smoothing,
                    onChange: s => {
                        setSmoothing(s);
                        onChange?.({ smoothing: s });
                    }
                }))
            }, {
                label: "Export",
                type: "custom",
                render: () => jsx(Components.ErrorBoundary, null, jsx(Components.MenuItemSelect, {
                    label: "Export as",
                    options: exportOptions.current,
                    initialValue: exportType,
                    onChange: setExportType
                }))
            }]), {
                align: "bottom",
                position: "left"
            });
        };

        return jsx(Components.IconButton, {
            tooltip: "Settings",
            d: utils.paths.Settings,
            onClick: handleClick,
        });
    },

    /**
     * @template T
     * @param {{ initialValue: T, options: { label: string, value: T }[], onChange?: (newValue: T) => void, label?: string }}
     */
    MenuItemSelect({ initialValue, options, onChange, label }) {
        const [value, setValue] = useState(initialValue);

        return jsx("div", {
            className: utils.clsx(internals.contextMenuClass?.item, internals.contextMenuClass?.labelContainer),
            children: [
                jsx("style", null, `@scope {
            :scope {
              display: grid;
              grid-template-columns: 1fr;
              gap: 4px;
            }
            .select { display: unset }
          }`),
                label && jsx("span", null, label),
                jsx(internals.Select[internals.keys.SingleSelect], {
                    options: options,
                    value: value,
                    className: "select",
                    onChange: v => {
                        setValue(v);
                        onChange?.(v);
                    }
                })
            ]
        });
    },

    /** @param {{ value: { family: string, weight: number }, onChange: (e: { family: string, weight: number }) => void }} */
    FontSelector({ onChange, value }) {
        const [family, _setFamily] = useState(() => value.family);
        const [weight, setWeight] = useState(() => value.weight);

        const [familyOptions, setFamilyOptions] = useState(() => []);
        const [weightOptions, setWeightsOptions] = useState(() => []);

        const getWeightsOptions = useCallback(f => {
            return Array.from({ length: 9 }, (_, i) => {
                const w = (i + 1) * 100;
                const loaded = document.fonts.check(`${w} 1rem ${f}`);
                return loaded ? { value: w, label: w } : null;
            }).filter(Boolean);
        }, []);

        const setFamily = useCallback(newFamily => {
            const f = newFamily instanceof Function ? newFamily(family) : newFamily;
            const wo = getWeightsOptions(f);
            setWeightsOptions(wo);
            if (wo.every(w => w.label !== weight)) {
                const closest = wo.toSorted((a, b) => Math.abs(a.label - weight) - Math.abs(b.label - weight))[0];
                setWeight(closest.value);
            }
            _setFamily(f);
        }, []);

        useLayoutEffect(() => {
            Promise.all(Array.from(document.fonts, f => f.load())).finally(() => {
                const defaults = ["Arial", "Arial Black", "cursive", "fantasy", "Garamond", "Georgia", "Helvetica", "monospace", "sans-serif", "serif", "system-ui", "Tahoma", "Times New Roman", "Verdana"];
                const docFonts = Array.from(document.fonts, e => e.family);
                const merged = [...new Set(defaults.concat(docFonts))];
                merged.sort((a, b) => a.localeCompare(b));

                setFamilyOptions(merged.filter(f => document.fonts.check(`1rem ${f}`)).map(e => ({ value: e, label: e })));

                const purifiedFamily = !merged.includes(family) || !document.fonts.check(`1rem ${family}`) ? "gg sans" : family;
                setFamily(purifiedFamily);

                const wo = getWeightsOptions(purifiedFamily);
                setWeightsOptions(wo);

                if (wo.every(w => w.label !== weight)) {
                    const closest = wo.toSorted((a, b) => Math.abs(a.label - weight) - Math.abs(b.label - weight))[0];
                    setWeight(closest.value);
                }
            });
        }, []);

        return jsx("div", {
            className: "font-selector",
            children: [
                jsx(internals.Select[internals.keys.SingleSelect], {
                    options: familyOptions,
                    value: family,
                    className: "select",
                    onChange: f => {
                        setFamily(f);
                        onChange({ family: f, weight });
                    },
                    renderOptionValue: ([option]) => jsx("span", { style: { fontFamily: option.value } }, option.value),
                    renderOptionLabel: option => jsx("span", {
                        ref: node => { option.value === family && node?.scrollIntoView({ block: "nearest" }); },
                        style: { fontFamily: option.label, scrollMarginBlock: "24px" },
                        children: option.label
                    }),
                }),
                jsx(internals.Select[internals.keys.SingleSelect], {
                    options: weightOptions,
                    value: weight,
                    className: "select",
                    onChange: w => {
                        setWeight(w);
                        onChange({ family, weight: w });
                    },
                    renderOptionValue: ([option]) => jsx("span", { style: { fontFamily: family, fontWeight: option.value } }, option.value),
                    renderOptionLabel: option => jsx("span", {
                        ref: node => { option.value === weight && node?.scrollIntoView({ block: "nearest" }); },
                        style: { fontFamily: family, fontWeight: option.label, scrollMarginBlock: "24px" },
                        children: option.label
                    }),
                })
            ]
        });
    },

    /** @param {{onChange: (value: string) => void, value: string, colors?: string[], wait?: number}} */
    ColorInput({ onChange, value, colors, wait = 150 }) {
        /** @type {React.RefObject<number | null>} */
        const timer = useRef(null);

        return jsx(BdApi.Components.ColorInput, {
            value,
            colors,
            onChange: c => {
                timer.current && clearTimeout(timer.current);
                timer.current = setTimeout(() => {
                    onChange(c);
                    timer.current = null;
                }, wait);
            }
        });
    },

    /**
     * @param {{
     *  value: number, onChange?: (e: number) => void, withSlider?: boolean, suffix?: string, label?: string,
     *  ref?: React.RefObject<any>, minValue?: number, centerValue?: number, maxValue?: number,
     *  onSlide?: (e: number) => void, decimals?: number, expScaling?: boolean, className?: string
     * }} props
     */
    NumberSlider({ value, onChange, className, suffix, ref, minValue, centerValue, maxValue, decimals, onSlide, label, withSlider = true, expScaling = true, ...restProps }) {
        const [textValue, setTextValue] = useState(`${value}`);
        const [sliderValue, setSliderValue] = useState(() => expScaling && withSlider ? utils.logScaling(value, { minValue, centerValue, maxValue }) : value);
        const id = useId();
        const oldValue = useRef(value);
        /** @type {React.RefObject<HTMLInputElement?>} */
        const inputRef = useRef(null);
        const sliderRef = useRef(null);

        useImperativeHandle(ref, () => ({
            setValue: v => {
                setTextValue(`${v}`);
                oldValue.current = v;

                if (!withSlider) return;
                const val = expScaling ? utils.logScaling(v, { minValue, centerValue, maxValue }) : v;
                setSliderValue(val);
                sliderRef.current?._reactInternals.stateNode.setState({ value: val });
            },
            previewValue: v => {
                inputRef.current.value = `${v}`;
                if (!withSlider) return;
                const val = expScaling ? utils.logScaling(v, { minValue, centerValue, maxValue }) : v;
                sliderRef.current?._reactInternals.stateNode.setState({ value: val });
            }
        }), [minValue, centerValue, maxValue]);

        useEffect(() => {
            const ctrl = new AbortController();
            inputRef.current?.addEventListener("wheel", e => {
                if (document.activeElement !== e.currentTarget || !e.deltaY || e.buttons) return;
                const delta = -Math.sign(e.deltaY) * (decimals ? 10 ** (-1 * decimals) : 1) * ((e.ctrlKey || e.metaKey) ? 100 : e.shiftKey ? 10 : 1);
                setTextValue(val => {
                    val = (Number(val) + delta).toFixed(decimals ?? 0);
                    return `${Math.max(Number(val), minValue ?? Number(val))}`;
                });
                e.preventDefault();
            }, { signal: ctrl.signal, passive: false });

            return () => { ctrl.abort(); };
        }, []);

        useEffect(() => {
            setTextValue(`${value}`);
            oldValue.current = value;

            if (!withSlider) return;
            const val = expScaling ? utils.logScaling(value, { minValue, centerValue, maxValue }) : value;
            setSliderValue(val);
            sliderRef.current?._reactInternals.stateNode.setState({ value: val });
        }, [value]);

        const handleChange = useCallback(e => {
            setTextValue(e.target.value);
        }, []);

        const handleTextCommit = useCallback(() => {
            const newValue = !Number.isNaN(Number(textValue)) && textValue !== "" ? Math.max(minValue ?? Number(textValue), Number(textValue)) : oldValue.current;
            if (oldValue.current === newValue) return;

            oldValue.current = newValue;
            setTextValue(`${oldValue.current}`);
            onChange?.(oldValue.current);

            if (!withSlider) return;
            const val = expScaling ? utils.logScaling(oldValue.current, { minValue, centerValue, maxValue }) : oldValue.current;
            setSliderValue(val);
            sliderRef.current?._reactInternals.stateNode.setState({ value: val });
        }, [onChange, textValue]);

        const handleSliderChange = useCallback(newValue => {
            setSliderValue(newValue);

            let val = expScaling ? utils.expScaling(newValue / 100, { minValue, centerValue, maxValue }) : newValue;
            val = Number(val.toFixed(decimals ?? 0));
            onSlide?.(val);
        }, [onSlide, minValue, centerValue, maxValue]);

        const handleSliderCommit = useCallback(newValue => {
            let val = expScaling ? utils.expScaling(newValue / 100, { minValue, centerValue, maxValue }) : newValue;
            val = Number(val.toFixed(decimals ?? 0));
            if (val === oldValue.current) return;

            setTextValue(`${val}`);
            oldValue.current = val;
            onChange?.(val);
        }, [onChange, setTextValue, minValue, maxValue]);

        const handleKeyDown = useCallback(e => {
            if (e.key === "Enter" || e.key === "Escape") {
                e.currentTarget.blur();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.stopPropagation?.();
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault?.();
                    const delta = (e.key === "ArrowUp" ? 1 : -1) * (decimals ? 10 ** (-1 * decimals) : 1);
                    setTextValue(val => {
                        val = (Number(val) + delta).toFixed(decimals ?? 0);
                        return `${Math.max(Number(val), minValue ?? Number(val))}`;
                    });
                }
            }
        }, []);

        const handleBeforeInput = useCallback(e => {
            if (e.data && /[^0-9e+\-.]+/.test(e.data)) e.preventDefault?.();
        }, []);

        const handleMouseEnter = useCallback(e => !e.buttons && !document.activeElement.matches(`.${meta.slug}Root textarea.hiddenVisually`) && e.currentTarget.focus(), []);
        const handleMouseLeave = useCallback(e => e.currentTarget.blur(), []);

        const pointerHanders = hooks.usePointerCapture({
            buttons: 7,
            onStart: e => {
                if (!sliderRef.current?.state.boundingRect) {
                    // The state for boundingRect will be set internally only *after* the handleMouseDown event fired,
                    // so the first mousedown event doesn't have the boundingRect. _reactInternals.stateNode.setState
                    // will only update the boundingRect after the render cycle, so we hijack the current state.
                    sliderRef.current.state.boundingRect = sliderRef.current.containerRef.current.getBoundingClientRect();
                }
                sliderRef.current?.handleMouseDown(e);
                sliderRef.current?.moveSmoothly(e);
            },
            onChange: e => { sliderRef.current?.handleMouseMove(e); },
            onSubmit: e => { sliderRef.current?.handleMouseUp(e); },
        });

        return jsx("div", {
            ...restProps,
            className: utils.clsx(className, "number-input-wrapper"),
            children: [
                jsx("style", null, `@scope {
            div& {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              row-gap: 6px;
              color: var(--interactive-text-active);
              padding-inline: 4px;
            }
            .slider-wrapper {
              cursor: inherit;
              flex-basis: 100%;
              margin-block-start: 6px;
            }
            label {
              cursor: inherit;
              margin-inline-end: 6px;
            }
            .number-input {
              border: 1px solid var(--border-normal);
              border-radius: 6px;
              padding: 4px 8px;
              margin: 2px;
              background: var(--interactive-background-active);
              color: currentColor;
              flex: 1 1 0%;
              width: 0;
              min-width: 1em;
              max-width: 3em;
              margin-left: auto;
              text-align: right;
              font-size: smaller;
            }
          }`),
                label && jsx("label", { htmlFor: id, children: `${label}: ` }),
                jsx("input", {
                    className: "number-input",
                    id,
                    value: textValue,
                    ref: inputRef,
                    onBlur: handleTextCommit,
                    onKeyDown: handleKeyDown,
                    onChange: handleChange,
                    onBeforeInput: handleBeforeInput,
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave
                }),
                suffix != null && jsx("span", null, suffix),
                withSlider && internals.keys.MenuSliderControl && jsx("div", {
                    ...pointerHanders,
                    className: "slider-wrapper",
                    children: jsx(internals.nativeUI[internals.keys.MenuSliderControl], {
                        ref: sliderRef,
                        mini: true,
                        className: internals.sliderClass?.slider,
                        initialValue: sliderValue,
                        minValue: !expScaling ? minValue : undefined,
                        maxValue: !expScaling ? maxValue : undefined,
                        onValueRender: newValue => {
                            const val = expScaling ? utils.expScaling(newValue / 100, { minValue, centerValue, maxValue }) : newValue;
                            return Number(val.toFixed(decimals ?? 0)) + (suffix ?? "");
                        },
                        onValueChange: handleSliderCommit,
                        asValueChanges: handleSliderChange,
                    }),
                })
            ]
        });
    },

    /** @param {{ value: string, onChange?: (value: string) => void, label?: string, className: string }} props */
    TextInput({ value, onChange, label, className }) {
        const [text, setText] = useState(value);
        const oldValue = useRef(value);
        const id = useId();

        const handleChange = useCallback(e => {
            setText(e.target.value);
        }, []);

        /** @type {(e: React.KeyboardEvent<HTMLInputElement>) => void} */
        const handleKeyDown = useCallback(e => {
            e.stopPropagation();

            if (e.repeat) return;
            switch (e.key) {
                case "Enter": {
                    e.currentTarget.blur();
                    break;
                }
                case "Escape": {
                    setText(oldValue.current);
                    break;
                }
                case " ": {
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    setText(t => `${t.slice(0, start)} ${t.slice(end)}`);
                    requestAnimationFrame(() => {
                        e.target.selectionStart = e.target.selectionEnd = start + 1;
                    });
                    e.preventDefault();
                    break;
                }
            }
        }, []);

        const handleBlur = useCallback(e => {
            if (oldValue.current === e.target.value) return;

            if (!e.target.value) {
                setText(oldValue.current);
            } else {
                oldValue.current = e.target.value;
                onChange?.(e.target.value);
            }
        }, [onChange]);

        const handleMouseEnter = useCallback(e => !e.buttons && e.currentTarget.focus(), []);
        const handleMouseLeave = useCallback(e => e.currentTarget.blur(), []);

        return jsx("div", {
            className: utils.clsx(className),
            children: [
                jsx("style", null, `@scope {
            :scope {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              padding: 4px 8px;
              color: var(--interactive-text-active);
            }
            .text-input {
              border: 1px solid var(--border-normal);
              border-radius: 6px;
              padding: 4px;
              background: var(--interactive-background-active);
              flex: 0 0 45%;
              min-width: 0;
              color: currentColor;
            }
            label { cursor: inherit }
          )`),
                label && jsx("label", { htmlFor: id }, label),
                jsx("input", {
                    id,
                    className: "text-input",
                    value: text,
                    onKeyDown: handleKeyDown,
                    onChange: handleChange,
                    onBlur: handleBlur,
                    onMouseEnter: handleMouseEnter,
                    onMouseLeave: handleMouseLeave,
                })
            ]
        });
    },

    /** @param {{ onChange?: (value: string) => void, onSubmit?: () => void, ref?: React.RefObject<any> }} */
    TextAreaHidden({ onChange, onSubmit, ref }) {
        /** @type {React.RefObject<HTMLTextAreaElement?>} */
        const textarea = useRef(null);

        useImperativeHandle(ref, () => ({
            focus: () => {
                if (!textarea.current) return;
                textarea.current.hidden = false;
                textarea.current.focus();
            }
        }));

        const handleChange = useCallback(e => {
            onChange?.(e.target.value);
        }, [onChange]);

        /** @type {(e: React.FocusEvent<HTMLTextAreaElement) => void} */
        const handleBlur = useCallback(() => {
            textarea.current.hidden = true;
            onSubmit?.();
            textarea.current.value = "";
        }, [onSubmit]);

        const handleKeyDown = useCallback(e => {
            if (!(e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "Enter" || e.key === "Escape")) {
                textarea.current.blur();
                e.stopPropagation();
            }
        }, []);

        return jsx("textarea", {
            ref: textarea,
            tabIndex: -1,
            hidden: true,
            className: "hiddenVisually",
            onBlur: handleBlur,
            onInput: handleChange,
            onKeyDown: handleKeyDown
        });
    }
};
