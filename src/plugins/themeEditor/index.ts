/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

function processUrl(val: string) {
    if (!val || val === "transparent" || val === "none") return val || "none";
    if (val.startsWith("url(")) return val;
    return `url('${val}')`;
}

function updateTheme() {
    const elId = "-vencord-custom-theme-editor";
    let el = document.getElementById(elId);
    if (!el) {
        el = document.createElement("style");
        el.id = elId;
        document.head.appendChild(el);
    }

    // Her zaman yüklenen temalar
    const imports: string[] = [];
    imports.push("@import url('https://discordstyles.github.io/FrostedGlass/FrostedGlass.css');");
    if (settings.store.radialStatus) {
        imports.push("@import url('https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css');");
    }
    // Font ayarı varsa Google Fonts yükle
    if (settings.store.font && settings.store.font.trim()) {
        imports.push(`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(settings.store.font)}:wght@100;300;400;500;700&display=swap');`);
    }

    const rootBlock = `
:root {
  --background-image: ${processUrl(settings.store.backgroundImage)};
  --background-image-blur: ${settings.store.backgroundImageBlur};
  --popout-image: ${processUrl(settings.store.popoutModalImage)};
  --popout-image-blur: ${settings.store.popoutModalBlur};
  --home-button-image: ${processUrl(settings.store.homeButtonImage)};
  --serverlist-brightness: ${settings.store.serverlistBrightness};
  --left-brightness: ${settings.store.leftBrightness};
  --middle-brightness: ${settings.store.middleBrightness};
  --right-brightness: ${settings.store.rightBrightness};
  --overlay-brightness: ${settings.store.popoutModalBrightness};
  --gradient-primary: ${settings.store.gradientPrimary};
  --gradient-secondary: ${settings.store.gradientSecondary};
  --link-colour: ${settings.store.linkColour};
  --scrollbar-colour: ${settings.store.scrollbarColour};
  --gradient-direction: ${settings.store.gradientDirection};
  --font: ${settings.store.font && settings.store.font.trim() ? settings.store.font : "inherit"};
  --window-padding: 0px;
  --window-roundness: 0px;
}
`;

    // Volume Slider Fix - Her zaman aktif
    const fixes = `
/* Volume Slider Percentage Fix */
.slider-1PF9-6 .bar-2ahnLA,
.slider-1PF9-6 .barFill-2B8r-5,
.slider-1PF9-6 .barFill-31TpShell {
    opacity: 1 !important;
}
.slider-1PF9-6 .value-17IijO,
.slider-1PF9-6 .value-2C81U-,
.slider-1PF9-6 .track-1i0S6I .grabber-13-Cq6 {
    opacity: 1 !important;
    color: var(--text-normal) !important;
}
.audio-3-PbKI .slider-1PF9-6,
.container-3XJ3hB .slider-1PF9-6,
.sliderContainer-2j7VOO {
    opacity: 1 !important;
}
/* Hide Back/Forward Buttons in Settings */
.backForwardButtons__63abb {
    display: none !important;
}
`;

    el.innerHTML = imports.join("\n") + rootBlock + fixes;
}

export const settings = definePluginSettings({
    // --- TEMEL AYARLAR ---
    radialStatus: {
        type: OptionType.BOOLEAN,
        description: "Kullanıcıların durum bilgileri (dnd, idle, online, offline) kullanıcıların avatarını çevreleyen bir yuvarlak şeklinde gözükür.",
        default: true,
        onChange: () => updateTheme()
    },

    // --- ARKAPLAN ---
    backgroundImage: { type: OptionType.STRING, description: "Arkaplan Görseli (Direkt link girin)", default: "https://images3.alphacoders.com/120/thumb-1920-1209094.jpg", onChange: () => updateTheme() },
    backgroundImageBlur: { type: OptionType.STRING, description: "Arkaplan Bulanıklığı (px)", default: "0px", onChange: () => updateTheme() },

    // --- POPUP/MODAL ---
    popoutModalImage: { type: OptionType.STRING, description: "Popup Modal Görseli (Direkt link veya 'transparent')", default: "transparent", onChange: () => updateTheme() },
    popoutModalBlur: { type: OptionType.STRING, description: "Popup Bulanıklığı (px)", default: "0px", onChange: () => updateTheme() },
    popoutModalBrightness: { type: OptionType.STRING, description: "Popup Parlaklığı (0-1)", default: "0.6", onChange: () => updateTheme() },

    // --- HOME BUTON ---
    homeButtonImage: { type: OptionType.STRING, description: "Ana Sayfa Buton Görseli (Direkt link girin)", default: "https://i.imgur.com/rAzycBK.png", onChange: () => updateTheme() },

    // --- PARLAKLIK ---
    serverlistBrightness: { type: OptionType.STRING, description: "Sunucu Listesi Parlaklığı (0-1)", default: "0.6", onChange: () => updateTheme() },
    leftBrightness: { type: OptionType.STRING, description: "Sol Panel Parlaklığı (0-1)", default: "0.6", onChange: () => updateTheme() },
    middleBrightness: { type: OptionType.STRING, description: "Orta Alan Parlaklığı (0-1)", default: "0.6", onChange: () => updateTheme() },
    rightBrightness: { type: OptionType.STRING, description: "Sağ Panel Parlaklığı (0-1)", default: "0", onChange: () => updateTheme() },

    // --- RENKLER ---
    gradientPrimary: { type: OptionType.STRING, description: "Birincil Gradyan (RGB: 103,58,183)", default: "103, 58, 183", onChange: () => updateTheme() },
    gradientSecondary: { type: OptionType.STRING, description: "İkincil Gradyan (RGB: 63,81,181)", default: "63, 81, 181", onChange: () => updateTheme() },
    gradientDirection: { type: OptionType.STRING, description: "Gradyan Yönü", default: "320deg", onChange: () => updateTheme() },
    linkColour: { type: OptionType.STRING, description: "Link Rengi", default: "#88f7ff", onChange: () => updateTheme() },
    scrollbarColour: { type: OptionType.STRING, description: "Scrollbar Rengi", default: "rgba(255,255,255,0.05)", onChange: () => updateTheme() },

    // --- FONT ---
    font: { type: OptionType.STRING, description: "Yazı Tipi (Google Fonts adı veya boş bırakın)", default: "", onChange: () => updateTheme() }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "Kullanıcıların genel Discord temasını diledikleri gibi özelleştirebildiği gelişmiş tema eklentisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,
    start() {
        updateTheme();
    },
    stop() {
        const el = document.getElementById("-vencord-custom-theme-editor");
        if (el) el.remove();
    }
});
