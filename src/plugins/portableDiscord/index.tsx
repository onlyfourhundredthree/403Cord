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

// ────── Helpers ──────────────────────────────────────────────────────────────

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

// ────── Icons ────────────────────────────────────────────────────────────────

const POPOUT_ICON = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"15 3 21 3 21 9\"/><polyline points=\"9 21 3 21 3 15\"/><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"/><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"/></svg>";
const CLOSE_ICON = "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>";

// ────── CSS Float ─────────────────────────────────────────────────────────────
//
// Ghost shell arch: the Discord element stays in its original React tree.
// A transparent "ghost shell" div sits on top of it: title bar + resize grip.
// The shell body is pointer-events:none so the element receives all mouse events.
// When shell is dragged/resized, the element's fixed position/size is synced.

interface CSSFloat {
    el: HTMLElement;
    shell: HTMLDivElement;
    placeholder: HTMLDivElement;
}
const cssFloats = new Map<string, CSSFloat>();

function cssPopout(el: HTMLElement, title: string, key: string) {
    if (cssFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    let cx = saved?.x ?? rect.left;
    let cy = saved?.y ?? rect.top;
    let cw = saved?.w ?? (rect.width || 400);
    let ch = saved?.h ?? (rect.height || 500);

    // Placeholder: keeps the layout slot (flex:1 so sidebar doesn't expand)
    const placeholder = document.createElement("div");
    placeholder.className = "vc-fw-placeholder";
    el.parentElement?.insertBefore(placeholder, el);

    // Apply fixed positioning to the Discord element
    const applyEl = () => {
        el.style.setProperty("position", "fixed", "important");
        el.style.setProperty("left", `${cx}px`, "important");
        el.style.setProperty("top", `${cy + 30}px`, "important");
        el.style.setProperty("width", `${cw}px`, "important");
        el.style.setProperty("height", `${ch - 30}px`, "important");
        el.style.setProperty("z-index", "999", "important");
        el.style.setProperty("overflow", "hidden", "important");
        el.style.setProperty("border-radius", "0 0 8px 8px", "important");
        el.style.setProperty("box-shadow", "0 8px 24px rgb(0 0 0 / 55%)", "important");
        el.style.setProperty("border", "1px solid var(--background-modifier-accent,rgb(255 255 255/6%))", "important");
        el.style.setProperty("border-top", "none", "important");
        el.style.setProperty("background-color", "var(--background-primary,#313338)", "important");
    };
    el.classList.add("vc-floating-el");
    applyEl();

    // Ghost shell — full-size transparent overlay
    const shell = document.createElement("div");
    shell.className = "vc-fw vc-fw-css";
    shell.style.cssText = `left:${cx}px;top:${cy}px;width:${cw}px;height:${ch}px;`;

    // Title bar
    const bar = document.createElement("div");
    bar.className = "vc-fw-bar";
    const titleSpan = document.createElement("span");
    titleSpan.className = "vc-fw-title";
    titleSpan.textContent = title;
    const closeBtn = document.createElement("button");
    closeBtn.className = "vc-fw-close";
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = "Geri Al";
    closeBtn.onclick = () => cssDock(key);
    bar.append(titleSpan, closeBtn);
    shell.appendChild(bar);

    // Resize grip
    const grip = document.createElement("div");
    grip.className = "vc-fw-grip";
    shell.appendChild(grip);

    // ── Drag ──────────────────────────────────────────────────────────────
    let sx = 0, sy = 0, sl = 0, st = 0;
    const onDragMove = (e: MouseEvent) => {
        cx = sl + (e.clientX - sx);
        cy = st + (e.clientY - sy);
        shell.style.left = `${cx}px`;
        shell.style.top = `${cy}px`;
        applyEl();
    };
    const onDragUp = () => {
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", onDragUp);
        savePos(key, cx, cy, cw, ch);
    };
    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(shell.style.left) || 0; st = parseInt(shell.style.top) || 0;
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", onDragUp);
        e.preventDefault();
    });

    // ── Resize ────────────────────────────────────────────────────────────
    let rw = 0, rh = 0, rx = 0, ry = 0;
    const onResizeMove = (e: MouseEvent) => {
        cw = Math.max(250, rw + (e.clientX - rx));
        ch = Math.max(120, rh + (e.clientY - ry));
        shell.style.width = `${cw}px`;
        shell.style.height = `${ch}px`;
        applyEl();
    };
    const onResizeUp = () => {
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeUp);
        savePos(key, cx, cy, cw, ch);
    };
    grip.addEventListener("mousedown", e => {
        rw = parseInt(shell.style.width) || cw;
        rh = parseInt(shell.style.height) || ch;
        rx = e.clientX; ry = e.clientY;
        document.addEventListener("mousemove", onResizeMove);
        document.addEventListener("mouseup", onResizeUp);
        e.preventDefault();
        e.stopPropagation();
    });

    getRoot().appendChild(shell);
    cssFloats.set(key, { el, shell, placeholder });
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

// ────── Drag handle ──────────────────────────────────────────────────────────

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

// ────── Plugin ───────────────────────────────────────────────────────────────

export default definePlugin({
    name: "PortableDiscord",
    description: "Metin kanalı chat'ini ve üye listesini yüzen taşınabilir pencerelere dönüştürür.",
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
        document.querySelectorAll(".vc-dh").forEach(e => e.remove());
    },

    inject() {
        this.injectChat();
        this.injectMemberList();
    },

    /**
     * Ana chat alanı (mesajlar + yazı kutusu) — CSS float.
     * React güncellemeleri korunur; farklı kanala geçilirse içerik güncellenir.
     * Placeholder sayesinde sidebar ve içerik alanı layout'u bozulmaz.
     */
    injectChat() {
        // Find the main chat element: inside content_, not inside sidebar_, large enough
        const base = document.querySelector<HTMLElement>('[class*="base_"]');
        if (!base) return;

        const chatEl = Array.from(base.querySelectorAll<HTMLElement>('[class*="chat_"]'))
            .find(e =>
                !e.closest('[class*="sidebar_"]') &&
                !e.closest('[class*="standardSidebarView_"]') &&
                e.offsetWidth > 300
            );
        if (!chatEl || chatEl.querySelector(".vc-dh")) return;

        injectHandle(chatEl, "� Sohbet", () => cssPopout(chatEl, "� Sohbet", "chat"));
    },

    /** Üye listesi — CSS float, tam interaktif (scroll, tıklama, sağ tık) */
    injectMemberList() {
        const el = document.querySelector<HTMLElement>('[class*="membersWrap_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        if (el.closest('[class*="standardSidebarView_"]')) return;
        injectHandle(el, "👥 Üye Listesi", () => cssPopout(el, "👥 Üye Listesi", "members"));
    }
});
