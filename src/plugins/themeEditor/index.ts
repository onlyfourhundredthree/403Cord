/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const CSS_ID = "403-cord-theme-engine";

// Temaları bellekte tutalım ki her ayar değişiminde tekrar fetch atıp Discord'u dondurmayalım
const themeCache: Record<string, string> = {};

async function fetchThemeCss(url: string): Promise<string> {
    if (themeCache[url]) return themeCache[url];
    try {
        const res = await fetch(url);
        if (!res.ok) return "";
        const text = await res.text();
        themeCache[url] = text;
        return text;
    } catch {
        return "";
    }
}

async function updateThemeStyles(settings: any) {
    let styleEl = document.getElementById(CSS_ID);
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = CSS_ID;
        document.head.appendChild(styleEl);
    }

    const css: string[] = [];
    const cssImports: string[] = [];

    // Font Import (Bunu @import yapabiliriz, Google Fonts'a CSP engeli yok)
    if (settings.store.fontQuicksand) {
        cssImports.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
    }

    // Theme Addons (External Imports) - Discord CSP raw.githubusercontent'u @import olarak ENGELLER!
    // Bu yüzden fetch atıp TEXT olarak çekip içine yazıyoruz. Böylece sorun ve yavaşlama olmuyor.
    if (settings.store.themeFrostedGlass) {
        const text = await fetchThemeCss("https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css");
        css.push(text);
    }
    if (settings.store.themeWindowsTitlebar) {
        const text = await fetchThemeCss("https://discordstyles.github.io/Addons/windows-titlebar.css");
        css.push(text);
    }
    if (settings.store.themeRadialStatus) {
        const text = await fetchThemeCss("https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css");
        css.push(text);
    }

    // Root Variables
    css.push(":root {");


    // Backgrounds
    if (settings.store.backgroundImage) {
        css.push(`  --background-image: url('${settings.store.backgroundImage}');`);
    }
    css.push(`  --background-image-blur: ${settings.store.backgroundBlur}px;`);
    css.push(`  --background-image-size: ${settings.store.backgroundSize};`);
    css.push(`  --background-image-position: ${settings.store.backgroundPosition};`);

    // Popouts
    if (settings.store.popoutImage) {
        css.push(`  --popout-modal-image: url('${settings.store.popoutImage}');`);
    } else {
        css.push("  --popout-modal-image: transparent;");
    }
    css.push(`  --popout-modal-blur: ${settings.store.popoutBlur}px;`);
    css.push(`  --popout-modal-brightness: ${settings.store.popoutBrightness};`);

    // Home Button
    if (settings.store.homeIconUrl) {
        css.push(`  --home-button-image: url('${settings.store.homeIconUrl}');`);
        css.push(`  --home-image: url('${settings.store.homeIconUrl}');`);
    }

    // Colors & Gradients
    if (settings.store.gradientPrimary) {
        css.push(`  --gradient-primary: ${settings.store.gradientPrimary};`);
    }
    if (settings.store.gradientSecondary) {
        css.push(`  --gradient-secondary: ${settings.store.gradientSecondary};`);
    }
    css.push(`  --gradient-direction: ${settings.store.gradientDirection};`);

    if (settings.store.linkColour) {
        css.push(`  --link-colour: ${settings.store.linkColour};`);
    }

    // Layout & Extras
    css.push(`  --window-padding: ${settings.store.windowPadding}px;`);
    css.push(`  --window-roundness: ${settings.store.windowRoundness}px;`);
    css.push(`  --font: ${settings.store.fontQuicksand ? "Quicksand" : "gg sans"};`);

    // Brightness Control
    css.push(`  --serverlist-brightness: ${settings.store.serverlistBrightness};`);
    css.push(`  --left-brightness: ${settings.store.leftBrightness};`);
    css.push(`  --middle-brightness: ${settings.store.middleBrightness};`);

    css.push("}");

    // Custom CSS
    if (settings.store.customCss) {
        css.push(settings.store.customCss);
    }

    styleEl.innerHTML = cssImports.join("\n") + "\n" + css.join("\n");
}

const settings = definePluginSettings({
    fontQuicksand: {
        description: "Quicksand Fontunu Aktif Et",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeFrostedGlass: {
        description: "Buzlu Cam (Frosted Glass) Efekti",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeWindowsTitlebar: {
        description: "Windows Uyumlu Üst Bar",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeRadialStatus: {
        description: "Radial Durum Halkaları",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    backgroundImage: {
        description: "Ana Arka Plan URL (png/jpg)",
        type: OptionType.STRING,
        default: "https://i.imgur.com/OHStaWu.png",
        onChange: () => updateThemeStyles(settings)
    },
    backgroundBlur: {
        description: "Arka Plan Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateThemeStyles(settings)
    },
    backgroundSize: {
        description: "Arka Plan Ebatı (cover, contain vb.)",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => updateThemeStyles(settings)
    },
    backgroundPosition: {
        description: "Arka Plan Konumu (center, top vb.)",
        type: OptionType.STRING,
        default: "center",
        onChange: () => updateThemeStyles(settings)
    },
    popoutImage: {
        description: "Popout/Modal Arka Plan URL",
        type: OptionType.STRING,
        default: "transparent",
        onChange: () => updateThemeStyles(settings)
    },
    popoutBlur: {
        description: "Popout Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateThemeStyles(settings)
    },
    popoutBrightness: {
        description: "Popout Parlaklığı (0-1 arası)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateThemeStyles(settings)
    },
    homeIconUrl: {
        description: "Ana Sayfa (Home) Butonu İkonu",
        type: OptionType.STRING,
        default: "https://i.imgur.com/rAzycBK.png",
        onChange: () => updateThemeStyles(settings)
    },
    gradientPrimary: {
        description: "Ana Gradyan Rengi (R,G,B Formatı)",
        type: OptionType.STRING,
        default: "219, 219, 164",
        onChange: () => updateThemeStyles(settings)
    },
    gradientSecondary: {
        description: "İkincil Gradyan Rengi (R,G,B Formatı)",
        type: OptionType.STRING,
        default: "14, 163, 232",
        onChange: () => updateThemeStyles(settings)
    },
    gradientDirection: {
        description: "Gradyan Açısı (örn: 320deg)",
        type: OptionType.STRING,
        default: "320deg",
        onChange: () => updateThemeStyles(settings)
    },
    linkColour: {
        description: "Link/Bağlantı Rengi",
        type: OptionType.STRING,
        default: "#88f7ff",
        onChange: () => updateThemeStyles(settings)
    },
    windowPadding: {
        description: "Pencere Boşluğu (Padding px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateThemeStyles(settings)
    },
    windowRoundness: {
        description: "Pencere Köşe Yuvarlaklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => updateThemeStyles(settings)
    },
    serverlistBrightness: {
        description: "Sunucu Listesi Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateThemeStyles(settings)
    },
    leftBrightness: {
        description: "Sol Panel Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateThemeStyles(settings)
    },
    middleBrightness: {
        description: "Chat Alanı Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => updateThemeStyles(settings)
    },
    customCss: {
        description: "Özel CSS Modları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => updateThemeStyles(settings)
    }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "403Cord Dinamik Tema Yöneticisi.",
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
