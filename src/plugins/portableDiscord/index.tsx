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

// ── Icons (stroke-based, theme-neutral) ───────────────────────────────────────
const POPOUT_ICON = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"15 3 21 3 21 9\"/><polyline points=\"9 21 3 21 3 15\"/><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"/><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"/></svg>";
const CLOSE_ICON = "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>";

// ── Shell builder ──────────────────────────────────────────────────────────────

interface ShellCallbacks {
    onClose(): void;
    onDrag(dx: number, dy: number): void;
    onResize(dw: number, dh: number): void;
    onDragEnd(): void;
    onResizeEnd(): void;
}

function buildShell(title: string, x: number, y: number, w: number, h: number, cb: ShellCallbacks): HTMLDivElement {
    const shell = document.createElement("div");
    shell.className = "vc-fw";
    shell.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;

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
    closeBtn.onclick = () => cb.onClose();

    bar.append(titleSpan, closeBtn);
    shell.appendChild(bar);

    // Drag titlebar
    let sx = 0, sy = 0, sl = 0, st = 0;
    const onDragMove = (e: MouseEvent) => {
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        shell.style.left = `${sl + dx}px`;
        shell.style.top = `${st + dy}px`;
        cb.onDrag(dx, dy);
    };
    const onDragUp = () => {
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", onDragUp);
        cb.onDragEnd();
    };
    bar.addEventListener("mousedown", e => {
        if ((e.target as Element).closest(".vc-fw-close")) return;
        sx = e.clientX; sy = e.clientY;
        sl = parseInt(shell.style.left) || 0; st = parseInt(shell.style.top) || 0;
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", onDragUp);
        e.preventDefault();
    });

    // Resize grip (bottom-right corner)
    const grip = document.createElement("div");
    grip.className = "vc-fw-grip";
    shell.appendChild(grip);

    let rw = 0, rh = 0, rx = 0, ry = 0;
    const onResizeMove = (e: MouseEvent) => {
        const dw = e.clientX - rx;
        const dh = e.clientY - ry;
        const nw = Math.max(160, rw + dw);
        const nh = Math.max(60, rh + dh);
        shell.style.width = `${nw}px`;
        shell.style.height = `${nh}px`;
        cb.onResize(dw, dh);
    };
    const onResizeUp = () => {
        document.removeEventListener("mousemove", onResizeMove);
        document.removeEventListener("mouseup", onResizeUp);
        cb.onResizeEnd();
    };
    grip.addEventListener("mousedown", e => {
        rw = shell.offsetWidth; rh = shell.offsetHeight;
        rx = e.clientX; ry = e.clientY;
        document.addEventListener("mousemove", onResizeMove);
        document.addEventListener("mouseup", onResizeUp);
        e.preventDefault();
        e.stopPropagation();
    });

    return shell;
}

// ── CSS Float ─────────────────────────────────────────────────────────────────
interface CSSFloat { el: HTMLElement; shell: HTMLDivElement; placeholder: HTMLDivElement; }
const cssFloats = new Map<string, CSSFloat>();

function cssPopout(el: HTMLElement, title: string, key: string) {
    if (cssFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? rect.left;
    const y = saved?.y ?? rect.top;
    const w = saved?.w ?? (rect.width || 300);
    const h = saved?.h ?? (rect.height || 400);

    const placeholder = document.createElement("div");
    placeholder.className = "vc-fw-placeholder";
    el.parentElement?.insertBefore(placeholder, el);

    const applyEl = (cx: number, cy: number, cw: number, ch: number) => {
        el.style.setProperty("position", "fixed", "important");
        el.style.setProperty("left", `${cx}px`, "important");
        el.style.setProperty("top", `${cy + 30}px`, "important");
        el.style.setProperty("width", `${cw}px`, "important");
        el.style.setProperty("height", `${ch - 30}px`, "important");
        el.style.setProperty("z-index", "1000", "important");
        el.style.setProperty("overflow", "hidden", "important");
        el.style.setProperty("border-radius", "0 0 8px 8px", "important");
        el.style.setProperty("box-shadow", "0 8px 24px rgb(0 0 0 / 55%)", "important");
        el.style.setProperty("border", "1px solid var(--background-modifier-accent, rgb(255 255 255 / 6%))", "important");
        el.style.setProperty("border-top", "none", "important");
        el.style.setProperty("background-color", "var(--background-secondary, #313338)", "important");
    };

    applyEl(x, y, w, h);
    el.classList.add("vc-floating-el");

    let curX = x, curY = y, curW = w, curH = h;

    const shell = buildShell(title, x, y, w, 30, {
        onClose: () => cssDock(key),
        onDrag: (dx, dy) => {
            curX = (parseInt(shell.style.left) || x);
            curY = (parseInt(shell.style.top) || y);
            el.style.setProperty("left", `${curX}px`, "important");
            el.style.setProperty("top", `${curY + 30}px`, "important");
        },
        onDragEnd: () => savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), curW, curH),
        onResize: (dw, dh) => {
            curW = shell.offsetWidth;
            curH = curH; // height not resizable for CSS float (title bar is separate)
            el.style.setProperty("width", `${curW}px`, "important");
        },
        onResizeEnd: () => savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), shell.offsetWidth, curH)
    });

    // Title bar only: 30px height shell
    shell.style.height = "30px";
    shell.classList.add("vc-fw-css");

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

// ── DOM Float ─────────────────────────────────────────────────────────────────
interface DOMFloat { shell: HTMLDivElement; restore(): void; }
const domFloats = new Map<string, DOMFloat>();

function domPopout(el: HTMLElement, title: string, key: string, restore: () => void) {
    if (domFloats.has(key)) return;

    const saved = loadPositions()[key];
    const rect = el.getBoundingClientRect();
    const x = saved?.x ?? Math.max(40, rect.left);
    const y = saved?.y ?? Math.max(40, rect.top);
    const w = saved?.w ?? (rect.width || 240);
    const h = saved?.h ?? (rect.height || 300);

    const body = document.createElement("div");
    body.className = "vc-fw-body";
    body.appendChild(el);

    const shell = buildShell(title, x, y, w, h, {
        onClose: () => domDock(key),
        onDrag: () => { },
        onDragEnd: () => savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), shell.offsetWidth, shell.offsetHeight),
        onResize: () => { },
        onResizeEnd: () => savePos(key, parseInt(shell.style.left), parseInt(shell.style.top), shell.offsetWidth, shell.offsetHeight)
    });
    shell.insertBefore(body, shell.querySelector(".vc-fw-grip")!);

    getRoot().appendChild(shell);
    domFloats.set(key, { shell, restore });
}

function domDock(key: string) {
    const f = domFloats.get(key);
    if (!f) return;
    f.restore();
    f.shell.remove();
    domFloats.delete(key);
}

// ── Drag handle ────────────────────────────────────────────────────────────────
function injectHandle(el: HTMLElement, label: string, onClick: () => void, positionOnEl = false) {
    if (el.querySelector(".vc-dh")) return;
    const btn = document.createElement("div");
    btn.className = "vc-dh vc-dh-overlay";
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
    description: "Chat, ses paneli, üye listesi, kanallar ve kategorileri yüzen taşınabilir pencerelere dönüştürür.",
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
        this.injectChat();
        this.injectPanels();
        this.injectMemberList();
        this.injectChannels();
    },

    /** Metin kanalı chat alanı — CSS float, React güncellemeleri korunur */
    injectChat() {
        const el = document.querySelector<HTMLElement>('[class*="chat_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        if (el.closest('[class*="standardSidebarView_"]')) return;
        injectHandle(el, "Metin Kanalı", () => cssPopout(el, "Metin Kanalı", "chat"));
    },

    /** Ses kanalı paneli (sol alt) — CSS float */
    injectPanels() {
        const el = document.querySelector<HTMLElement>('[class*="base_"] [class*="panels_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        injectHandle(el, "Ses Paneli", () => cssPopout(el, "Ses Paneli", "panels"));
    },

    /** Üye listesi — CSS float, tam interaktif */
    injectMemberList() {
        const el = document.querySelector<HTMLElement>('[class*="membersWrap_"]');
        if (!el || el.querySelector(".vc-dh")) return;
        if (el.closest('[class*="standardSidebarView_"]')) return;
        injectHandle(el, "Üye Listesi", () => cssPopout(el, "Üye Listesi", "members"));
    },

    /** Kanallar ve kategoriler */
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

                    const catParent = item.parentElement!;
                    const siblings: Element[] = [];
                    let sib = item.nextElementSibling;
                    while (sib) {
                        if (sib.querySelector("[aria-expanded]")) break;
                        siblings.push(sib);
                        sib = sib.nextElementSibling;
                    }
                    const afterLast = siblings.at(-1)?.nextSibling ?? item.nextSibling;

                    const group = document.createElement("div");
                    group.className = "vc-group";
                    group.appendChild(item);
                    for (const s of siblings) group.appendChild(s);

                    const toggle = group.querySelector<HTMLElement>("[aria-expanded]");
                    if (toggle) { toggle.style.pointerEvents = "none"; toggle.style.cursor = "default"; }

                    const restore = () => {
                        const all = [item, ...siblings];
                        let ref: Node | null = afterLast;
                        for (const n of all) {
                            if (ref?.parentNode === catParent) catParent.insertBefore(n, ref);
                            else catParent.appendChild(n);
                            ref = n.nextSibling;
                        }
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
