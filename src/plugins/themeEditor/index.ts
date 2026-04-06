/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, Settings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const VARS_ID = "403cord-vars";

// Sabit tema URL'leri - Vencord'un kendi Online Themes sistemine eklenir
const THEME_URLS = [
    "https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap",
    "https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css",
    "https://discordstyles.github.io/Addons/windows-titlebar.css",
    "https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css",
];

function addThemeLinks() {
    const current = Settings.themeLinks;
    const toAdd = THEME_URLS.filter(url => !current.includes(url));
    if (toAdd.length > 0) {
        Settings.themeLinks = [...current, ...toAdd];
    }
}

function removeThemeLinks() {
    Settings.themeLinks = Settings.themeLinks.filter(url => !THEME_URLS.includes(url));
}

function updateVars(s: any) {
    const { store } = s;

    let el = document.getElementById(VARS_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = VARS_ID;
        document.head.appendChild(el);
    }

    const lines: string[] = [];
    lines.push(":root {");
    lines.push(`  --background-image: url('${store.backgroundImage}');`);
    lines.push(`  --background-image-blur: ${store.backgroundBlur}px;`);
    lines.push(`  --background-image-size: ${store.backgroundSize};`);
    lines.push(`  --background-image-position: ${store.backgroundPosition};`);
    lines.push(`  --popout-modal-image: ${store.popoutImage === "transparent" ? "transparent" : "url('" + store.popoutImage + "')"};`);
    lines.push(`  --popout-modal-blur: ${store.popoutBlur}px;`);
    lines.push("  --popout-modal-size: cover;");
    lines.push("  --popout-modal-position: center;");
    lines.push(`  --home-button-image: url('${store.homeIconUrl}');`);
    lines.push("  --home-button-size: cover;");
    lines.push("  --home-button-position: center;");
    lines.push(`  --serverlist-brightness: ${store.serverlistBrightness};`);
    lines.push(`  --left-brightness: ${store.leftBrightness};`);
    lines.push(`  --middle-brightness: ${store.middleBrightness};`);
    lines.push("  --right-brightness: 0;");
    lines.push(`  --popout-modal-brightness: ${store.popoutBrightness};`);
    lines.push(`  --gradient-primary: ${store.gradientPrimary};`);
    lines.push(`  --gradient-secondary: ${store.gradientSecondary};`);
    lines.push(`  --link-colour: ${store.linkColour};`);
    lines.push("  --scrollbar-colour: rgba(255, 255, 255, 0.05);");
    lines.push(`  --gradient-direction: ${store.gradientDirection};`);
    lines.push("  --font: Quicksand;");
    lines.push(`  --window-padding: ${store.windowPadding}px;`);
    lines.push(`  --window-roundness: ${store.windowRoundness}px;`);
    lines.push("  --update-notice-1: none;");
    lines.push("  --columns: 2;");
    lines.push("  --guildgap: 2;");
    lines.push("  --aligndms: 0;");
    lines.push("  --rs-small-spacing: 0px;");
    lines.push("  --rs-medium-spacing: 0px;");
    lines.push("  --rs-large-spacing: 0px;");
    lines.push("  --rs-small-width: 2.5px;");
    lines.push("  --rs-medium-width: 2.5px;");
    lines.push("  --rs-large-width: 2px;");
    lines.push("  --rs-avatar-shape: 50%;");
    lines.push("  --rs-online-color: #1ED883;");
    lines.push("  --rs-idle-color: #EE9A0E;");
    lines.push("  --rs-dnd-color: #F12222;");
    lines.push("  --rs-offline-color: #636b75;");
    lines.push("  --rs-streaming-color: #6E29E4;");
    lines.push("  --rs-phone-visible: block;");
    lines.push("}");

    if (store.customCss) {
        lines.push(store.customCss);
    }

    el.textContent = lines.join("\n");
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
        description: "Arka Plan Ebatı",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => updateVars(settings)
    },
    backgroundPosition: {
        description: "Arka Plan Konumu",
        type: OptionType.STRING,
        default: "center",
        onChange: () => updateVars(settings)
    },
    popoutImage: {
        description: "Popout Arka Plan",
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
        description: "Gradyan Açısı",
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
        addThemeLinks();
        updateVars(settings);
    },

    stop() {
        removeThemeLinks();
        document.getElementById(VARS_ID)?.remove();
    }
});
