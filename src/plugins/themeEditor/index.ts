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

    const css: string[] = [];

    // Addons / Imports (GitHub üzerinden çekilen güncel dosyalar)
    if (settings.store.fontQuicksand) {
        css.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
        css.push("body, button, input, select, textarea, [class*='text-'], [class*='name-'], [class*='header-'] { font-family: 'Quicksand', sans-serif !important; }");
    }
    if (settings.store.themeFrostedGlass) {
        css.push("@import url('https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css');");
    }
    if (settings.store.themeRadialStatus) {
        css.push("@import url('https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css');");
    }
    if (settings.store.themeHorizontalServerList) {
        css.push("@import url('https://raw.githubusercontent.com/DiscordStyles/HorizontalServerList/deploy/HorizontalServerList.theme.css');");
    }

    // Root Variables (Arayüz ayarlarından gelen renk, blur ve ölçü değişiklikleri)
    css.push(":root {");

    // Backgrounds
    if (settings.store.backgroundImage) {
        css.push(`  --background-image: url('${settings.store.backgroundImage}') !important;`);
    }
    css.push(`  --background-image-blur: ${settings.store.backgroundBlur || 0}px !important;`);
    css.push(`  --background-image-size: ${settings.store.backgroundSize || "cover"} !important;`);
    css.push(`  --background-image-position: ${settings.store.backgroundPosition || "center"} !important;`);

    // Popouts
    if (settings.store.popoutImage) {
        css.push(`  --popout-modal-image: url('${settings.store.popoutImage}') !important;`);
    } else {
        css.push("  --popout-modal-image: transparent !important;");
    }
    css.push(`  --popout-modal-blur: ${settings.store.popoutBlur || 0}px !important;`);
    css.push(`  --popout-modal-brightness: ${settings.store.popoutBrightness || 0.6} !important;`);

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
    css.push(`  --gradient-direction: ${settings.store.gradientDirection || "320deg"} !important;`);

    if (settings.store.accentColor) {
        css.push(`  --brand-experiment: ${settings.store.accentColor} !important;`);
        css.push(`  --brand-experiment-500: ${settings.store.accentColor} !important;`);
    }
    if (settings.store.linkColour) {
        css.push(`  --link-colour: ${settings.store.linkColour} !important;`);
        css.push(`  --text-link: ${settings.store.linkColour} !important;`);
    }

    // Layout & Padding
    css.push(`  --window-padding: ${settings.store.windowPadding || 0}px !important;`);
    css.push(`  --window-roundness: ${settings.store.windowRoundness || 0}px !important;`);

    // Brightness
    css.push(`  --serverlist-brightness: ${settings.store.serverlistBrightness || 0.6} !important;`);
    css.push(`  --left-brightness: ${settings.store.leftBrightness || 0.6} !important;`);
    css.push(`  --middle-brightness: ${settings.store.middleBrightness || 0.6} !important;`);

    css.push("}");

    // Fix for Wordmark/Title in Custom Title Bar
    if (settings.store.customTitleText) {
        css.push(`
            [class*="wordmark-"]::after {
                content: "${settings.store.customTitleText}";
                display: inline-block;
                margin-left: 8px;
                color: var(--text-muted);
                font-size: 12px;
                font-family: var(--font);
            }
            [class*="wordmark-"] > svg {
                display: ${settings.store.hideDiscordLogo ? "none" : "block"};
            }
        `);
    }

    // Custom CSS
    if (settings.store.customCss) {
        css.push(settings.store.customCss);
    }

    styleEl.innerHTML = css.join("\n");
}

const settings = definePluginSettings({
    fontQuicksand: {
        description: "Özel Quicksand Fontu",
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
    themeRadialStatus: {
        description: "Radial Durum Halkaları",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeHorizontalServerList: {
        description: "Yatay Sunucu Listesi",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: () => updateThemeStyles(settings)
    },
    backgroundImage: {
        description: "Uygulama Arka Planı URL",
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
        description: "Arka Plan Boyutu",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => updateThemeStyles(settings)
    },
    popoutImage: {
        description: "Popout/Modal Arka Plan URL",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    gradientPrimary: {
        description: "Ana Gradyan (RGB örn: 219, 219, 164)",
        type: OptionType.STRING,
        default: "219, 219, 164",
        onChange: () => updateThemeStyles(settings)
    },
    gradientSecondary: {
        description: "İkincil Gradyan (RGB örn: 14, 163, 232)",
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
        description: "Bağlantı Rengi (Hex)",
        type: OptionType.STRING,
        default: "#88f7ff",
        onChange: () => updateThemeStyles(settings)
    },
    windowPadding: {
        description: "Pencere Kenar Boşluğu (px)",
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
    homeIconUrl: {
        description: "Ana Sayfa Buton URL",
        type: OptionType.STRING,
        default: "https://i.imgur.com/rAzycBK.png",
        onChange: () => updateThemeStyles(settings)
    },
    customTitleText: {
        description: "Başlık Barı Yazısı (Logo Yanı)",
        type: OptionType.STRING,
        default: "4 0 3",
        onChange: () => updateThemeStyles(settings)
    },
    hideDiscordLogo: {
        description: "Discord Logosunu Gizle",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: () => updateThemeStyles(settings)
    },
    customCss: {
        description: "Ekstra CSS Modları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => updateThemeStyles(settings)
    }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "403Cord Gelişmiş Dinamik Tema Yöneticisi.",
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
