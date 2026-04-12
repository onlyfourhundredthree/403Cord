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

const POPOUT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
  <path d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"/>
  <path d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"/>
</svg>`;

const CLOSE_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

// ── Position storage ───────────────────────────────────────────────────────────
function loadPositions(): Record<string, { x: number; y: number; w: number; h: number; }> {
    try { return JSON.parse(settings.store.positions) ?? {}; } catch { return {}; }
}
function savePosition(key: string, x: number, y: number, w: number, h: number) {
    const p = loadPositions();
    p[key] = { x, y, w, h };
    settings.store.positions = JSON.stringify(p);
}

// ── CSS-based floating (preserves React context, events, virtual scroll) ───────
interface CSSFloat {
    el: HTMLElement;
    win: HTMLDivElement;
    placeholder: HTMLDivElement;
    bar: HTMLDivElement;
    onMouseMove: (e: MouseEvent) => void;
    onMouseUp: (e: MouseEvent) => void;
}

const cssFloats = new Map<string, CSSFloat>();

function cssPopout(el: HTMLElement, title: string, posKey: string) {
    if (cssFloats.has(posKey)) return;

    const saved = loadPositions()[posKey];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? rect.left;
    const y = saved?.y ?? rect.top;
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 400);

    // Inject a placeholder that keeps the layout space
    const placeholder = document.createElement("div");
    placeholder.style.cssText = "display:none;pointer-events:none;flex-shrink:0;";
    el.parentElement?.insertBefore(placeholder, el);

    // Floating title bar overlay
    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    bar.innerHTML = `<span class="vc-fw-title">${title}</span>`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => cssDock(posKey);
    bar.appendChild(closeBtn);

    const win = document.createElement("div");
    win.className = "vc-fw";
    win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    win.appendChild(bar);
    document.body.appendChild(win);

    // Apply fixed positioning directly to the target element
    el.classList.add("vc-floating-el");
    el.style.cssText = `
        position: fixed !important;
        left: ${x}px !important;
        top: ${y + 30}px !important;
        width: ${w}px !important;
        height: ${h - 30}px !important;
        z-index: 9999 !important;
        overflow: hidden !important;
        border-radius: 0 0 8px 8px !important;
        box-shadow: 0 8px 24px rgb(0 0 0 / 60%) !important;
        border: 1px solid var(--background-modifier-accent) !important;
        border-top: none !important;
    `;

    // Drag implementation
    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMouseMove = (e: MouseEvent) => {
        const nx = sl + e.clientX - sx;
        const ny = st + e.clientY - sy;
        win.style.left = `${nx}px`;
        win.style.top = `${ny}px`;
        el.style.setProperty("left", `${nx}px`, "important");
        el.style.setProperty("top", `${ny + 30}px`, "important");
    };
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        const nw = parseInt(win.style.width) || w;
        const nh = parseInt(win.style.height) || h;
        savePosition(posKey, parseInt(win.style.left), parseInt(win.style.top), nw, nh);
    };

    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(win.style.left) || 0; st = parseInt(win.style.top) || 0;
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
    });

    cssFloats.set(posKey, { el, win, placeholder, bar, onMouseMove, onMouseUp });

    // Trigger resize so virtual scroll recalculates
    window.dispatchEvent(new Event("resize"));
}

function cssDock(posKey: string) {
    const f = cssFloats.get(posKey);
    if (!f) return;
    const { el, win, placeholder } = f;

    el.classList.remove("vc-floating-el");
    el.style.cssText = "";
    win.remove();
    placeholder.remove();
    cssFloats.delete(posKey);

    window.dispatchEvent(new Event("resize"));
}

// ── DOM-move floating (for category groups — detaches from virtual list) ───────
interface DOMFloat {
    el: HTMLElement;
    win: HTMLDivElement;
    origParent: HTMLElement;
    origNext: ChildNode | null;
}
const domFloats = new Map<string, DOMFloat>();

function domPopout(el: HTMLElement, title: string, posKey: string) {
    if (domFloats.has(posKey)) return;

    const saved = loadPositions()[posKey];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? Math.max(40, rect.left);
    const y = saved?.y ?? Math.max(40, rect.top);
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 300);

    const origParent = el.parentElement!;
    const origNext = el.nextSibling;

    const win = document.createElement("div");
    win.className = "vc-fw";
    win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;

    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    bar.innerHTML = `<span class="vc-fw-title">${title}</span>`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => domDock(posKey);
    bar.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "vc-fw-body";
    body.appendChild(el);

    win.append(bar, body);
    document.body.appendChild(win);
    domFloats.set(posKey, { el, win, origParent, origNext });

    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMove = (e: MouseEvent) => {
        win.style.left = `${sl + e.clientX - sx}px`;
        win.style.top = `${st + e.clientY - sy}px`;
    };
    const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        savePosition(posKey, parseInt(win.style.left), parseInt(win.style.top), win.offsetWidth, win.offsetHeight);
    };
    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(win.style.left) || 0; st = parseInt(win.style.top) || 0;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
    });
}

function domDock(posKey: string) {
    const f = domFloats.get(posKey);
    if (!f) return;
    const { el, win, origParent, origNext } = f;
    if (origNext?.parentNode === origParent) origParent.insertBefore(el, origNext);
    else origParent.appendChild(el);
    win.remove();
    domFloats.delete(posKey);
}

// ── Drag handle injection ──────────────────────────────────────────────────────
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

// ── Main plugin ────────────────────────────────────────────────────────────────
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

        // CSS float — preserves React context so member clicks still work
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
                injectHandle(item, `📁 ${label}`, () => {
                    const posKey = `cat:${label}`;
                    if (domFloats.has(posKey)) return;

                    // Collect header + all following channel siblings until next category
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
                    domPopout(group, `📁 ${label}`, posKey);
                });
            } else {
                // Only inject handle for TEXT channels (skip voice channels)
                // Voice channels have a voice/speaker SVG path (no text-channel # icon)
                const hasChannelIcon = !!item.querySelector('[d*="M12 3a1 1 0 0 0-1"]');
                // Text channels contain "#" or a standard text-channel path
                // Voice channels won't have a "#" icon; skip them to avoid bugs
                if (hasChannelIcon) continue; // voice/special channel, skip

                injectHandle(item, `# ${label}`, () => {
                    const posKey = `ch:${label}`;
                    domPopout(item, `# ${label}`, posKey);
                });
            }
        }
    }
});
