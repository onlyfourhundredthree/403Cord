/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { userStyleRootNode } from "@api/Styles";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "403cord-theme";

/**
 * Bu fonksiyon main.css dosyasinin BIREBIR AYNISINI uretir.
 * Ciktisi Discord'un Quick CSS kutusuna yapistirildiginda calisan
 * CSS ile karakter karakter aynidir.
 */
function buildCss(s: any): string {
    const { store } = s;
    const parts: string[] = [];

    // @import satirlari - CSS'in en ustunde olmali
    parts.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
    parts.push("@import url('https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css');");
    parts.push("@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');");
    parts.push("@import url('https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css');");

    // :root blogu
    parts.push(":root {");
    parts.push(`  --background-image: url('${store.backgroundImage}');`);
    parts.push(`  --background-image-blur: ${store.backgroundBlur}px;`);
    parts.push(`  --background-image-size: ${store.backgroundSize};`);
    parts.push(`  --background-image-position: ${store.backgroundPosition};`);
    parts.push(`  --popout-modal-image: ${store.popoutImage === "transparent" ? "transparent" : "url('" + store.popoutImage + "')"};`);
    parts.push(`  --popout-modal-blur: ${store.popoutBlur}px;`);
    parts.push("  --popout-modal-size: cover;");
    parts.push("  --popout-modal-position: center;");
    parts.push(`  --home-button-image: url('${store.homeIconUrl}');`);
    parts.push("  --home-button-size: cover;");
    parts.push("  --home-button-position: center;");
    parts.push(`  --serverlist-brightness: ${store.serverlistBrightness};`);
    parts.push(`  --left-brightness: ${store.leftBrightness};`);
    parts.push(`  --middle-brightness: ${store.middleBrightness};`);
    parts.push("  --right-brightness: 0;");
    parts.push(`  --popout-modal-brightness: ${store.popoutBrightness};`);
    parts.push(`  --gradient-primary: ${store.gradientPrimary};`);
    parts.push(`  --gradient-secondary: ${store.gradientSecondary};`);
    parts.push(`  --link-colour: ${store.linkColour};`);
    parts.push("  --scrollbar-colour: rgba(255, 255, 255, 0.05);");
    parts.push(`  --gradient-direction: ${store.gradientDirection};`);
    parts.push("  --font: Quicksand;");
    parts.push(`  --window-padding: ${store.windowPadding}px;`);
    parts.push(`  --window-roundness: ${store.windowRoundness}px;`);
    parts.push("  --update-notice-1: none;");
    parts.push("  --columns: 2;");
    parts.push("  --guildgap: 2;");
    parts.push("  --aligndms: 0;");
    parts.push("  --rs-small-spacing: 0px;");
    parts.push("  --rs-medium-spacing: 0px;");
    parts.push("  --rs-large-spacing: 0px;");
    parts.push("  --rs-small-width: 2.5px;");
    parts.push("  --rs-medium-width: 2.5px;");
    parts.push("  --rs-large-width: 2px;");
    parts.push("  --rs-avatar-shape: 50%;");
    parts.push("  --rs-online-color: #1ED883;");
    parts.push("  --rs-idle-color: #EE9A0E;");
    parts.push("  --rs-dnd-color: #F12222;");
    parts.push("  --rs-offline-color: #636b75;");
    parts.push("  --rs-streaming-color: #6E29E4;");
    parts.push("  --rs-phone-visible: block;");
    parts.push("}");

    if (store.customCss) {
        parts.push(store.customCss);
    }

    return parts.join("\n");
}

function applyTheme(s: any) {
    // Vencord'un kendi tema stili icin kullandigi DOM dugumune ekliyoruz.
    // Bu, Quick CSS kutusuna yapistirilmasiyla TAMAMEN AYNI yere koyuyor.
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        userStyleRootNode.appendChild(el);
    }
    el.textContent = buildCss(s);
}

const settings = definePluginSettings({
    backgroundImage: {
        description: "Ana Arka Plan URL",
        type: OptionType.STRING,
        default: "https://i.imgur.com/OHStaWu.png",
        onChange: () => applyTheme(settings)
    },
    backgroundBlur: {
        description: "Arka Plan Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyTheme(settings)
    },
    backgroundSize: {
        description: "Arka Plan Ebatı",
        type: OptionType.STRING,
        default: "cover",
        onChange: () => applyTheme(settings)
    },
    backgroundPosition: {
        description: "Arka Plan Konumu",
        type: OptionType.STRING,
        default: "center",
        onChange: () => applyTheme(settings)
    },
    popoutImage: {
        description: "Popout Arka Plan",
        type: OptionType.STRING,
        default: "transparent",
        onChange: () => applyTheme(settings)
    },
    popoutBlur: {
        description: "Popout Bulanıklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyTheme(settings)
    },
    popoutBrightness: {
        description: "Popout Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyTheme(settings)
    },
    homeIconUrl: {
        description: "Ana Sayfa Buton İkonu",
        type: OptionType.STRING,
        default: "https://i.imgur.com/rAzycBK.png",
        onChange: () => applyTheme(settings)
    },
    serverlistBrightness: {
        description: "Sunucu Listesi Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyTheme(settings)
    },
    leftBrightness: {
        description: "Sol Panel Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyTheme(settings)
    },
    middleBrightness: {
        description: "Chat Alanı Parlaklığı (0-1)",
        type: OptionType.NUMBER,
        default: 0.6,
        onChange: () => applyTheme(settings)
    },
    gradientPrimary: {
        description: "Ana Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "219, 219, 164",
        onChange: () => applyTheme(settings)
    },
    gradientSecondary: {
        description: "İkincil Gradyan (R,G,B)",
        type: OptionType.STRING,
        default: "14, 163, 232",
        onChange: () => applyTheme(settings)
    },
    gradientDirection: {
        description: "Gradyan Açısı",
        type: OptionType.STRING,
        default: "320deg",
        onChange: () => applyTheme(settings)
    },
    linkColour: {
        description: "Link Rengi",
        type: OptionType.STRING,
        default: "#88f7ff",
        onChange: () => applyTheme(settings)
    },
    windowPadding: {
        description: "Pencere Boşluğu (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyTheme(settings)
    },
    windowRoundness: {
        description: "Pencere Köşe Yuvarlaklığı (px)",
        type: OptionType.NUMBER,
        default: 0,
        onChange: () => applyTheme(settings)
    },
    customCss: {
        description: "Özel CSS Kodları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => applyTheme(settings)
    }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "403Cord Dinamik Tema Yöneticisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,

    start() {
        applyTheme(settings);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    }
});
