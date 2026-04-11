/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { vencordRootNode } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    shortcutKey: {
        type: OptionType.STRING,
        description: "Gizleme modunu tetikleyecek tuş (Alt + belirttiğiniz tuş)",
        default: "x"
    }
});

export default definePlugin({
    name: "KillTheBoy",
    description: "Vencord'u tamamen gizler ve normal Discord gibi gösterir. Belirlenen tuşa basarak açıp kapatabilirsiniz.",
    authors: [{ name: "antigravity", id: 0n }],
    settings,
    start() {
        document.addEventListener("keydown", this.onKeyDown);

        // Inject a minimal style tag that isn't hidden when vencordRootNode is removed
        const style = document.createElement("style");
        style.id = "vc-stealth-css";
        style.textContent = `
            .vc-stealth-mode [class*="vencord-"],
            .vc-stealth-mode [class*="vc-"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    },
    stop() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.getElementById("vc-stealth-css")?.remove();
        (window as any).vencordStealthMode = false;
        if (!vencordRootNode.parentElement) {
            document.documentElement.appendChild(vencordRootNode);
        }
    },
    onKeyDown: (e: KeyboardEvent) => {
        const key = settings.store.shortcutKey.toLowerCase();
        if (e.altKey && e.key.toLowerCase() === key) {
            const win = window as any;
            win.vencordStealthMode = !win.vencordStealthMode;

            if (win.vencordStealthMode) {
                // Remove all Vencord styles to kill themes and plugin styles
                if (vencordRootNode.parentElement) {
                    vencordRootNode.remove();
                }
                // Add a global class for extra safety (though our patches handle most things)
                document.documentElement.classList.add("vc-stealth-mode");
            } else {
                // Restore Vencord styles
                if (!vencordRootNode.parentElement) {
                    document.documentElement.appendChild(vencordRootNode);
                }
                document.documentElement.classList.remove("vc-stealth-mode");
            }

            // Force a re-render of settings if it's open, by slightly resizing or triggering a scroll
            // but usually Discord re-calculates things on interaction.
        }
    }
});
