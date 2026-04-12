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

/** Append to #app-mount so React event delegation still works correctly */
function getRoot(): HTMLElement {
    return document.getElementById("app-mount") ?? document.body;
}

function loadPositions(): Record<string, { x: number; y: number; w: number; h: number; }> {
    try { return JSON.parse(settings.store.positions) ?? {}; } catch { return {}; }
}
function savePosition(key: string, x: number, y: number, w: number, h: number) {
    const p = loadPositions();
    p[key] = { x, y, w, h };
    settings.store.positions = JSON.stringify(p);
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const POPOUT_ICON = "<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z\"/><path d=\"M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z\"/></svg>";
const CLOSE_ICON = "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>";

// ── CSS Float (preserves React events — element stays in DOM tree) ─────────────
interface CSSFloat { el: HTMLElement; bar: HTMLDivElement; placeholder: HTMLDivElement; }
const cssFloats = new Map<string, CSSFloat>();

function cssPopout(el: HTMLElement, title: string, key: string) {
    if (cssFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? rect.left;
    const y = saved?.y ?? rect.top;
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 400);

    // Invisible placeholder so the empty slot doesn't cause layout shift
    const placeholder = document.createElement("div");
    placeholder.style.cssText = "display:none;pointer-events:none;flex-shrink:0;";
    el.parentElement?.insertBefore(placeholder, el);

    // Title bar only — height: 30px so it never blocks clicks on the content
    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    bar.innerHTML = `<span class="vc-fw-title">${title}</span>`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => cssDock(key);
    bar.appendChild(closeBtn);

    // Outer shell — only 30px tall (title bar), content is the element itself below
    const shell = document.createElement("div");
    shell.className = "vc-fw";
    shell.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:30px;`;
    shell.appendChild(bar);
    getRoot().appendChild(shell);

    // Float the actual element directly via CSS
    el.classList.add("vc-floating-el");
    el.style.setProperty("position", "fixed", "important");
    el.style.setProperty("left", `${x}px`, "important");
    el.style.setProperty("top", `${y + 30}px`, "important");
    el.style.setProperty("width", `${w}px`, "important");
    el.style.setProperty("height", `${h - 30}px`, "important");
    el.style.setProperty("z-index", "9999", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("border-radius", "0 0 8px 8px", "important");
    el.style.setProperty("box-shadow", "0 8px 24px rgb(0 0 0 / 60%)", "important");
    el.style.setProperty("border", "1px solid var(--background-modifier-accent)", "important");
    el.style.setProperty("border-top", "none", "important");

    cssFloats.set(key, { el, bar: shell, placeholder });

    // Drag
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
        savePosition(key, parseInt(shell.style.left), parseInt(shell.style.top), w, h);
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
    f.bar.remove();
    f.placeholder.remove();
    cssFloats.delete(key);
    window.dispatchEvent(new Event("resize"));
}

// ── DOM Float (for category groups — moved outside virtual list) ───────────────
interface DOMFloat { el: HTMLElement; shell: HTMLDivElement; origParent: HTMLElement; origNext: ChildNode | null; }
const domFloats = new Map<string, DOMFloat>();

function domPopout(el: HTMLElement, title: string, key: string) {
    if (domFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? Math.max(40, rect.left);
    const y = saved?.y ?? Math.max(40, rect.top);
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 300);

    const origParent = el.parentElement!;
    const origNext = el.nextSibling;

    const shell = document.createElement("div");
    shell.className = "vc-fw";
    shell.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;

    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    bar.innerHTML = `<span class="vc-fw-title">${title}</span>`;
    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => domDock(key);
    bar.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "vc-fw-body";
    body.appendChild(el);

    shell.append(bar, body);
    getRoot().appendChild(shell);
    domFloats.set(key, { el, shell, origParent, origNext });

    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMove = (e: MouseEvent) => {
        shell.style.left = `${sl + e.clientX - sx}px`;
        shell.style.top = `${st + e.clientY - sy}px`;
    };
    const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        savePosition(key, parseInt(shell.style.left), parseInt(shell.style.top), shell.offsetWidth, shell.offsetHeight);
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
    const { el, shell, origParent, origNext } = f;
    if (origNext?.parentNode === origParent) origParent.insertBefore(el, origNext);
    else origParent.appendChild(el);
    shell.remove();
    domFloats.delete(key);
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
        this.injectChannelItems();
    },

    injectMemberList() {
        const el = document.querySelector<HTMLElement>('[class*="membersWrap_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        if (el.closest('[class*="standardSidebarView_"]')) return;
        // CSS float — React stays in its original tree, all events preserved
        injectHandle(el, "Üye Listesi", () => cssPopout(el, "Üye Listesi", "members"));
    },

    injectChannelItems() {
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
                    const group = document.createElement("div");
                    group.className = "vc-group";
                    const toMove: Element[] = [item];
                    let sib = item.nextElementSibling;
                    while (sib) {
                        if (sib.querySelector("[aria-expanded]")) break;
                        toMove.push(sib);
                        sib = sib.nextElementSibling;
                    }
                    for (const n of toMove) group.appendChild(n);
                    domPopout(group, `\uD83D\uDCC1 ${label}`, key);
                });
            } else {
                // Skip voice channels (they cause bugs when individually extracted)
                if (item.querySelector("[class*=\"voiceUser_\"], [class*=\"liveVoice_\"]")) continue;
                injectHandle(item, `# ${label}`, () => {
                    const key = `ch:${label}`;
                    domPopout(item, `# ${label}`, key);
                });
            }
        }
    }
});
