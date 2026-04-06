/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const CSS_ID = "403-cord-theme-engine";

function updateThemeStyles(settings: any) {
    let styleEl = document.getElementById(CSS_ID);
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = CSS_ID;
        document.head.appendChild(styleEl);
    }

    const css: string[] = [];

    // Font Import
    if (settings.store.fontQuicksand) {
        css.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
    }

    // Theme Addons (External Imports)
    if (settings.store.themeFrostedGlass) {
        css.push("@import url('https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css');");
    }
    if (settings.store.themeWindowsTitlebar) {
        css.push("@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');");
    }
    if (settings.store.themeRadialStatus) {
        css.push("@import url('https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css');");
    }

    // Root Variables
    css.push(":root {");

    // Backgrounds
    if (settings.store.backgroundImage) {
        css.push(`  --background-image: url('${settings.store.backgroundImage}') !important;`);
    }
    css.push(`  --background-image-blur: ${settings.store.backgroundBlur}px !important;`);
    css.push(`  --background-image-size: ${settings.store.backgroundSize} !important;`);
    css.push(`  --background-image-position: ${settings.store.backgroundPosition} !important;`);

    // Popouts
    if (settings.store.popoutImage) {
        css.push(`  --popout-modal-image: url('${settings.store.popoutImage}') !important;`);
    } else {
        css.push(`  --popout-modal-image: transparent !important;`);
    }
    css.push(`  --popout-modal-blur: ${settings.store.popoutBlur}px !important;`);
    css.push(`  --popout-modal-brightness: ${settings.store.popoutBrightness} !important;`);

    // Home Button
    if (settings.store.homeIconUrl) {
        css.push(`  --home-button-image: url('${settings.store.homeIconUrl}') !important;`);
        css.push(`  --home-image: url('${settings.store.homeIconUrl}') !important;`);
    }

    // Colors & Gradients
    if (settings.store.gradientPrimary) {
        css.push(`  --gradient-primary: ${settings.store.gradientPrimary} !important;`);
    }
    if (settings.store.gradientSecondary) {
        css.push(`  --gradient-secondary: ${settings.store.gradientSecondary} !important;`);
    }
    css.push(`  --gradient-direction: ${settings.store.gradientDirection} !important;`);

    if (settings.store.linkColour) {
        css.push(`  --link-colour: ${settings.store.linkColour} !important;`);
    }

    // Layout & Extras
    css.push(`  --window-padding: ${settings.store.windowPadding}px !important;`);
    css.push(`  --window-roundness: ${settings.store.windowRoundness}px !important;`);
    css.push(`  --font: ${settings.store.fontQuicksand ? "Quicksand" : "gg sans"} !important;`);

    // Brightness Control
    css.push(`  --serverlist-brightness: ${settings.store.serverlistBrightness} !important;`);
    css.push(`  --left-brightness: ${settings.store.leftBrightness} !important;`);
    css.push(`  --middle-brightness: ${settings.store.middleBrightness} !important;`);

    css.push("}");

    // Custom CSS
    if (settings.store.customCss) {
        css.push(settings.store.customCss);
    }

    styleEl.innerHTML = css.join("\n");
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
