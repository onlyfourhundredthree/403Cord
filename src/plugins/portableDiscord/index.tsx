/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    positions: {
        type: OptionType.STRING,
        default: "{}",
        description: "Saved panel positions",
        hidden: true
    }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Append to #app-mount so React synthetic events still fire */
function getRoot(): HTMLElement {
    return document.getElementById("app-mount") ?? document.body;
}

function loadPositions(): Record<string, { x: number; y: number; w: number; h: number; }> {
    try { return JSON.parse(settings.store.positions) ?? {}; } catch { return {}; }
}
function savePos(key: string, x: number, y: number, w: number, h: number) {
    const p = loadPositions();
    p[key] = { x, y, w, h };
    settings.store.positions = JSON.stringify(p);
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const POPOUT_ICON = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"15 3 21 3 21 9\"/><polyline points=\"9 21 3 21 3 15\"/><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"/><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"/></svg>";
const CLOSE_ICON = "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>";

// ── CSS Float — member list stays in DOM, only CSS position changes ─────────────
interface CSSFloat { el: HTMLElement; shell: HTMLDivElement; placeholder: HTMLDivElement; }
const cssFloats = new Map<string, CSSFloat>();

function cssPopout(el: HTMLElement, title: string, key: string) {
    if (cssFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? rect.left;
    const y = saved?.y ?? rect.top;
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 400);

    // Invisible placeholder keeps the layout slot
    const placeholder = document.createElement("div");
    placeholder.style.cssText = "display:none;pointer-events:none;flex-shrink:0;";
    el.parentElement?.insertBefore(placeholder, el);

    // Title bar shell — 30px only so it never blocks clicks on content below
    const shell = document.createElement("div");
    shell.className = "vc-fw vc-fw-css";
    shell.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:30px;z-index:1000;`;

    const bar = makeBar(title, () => cssDock(key));
    shell.appendChild(bar);
    getRoot().appendChild(shell);

    // Apply fixed position directly on the element (stays in React tree!)
    el.classList.add("vc-floating-el");
    el.style.setProperty("position", "fixed", "important");
    el.style.setProperty("left", `${x}px`, "important");
    el.style.setProperty("top", `${y + 30}px`, "important");
    el.style.setProperty("width", `${w}px`, "important");
    el.style.setProperty("height", `${h - 30}px`, "important");
    el.style.setProperty("z-index", "1000", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("border-radius", "0 0 8px 8px", "important");
    el.style.setProperty("box-shadow", "0 8px 24px rgb(0 0 0 / 55%)", "important");
    el.style.setProperty("border", "1px solid var(--background-modifier-accent)", "important");
    el.style.setProperty("border-top", "none", "important");
    el.style.setProperty("background", "var(--background-secondary)", "important");

    cssFloats.set(key, { el, shell, placeholder });

    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMove = (e: MouseEvent) => {
        const nx = sl + e.clientX - sx;
        const ny = st + e.clientY - sy;
        shell.style.left = `${nx}px`;
        shell.style.top = `${ny}px`;
        el.style.setProperty("left", `${nx}px`, "important");
        el.style.setProperty("top", `${ny + 30}px`, "important");
    };
    const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), w, h);
    };
    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(shell.style.left) || 0; st = parseInt(shell.style.top) || 0;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
    });

    window.dispatchEvent(new Event("resize"));
}

function cssDock(key: string) {
    const f = cssFloats.get(key);
    if (!f) return;
    f.el.classList.remove("vc-floating-el");
    f.el.removeAttribute("style");
    f.shell.remove();
    f.placeholder.remove();
    cssFloats.delete(key);
    window.dispatchEvent(new Event("resize"));
}

// ── DOM Float — moves element into a floating window div ───────────────────────
interface DOMFloat {
    shell: HTMLDivElement;
    restore: () => void;
}
const domFloats = new Map<string, DOMFloat>();

function domPopout(
    el: HTMLElement,
    title: string,
    key: string,
    restore: () => void
) {
    if (domFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? Math.max(40, rect.left);
    const y = saved?.y ?? Math.max(40, rect.top);
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 300);

    const shell = document.createElement("div");
    shell.className = "vc-fw";
    shell.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;min-width:160px;min-height:60px;z-index:1000;`;

    const bar = makeBar(title, () => domDock(key));
    const body = document.createElement("div");
    body.className = "vc-fw-body";
    body.appendChild(el);

    shell.append(bar, body);
    getRoot().appendChild(shell);
    domFloats.set(key, { shell, restore });

    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMove = (e: MouseEvent) => {
        shell.style.left = `${sl + e.clientX - sx}px`;
        shell.style.top = `${st + e.clientY - sy}px`;
    };
    const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), shell.offsetWidth, shell.offsetHeight);
    };
    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(shell.style.left) || 0; st = parseInt(shell.style.top) || 0;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
    });
}

function domDock(key: string) {
    const f = domFloats.get(key);
    if (!f) return;
    f.restore();
    f.shell.remove();
    domFloats.delete(key);
}

// ── Shared title bar builder ───────────────────────────────────────────────────
function makeBar(title: string, onClose: () => void): HTMLDivElement {
    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    const span = document.createElement("span");
    span.className = "vc-fw-title";
    span.textContent = title;
    const btn = document.createElement("button");
    btn.className = "vc-fw-close";
    btn.innerHTML = CLOSE_ICON;
    btn.title = "Geri Al";
    btn.onclick = onClose;
    bar.append(span, btn);
    return bar;
}

// ── Drag handle ────────────────────────────────────────────────────────────────
function injectHandle(el: HTMLElement, label: string, onClick: () => void) {
    if (el.querySelector(".vc-dh")) return;
    const btn = document.createElement("div");
    btn.className = "vc-dh";
    btn.innerHTML = POPOUT_ICON;
    btn.title = `${label} — Taşı`;
    btn.onclick = e => { e.stopPropagation(); e.preventDefault(); onClick(); };
    el.style.position = "relative";
    el.appendChild(btn);
    el.addEventListener("mouseenter", () => btn.classList.add("vc-dh-show"), { passive: true });
    el.addEventListener("mouseleave", () => btn.classList.remove("vc-dh-show"), { passive: true });
}

// ── Plugin ─────────────────────────────────────────────────────────────────────
export default definePlugin({
    name: "PortableDiscord",
    description: "Üye listesini, kanalları ve kategorileri yüzen taşınabilir pencerelere dönüştürür.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,
    patches: [],

    obs: null as MutationObserver | null,

    start() {
        this.inject();
        this.obs = new MutationObserver(() => this.inject());
        this.obs.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        this.obs?.disconnect();
        this.obs = null;
        for (const key of [...cssFloats.keys()]) cssDock(key);
        for (const key of [...domFloats.keys()]) domDock(key);
        document.querySelectorAll(".vc-dh").forEach(e => e.remove());
    },

    inject() {
        this.injectMemberList();
        this.injectChannels();
    },

    injectMemberList() {
        const el = document.querySelector<HTMLElement>('[class*="membersWrap_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        if (el.closest('[class*="standardSidebarView_"]')) return;
        injectHandle(el, "Üye Listesi", () => cssPopout(el, "Üye Listesi", "members"));
    },

    injectChannels() {
        const items = document.querySelectorAll<HTMLElement>(
            '[class*="content_"] [class*="containerDefault_"]:not([data-vc-inj])'
        );
        for (const item of items) {
            if (item.closest('[class*="standardSidebarView_"]')) continue;
            if (item.closest('[class*="guilds_"]')) continue;
            item.setAttribute("data-vc-inj", "1");

            const isCategory = !!item.querySelector("[aria-expanded]");
            const nameEl = item.querySelector<HTMLElement>('[class*="name_"]');
            const label = nameEl?.textContent?.trim() ?? "?";

            if (isCategory) {
                injectHandle(item, `\uD83D\uDCC1 ${label}`, () => {
                    const key = `cat:${label}`;
                    if (domFloats.has(key)) return;

                    // Capture original positions BEFORE moving anything
                    const catParent = item.parentElement!;
                    const catNext = item.nextSibling; // first sibling after category

                    const siblings: Element[] = [];
                    let sib = item.nextElementSibling;
                    while (sib) {
                        if (sib.querySelector("[aria-expanded]")) break;
                        siblings.push(sib);
                        sib = sib.nextElementSibling;
                    }
                    const afterGroup = siblings.length > 0
                        ? siblings[siblings.length - 1].nextSibling
                        : catNext;

                    // Build group with all items
                    const group = document.createElement("div");
                    group.className = "vc-group";
                    group.appendChild(item);
                    for (const s of siblings) group.appendChild(s);

                    // Disable expand/collapse while floating to prevent crash
                    const toggle = group.querySelector<HTMLElement>("[aria-expanded]");
                    if (toggle) { toggle.style.pointerEvents = "none"; toggle.style.cursor = "default"; }

                    // Restore: put each item back in original order
                    const restore = () => {
                        const allItems = [item, ...siblings];
                        let ref: Node | null = afterGroup;
                        for (const n of allItems) {
                            if (ref && ref.parentNode === catParent) {
                                catParent.insertBefore(n, ref);
                            } else {
                                catParent.appendChild(n);
                            }
                            ref = n.nextSibling;
                        }
                        // Re-enable expand/collapse
                        if (toggle) { toggle.style.pointerEvents = ""; toggle.style.cursor = ""; }
                    };

                    domPopout(group, `\uD83D\uDCC1 ${label}`, key, restore);
                });
            } else {
                if (item.querySelector("[class*='voiceUser_'], [class*='liveVoice_']")) continue;
                injectHandle(item, `# ${label}`, () => {
                    const key = `ch:${label}`;
                    if (domFloats.has(key)) return;
                    const parent = item.parentElement!;
                    const next = item.nextSibling;
                    const restore = () => {
                        if (next?.parentNode === parent) parent.insertBefore(item, next);
                        else parent.appendChild(item);
                    };
                    domPopout(item, `# ${label}`, key, restore);
                });
            }
        }
    }
});
