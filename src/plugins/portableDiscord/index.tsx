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

// ── Icons ──────────────────────────────────────────────────────────────────────
const POPOUT_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
  <path d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"/>
  <path d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"/>
</svg>`;

const CLOSE_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

// ── Floating window manager ────────────────────────────────────────────────────
interface WinRecord {
    win: HTMLDivElement;
    origParent: HTMLElement;
    origNext: ChildNode | null;
}
const openWindows = new Map<HTMLElement, WinRecord>();
let winSeq = 0;

function positions(): Record<string, { x: number; y: number; }> {
    try { return JSON.parse(settings.store.positions) ?? {}; } catch { return {}; }
}
function savePos(key: string, x: number, y: number) {
    const p = positions();
    p[key] = { x, y };
    settings.store.positions = JSON.stringify(p);
}

function popout(el: HTMLElement, title: string) {
    if (openWindows.has(el)) return; // already floating

    const posKey = title;
    const saved = positions()[posKey];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? Math.max(80, rect.left);
    const y = saved?.y ?? Math.max(40, rect.top);

    // Create floating window
    const win = document.createElement("div");
    win.className = "vc-fw";
    win.id = `vc-fw-${++winSeq}`;
    win.style.cssText = `left:${x}px;top:${y}px;width:${Math.max(200, rect.width || 240)}px;height:${Math.max(60, rect.height || 400)}px;`;

    // Title bar
    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    bar.innerHTML = `<span class="vc-fw-title">${title}</span>`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => dock(el);
    bar.appendChild(closeBtn);

    // Content
    const body = document.createElement("div");
    body.className = "vc-fw-body";

    // Record original position before moving
    const origParent = el.parentElement!;
    const origNext = el.nextSibling;

    body.appendChild(el);
    win.append(bar, body);
    document.body.appendChild(win);

    openWindows.set(el, { win, origParent, origNext });
    makeDraggable(win, bar, posKey);
}

function dock(el: HTMLElement) {
    const rec = openWindows.get(el);
    if (!rec) return;
    const { win, origParent, origNext } = rec;

    if (origNext && origNext.parentNode === origParent) {
        origParent.insertBefore(el, origNext);
    } else {
        origParent.appendChild(el);
    }

    win.remove();
    openWindows.delete(el);
}

function makeDraggable(win: HTMLElement, handle: HTMLElement, posKey: string) {
    let sx = 0, sy = 0, sl = 0, st = 0;
    const onMove = (e: MouseEvent) => {
        win.style.left = `${sl + e.clientX - sx}px`;
        win.style.top = `${st + e.clientY - sy}px`;
    };
    const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        savePos(posKey, parseInt(win.style.left), parseInt(win.style.top));
    };
    handle.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(win.style.left) || 0; st = parseInt(win.style.top) || 0;
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        e.preventDefault();
    });
}

// ── Drag handle button ─────────────────────────────────────────────────────────
function addHandle(el: HTMLElement, title: string, getTarget: () => HTMLElement) {
    if (el.querySelector(".vc-dh")) return; // already injected

    const btn = document.createElement("div");
    btn.className = "vc-dh";
    btn.innerHTML = POPOUT_ICON;
    btn.title = `${title} — Taşı`;
    btn.onclick = e => { e.stopPropagation(); e.preventDefault(); popout(getTarget(), title); };

    el.style.position = "relative";
    el.appendChild(btn);

    el.addEventListener("mouseenter", () => btn.classList.add("vc-dh-show"));
    el.addEventListener("mouseleave", () => btn.classList.remove("vc-dh-show"));
}

// ─── Plugin ────────────────────────────────────────────────────────────────────
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
        // Dock everything back
        for (const el of [...openWindows.keys()]) dock(el);
        document.querySelectorAll(".vc-dh").forEach(e => e.remove());
    },

    inject() {
        this.injectMemberList();
        this.injectChannelItems();
    },

    /** Member list: inject on the membersWrap_ element */
    injectMemberList() {
        const el = document.querySelector<HTMLElement>('[class*="membersWrap_"]');
        if (!el) return;
        if (el.closest('[class*="standardSidebarView_"]')) return; // skip settings
        if (el.querySelector(".vc-dh")) return;

        addHandle(el, "Üye Listesi", () => el);
    },

    /** Channel list items (inside content_ area, not inside guild icon rail) */
    injectChannelItems() {
        // All containerDefault_ items that live inside the server channel list (content_)
        const items = document.querySelectorAll<HTMLElement>(
            '[class*="content_"] [class*="containerDefault_"]:not([data-vc-injected])'
        );

        for (const item of items) {
            if (item.closest('[class*="standardSidebarView_"]')) continue; // skip settings
            if (item.closest('[class*="guilds_"]')) continue; // skip guild icon rail

            item.setAttribute("data-vc-injected", "1");

            const isCategory = !!item.querySelector("[aria-expanded]");
            const nameEl = item.querySelector<HTMLElement>('[class*="name_"]');
            const label = nameEl?.textContent?.trim() ?? "?";

            if (isCategory) {
                // Category: collect this header + all following channel siblings until next category
                addHandle(item, `📁 ${label}`, () => {
                    const group = document.createElement("div");
                    group.className = "vc-group";

                    const toMove: Element[] = [item];
                    let sib = item.nextElementSibling;
                    while (sib) {
                        if (sib.querySelector("[aria-expanded]")) break; // next category
                        toMove.push(sib);
                        sib = sib.nextElementSibling;
                    }
                    for (const n of toMove) group.appendChild(n);
                    return group;
                });
            } else {
                // Individual channel
                addHandle(item, `#\u200B ${label}`, () => item);
            }
        }
    }
});
