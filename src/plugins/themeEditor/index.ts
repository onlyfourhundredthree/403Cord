/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const VARS_ID = "403cord-theme-vars";
const LINK_PREFIX = "403cord-link-";

// Sabit tema linkleri - bunlar her zaman yuklenir, acma/kapama yok
const THEME_LINKS = [
    { id: "font", url: "https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap" },
    { id: "frostedglass", url: "https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css" },
    { id: "titlebar", url: "https://discordstyles.github.io/Addons/windows-titlebar.css" },
    { id: "radialstatus", url: "https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css" },
];

function injectThemeLinks() {
    for (const theme of THEME_LINKS) {
        const fullId = LINK_PREFIX + theme.id;
        if (document.getElementById(fullId)) continue;

        const link = document.createElement("link");
        link.id = fullId;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = theme.url;
        document.documentElement.appendChild(link);
    }
}

function removeThemeLinks() {
    for (const theme of THEME_LINKS) {
        document.getElementById(LINK_PREFIX + theme.id)?.remove();
    }
}

function updateVars(settings: any) {
    let style = document.getElementById(VARS_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = VARS_ID;
        document.documentElement.appendChild(style);
    }

    const lines: string[] = [];
    lines.push(":root {");

    // Backgrounds
    if (settings.store.backgroundImage) {
        lines.push(`  --background-image: url('${settings.store.backgroundImage}');`);
    }
    lines.push(`  --background-image-blur: ${settings.store.backgroundBlur}px;`);
    lines.push(`  --background-image-size: ${settings.store.backgroundSize};`);
    lines.push(`  --background-image-position: ${settings.store.backgroundPosition};`);

    // Popouts
    if (settings.store.popoutImage && settings.store.popoutImage !== "transparent") {
        lines.push(`  --popout-modal-image: url('${settings.store.popoutImage}');`);
    } else {
        lines.push("  --popout-modal-image: transparent;");
    }
    lines.push(`  --popout-modal-blur: ${settings.store.popoutBlur}px;`);
    lines.push(`  --popout-modal-brightness: ${settings.store.popoutBrightness};`);

    // Home Button
    if (settings.store.homeIconUrl) {
        lines.push(`  --home-button-image: url('${settings.store.homeIconUrl}');`);
        lines.push(`  --home-image: url('${settings.store.homeIconUrl}');`);
    }

    // Gradients
    if (settings.store.gradientPrimary) {
        lines.push(`  --gradient-primary: ${settings.store.gradientPrimary};`);
    }
    if (settings.store.gradientSecondary) {
        lines.push(`  --gradient-secondary: ${settings.store.gradientSecondary};`);
    }
    lines.push(`  --gradient-direction: ${settings.store.gradientDirection};`);

    if (settings.store.linkColour) {
        lines.push(`  --link-colour: ${settings.store.linkColour};`);
    }

    // Layout
    lines.push(`  --window-padding: ${settings.store.windowPadding}px;`);
    lines.push(`  --window-roundness: ${settings.store.windowRoundness}px;`);
    lines.push("  --font: Quicksand;");

    // Brightness
    lines.push(`  --serverlist-brightness: ${settings.store.serverlistBrightness};`);
    lines.push(`  --left-brightness: ${settings.store.leftBrightness};`);
    lines.push(`  --middle-brightness: ${settings.store.middleBrightness};`);

    lines.push("}");

    // Custom CSS
    if (settings.store.customCss) {
        lines.push(settings.store.customCss);
    }

    style.textContent = lines.join("\n");
}

const settings = definePluginSettings({
    backgroundImage: {
        description: "Ana Arka Plan URL",
        type: OptionType.STRING,
        default: "https://i.imgur.com/OHStaWu.png",
        onChange: () => updateVars(settings)
    },
    backgroundBlur: {
        description: "Arka Plan Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateVars(settings)
    },
    backgroundSize: {
        description: "Arka Plan Ebatı (cover, contain vb.)",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => updateVars(settings)
    },
    backgroundPosition: {
        description: "Arka Plan Konumu (center, top vb.)",
        type: OptionType.STRING,
        default: "center",
        onChange: () => updateVars(settings)
    },
    popoutImage: {
        description: "Popout/Modal Arka Plan URL",
        type: OptionType.STRING,
        default: "transparent",
        onChange: () => updateVars(settings)
    },
    popoutBlur: {
        description: "Popout Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateVars(settings)
    },
    popoutBrightness: {
        description: "Popout Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateVars(settings)
    },
    homeIconUrl: {
        description: "Ana Sayfa Buton İkonu",
        type: OptionType.STRING,
        default: "https://i.imgur.com/rAzycBK.png",
        onChange: () => updateVars(settings)
    },
    gradientPrimary: {
        description: "Ana Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "219, 219, 164",
        onChange: () => updateVars(settings)
    },
    gradientSecondary: {
        description: "İkincil Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "14, 163, 232",
        onChange: () => updateVars(settings)
    },
    gradientDirection: {
        description: "Gradyan Açısı (örn: 320deg)",
        type: OptionType.STRING,
        default: "320deg",
        onChange: () => updateVars(settings)
    },
    linkColour: {
        description: "Link Rengi",
        type: OptionType.STRING,
        default: "#88f7ff",
        onChange: () => updateVars(settings)
    },
    windowPadding: {
        description: "Pencere Boşluğu (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateVars(settings)
    },
    windowRoundness: {
        description: "Pencere Köşe Yuvarlaklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateVars(settings)
    },
    serverlistBrightness: {
        description: "Sunucu Listesi Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateVars(settings)
    },
    leftBrightness: {
        description: "Sol Panel Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateVars(settings)
    },
    middleBrightness: {
        description: "Chat Alanı Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateVars(settings)
    },
    customCss: {
        description: "Özel CSS Kodları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => updateVars(settings)
    }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "403Cord Dinamik Tema Yöneticisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,

    start() {
        injectThemeLinks();
        updateVars(settings);
    },

    stop() {
        removeThemeLinks();
        document.getElementById(VARS_ID)?.remove();
    }
});
