/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const THEME_PREFIX = "403cord-theme-";
const VARS_ID = "403cord-theme-vars";

// Her tema icin ayri bir <link> etiketi oluşturur - Discord'un kendi tema sistemiyle tamamen uyumlu
function setThemeLink(id: string, url: string | null) {
    const fullId = THEME_PREFIX + id;
    let link = document.getElementById(fullId) as HTMLLinkElement | null;

    if (!url) {
        // Tema kapatıldı, link'i sil
        link?.remove();
        return;
    }

    if (!link) {
        link = document.createElement("link");
        link.id = fullId;
        link.rel = "stylesheet";
        link.type = "text/css";
        document.documentElement.appendChild(link);
    }

    if (link.href !== url) {
        link.href = url;
    }
}

// Degiskenler icin tekil bir <style> etiketi
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
    lines.push(`  --font: ${settings.store.fontQuicksand ? "Quicksand" : "gg sans"};`);

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

function applyAll(settings: any) {
    // Font - Google Fonts
    setThemeLink("font", settings.store.fontQuicksand
        ? "https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap"
        : null
    );

    // FrostedGlass
    setThemeLink("frostedglass", settings.store.themeFrostedGlass
        ? "https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css"
        : null
    );

    // Windows Titlebar
    setThemeLink("titlebar", settings.store.themeWindowsTitlebar
        ? "https://discordstyles.github.io/Addons/windows-titlebar.css"
        : null
    );

    // Radial Status
    setThemeLink("radialstatus", settings.store.themeRadialStatus
        ? "https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css"
        : null
    );

    // Variables
    updateVars(settings);
}

const settings = definePluginSettings({
    fontQuicksand: {
        description: "Quicksand Fontu",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => applyAll(settings)
    },
    themeFrostedGlass: {
        description: "Buzlu Cam (Frosted Glass) Efekti",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => applyAll(settings)
    },
    themeWindowsTitlebar: {
        description: "Windows Uyumlu Üst Bar",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => applyAll(settings)
    },
    themeRadialStatus: {
        description: "Radial Durum Halkaları",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => applyAll(settings)
    },
    backgroundImage: {
        description: "Ana Arka Plan URL",
        type: OptionType.STRING,
        default: "https://i.imgur.com/OHStaWu.png",
        onChange: () => applyAll(settings)
    },
    backgroundBlur: {
        description: "Arka Plan Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyAll(settings)
    },
    backgroundSize: {
        description: "Arka Plan Ebatı (cover, contain vb.)",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => applyAll(settings)
    },
    backgroundPosition: {
        description: "Arka Plan Konumu (center, top vb.)",
        type: OptionType.STRING,
        default: "center",
        onChange: () => applyAll(settings)
    },
    popoutImage: {
        description: "Popout/Modal Arka Plan URL",
        type: OptionType.STRING,
        default: "transparent",
        onChange: () => applyAll(settings)
    },
    popoutBlur: {
        description: "Popout Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyAll(settings)
    },
    popoutBrightness: {
        description: "Popout Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyAll(settings)
    },
    homeIconUrl: {
        description: "Ana Sayfa Buton İkonu",
        type: OptionType.STRING,
        default: "https://i.imgur.com/rAzycBK.png",
        onChange: () => applyAll(settings)
    },
    gradientPrimary: {
        description: "Ana Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "219, 219, 164",
        onChange: () => applyAll(settings)
    },
    gradientSecondary: {
        description: "İkincil Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "14, 163, 232",
        onChange: () => applyAll(settings)
    },
    gradientDirection: {
        description: "Gradyan Açısı (örn: 320deg)",
        type: OptionType.STRING,
        default: "320deg",
        onChange: () => applyAll(settings)
    },
    linkColour: {
        description: "Link Rengi",
        type: OptionType.STRING,
        default: "#88f7ff",
        onChange: () => applyAll(settings)
    },
    windowPadding: {
        description: "Pencere Boşluğu (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyAll(settings)
    },
    windowRoundness: {
        description: "Pencere Köşe Yuvarlaklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyAll(settings)
    },
    serverlistBrightness: {
        description: "Sunucu Listesi Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyAll(settings)
    },
    leftBrightness: {
        description: "Sol Panel Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyAll(settings)
    },
    middleBrightness: {
        description: "Chat Alanı Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyAll(settings)
    },
    customCss: {
        description: "Özel CSS Kodları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => applyAll(settings)
    }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "403Cord Dinamik Tema Yöneticisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,

    start() {
        applyAll(settings);
    },

    stop() {
        // Tüm tema linklerini temizle
        document.querySelectorAll(`[id^="${THEME_PREFIX}"]`).forEach(el => el.remove());
        document.getElementById(VARS_ID)?.remove();
    }
});
