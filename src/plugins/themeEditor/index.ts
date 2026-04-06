/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const CSS_ID = "403-cord-theme-addons";

function updateThemeStyles(settings: any) {
    let styleEl = document.getElementById(CSS_ID);
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = CSS_ID;
        document.head.appendChild(styleEl);
    }

    const imports: string[] = [];

    if (settings.store.fontQuicksand) {
        imports.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
        // Quicksand font CSS helper
        imports.push("body, button, input, select, textarea, [class*='text-'] { font-family: 'Quicksand', sans-serif !important; }");
    }
    if (settings.store.themeFrostedGlass) {
        imports.push("@import url('https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css');");
    }
    if (settings.store.themeWindowsTitlebar) {
        imports.push("@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');");
    }
    if (settings.store.themeServerColumns) {
        imports.push("@import url('https://mwittrien.github.io/BetterDiscordAddons/Themes/ServerColumns/ServerColumns.css');");
    }
    if (settings.store.themeRadialStatus) {
        imports.push("@import url('https://discordstyles.github.io/RadialStatus/dist/RadialStatus.css');");
    }
    if (settings.store.themeDiscolored) {
        imports.push("@import url('https://nyri4.github.io/Discolored/main.css');");
    }

    styleEl.innerHTML = imports.join("\n");
}

const settings = definePluginSettings({
    fontQuicksand: {
        description: "Quicksand Font Kullan",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeFrostedGlass: {
        description: "Frosted Glass Aktifleştir",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: () => updateThemeStyles(settings)
    },
    themeWindowsTitlebar: {
        description: "Windows Uyumlu Üst Bar",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeServerColumns: {
        description: "Sunucu Sütunları",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeRadialStatus: {
        description: "Yuvarlak Durum Çizgileri",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeDiscolored: {
        description: "Discolored Eklentisi",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    }
});

export default definePlugin({
    name: "ThemeEditor",
    description: "403Cord Dinamik Tema ve Özel Stiller Yöneticisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,

    start() {
        updateThemeStyles(settings);
    },

    stop() {
        const styleEl = document.getElementById(CSS_ID);
        if (styleEl) {
            styleEl.remove();
        }
    }
});
