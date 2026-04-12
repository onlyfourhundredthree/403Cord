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

interface PanelConfig {
    id: string;
    title: string;
    selector: string;
    defaultW: number;
    defaultH: number;
}

const PANELS: PanelConfig[] = [
    { id: "sidebar", title: "Kanallar", selector: '[class*="sidebar_"]', defaultW: 240, defaultH: 600 },
    { id: "members", title: "Üye Listesi", selector: '[class*="membersWrap_"]', defaultW: 240, defaultH: 600 },
    { id: "panels", title: "Ses Paneli", selector: '[class*="panels_"]', defaultW: 260, defaultH: 160 }
];

const POPOUT_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"/>
  <path d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"/>
</svg>`;

const CLOSE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

export default definePlugin({
    name: "PortableDiscord",
    description: "Discord'un çeşitli panellerini (Kanallar, Üyeler, Ses) taşınabilir hale getirir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    patches: [], // No webpack patches needed!

    observer: null as MutationObserver | null,
    injectedButtons: new Set<string>(),

    onStart() {
        this.setupPortable();
        this.observer = new MutationObserver(() => this.setupPortable());
        this.observer.observe(document.body, { childList: true, subtree: true });
    },

    onStop() {
        this.observer?.disconnect();
        this.observer = null;

        // Remove all popout states
        document.querySelectorAll(".vc-portable-active").forEach(el => {
            this.dockElement(el as HTMLElement);
        });

        // Remove all injected buttons and headers
        document.querySelectorAll(".vc-portable-btn, .vc-portable-drag-header").forEach(el => el.remove());
        this.injectedButtons.clear();
    },

    setupPortable() {
        for (const panel of PANELS) {
            const el = document.querySelector(panel.selector) as HTMLElement | null;
            if (!el) continue;

            // If already active (popped out), restore the drag header if lost
            if (el.classList.contains("vc-portable-active") && !el.querySelector(".vc-portable-drag-header")) {
                this.addDragHeader(el, panel);
            }

            // Inject toggle button if not already there
            if (el.querySelector(`.vc-portable-btn[data-id="${panel.id}"]`)) continue;

            const btn = document.createElement("div");
            btn.className = "vc-portable-popout-btn vc-portable-btn";
            btn.setAttribute("data-id", panel.id);
            btn.setAttribute("title", `${panel.title}'i Taşı`);
            btn.innerHTML = POPOUT_ICON_SVG;
            btn.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                z-index: 100;
                cursor: pointer;
                border-radius: 4px;
                padding: 2px;
                width: 22px;
                height: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.4);
                color: var(--interactive-normal);
            `;

            btn.addEventListener("click", e => {
                e.stopPropagation();
                this.togglePanel(panel, el);
            });

            // Ensure parent is relatively positioned so our button sits correctly
            const existingPos = el.style.position;
            if (!existingPos || existingPos === "static") {
                el.style.position = "relative";
            }
            el.appendChild(btn);
        }
    },

    togglePanel(panel: PanelConfig, el: HTMLElement) {
        if (el.classList.contains("vc-portable-active")) {
            this.dockElement(el);
        } else {
            this.popoutElement(panel, el);
        }
    },

    popoutElement(panel: PanelConfig, el: HTMLElement) {
        const rect = el.getBoundingClientRect();

        // Save position to settings
        const positions = this.loadPositions();
        const savedPos = positions[panel.id];
        const x = savedPos?.x ?? rect.left;
        const y = savedPos?.y ?? rect.top;
        const w = (savedPos?.w ?? rect.width) || panel.defaultW;
        const h = (savedPos?.h ?? rect.height) || panel.defaultH;

        el.classList.add("vc-portable-active");
        el.style.cssText = `
            position: fixed !important;
            left: ${x}px !important;
            top: ${y}px !important;
            width: ${w}px !important;
            height: ${h}px !important;
            z-index: 5000 !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
        `;

        // Remove the popout button temporarily (drag header has close instead)
        el.querySelector(".vc-portable-btn")?.remove();

        // Add drag header
        this.addDragHeader(el, panel);
    },

    dockElement(el: HTMLElement) {
        el.classList.remove("vc-portable-active");
        el.style.cssText = "position: relative;";

        // Remove drag header
        el.querySelector(".vc-portable-drag-header")?.remove();

        // Re-inject popout button (will be re-added by observer)
    },

    addDragHeader(el: HTMLElement, panel: PanelConfig) {
        const header = document.createElement("div");
        header.className = "vc-portable-drag-header";
        header.style.cssText = `
            height: 32px;
            min-height: 32px;
            background: var(--background-tertiary, #2b2d31);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            border-bottom: 1px solid var(--background-modifier-accent, rgba(255,255,255,0.06));
        `;
        header.innerHTML = `
            <span style="font-size:11px;font-weight:700;color:var(--header-primary);text-transform:uppercase;letter-spacing:.5px;">${panel.title}</span>
            <div class="vc-portable-close-btn" title="Geri Al" style="cursor:pointer;color:var(--interactive-normal);display:flex;align-items:center;padding:2px;border-radius:3px;">
                ${CLOSE_ICON_SVG}
            </div>
        `;

        // Close button
        header.querySelector(".vc-portable-close-btn")!.addEventListener("click", () => {
            this.dockElement(el);
        });

        // Drag functionality
        let startX = 0, startY = 0, startLeft = 0, startTop = 0;

        const onMouseMove = (e: MouseEvent) => {
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            el.style.left = `${newLeft}px`;
            el.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            // Save position
            const positions = this.loadPositions();
            positions[panel.id] = {
                x: parseInt(el.style.left),
                y: parseInt(el.style.top),
                w: el.offsetWidth,
                h: el.offsetHeight
            };
            settings.store.positions = JSON.stringify(positions);
        };

        header.addEventListener("mousedown", (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest(".vc-portable-close-btn")) return;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(el.style.left) || 0;
            startTop = parseInt(el.style.top) || 0;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            e.preventDefault();
        });

        // Insert at top of element
        el.insertBefore(header, el.firstChild);
    },

    loadPositions(): Record<string, { x: number; y: number; w: number; h: number; }> {
        try {
            return JSON.parse(settings.store.positions) ?? {};
        } catch {
            return {};
        }
    }
});
