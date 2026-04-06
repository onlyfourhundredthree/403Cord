/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "403cord-theme";

function applyTheme(s: any) {
    const { store } = s;

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }

    // Sadece :root degiskenleri - hicbir @import yok
    el.textContent = `:root {
  --background-image: url('${store.backgroundImage}');
  --background-image-blur: ${store.backgroundBlur}px;
  --background-image-size: cover;
  --background-image-position: center;
  --popout-modal-image: transparent;
  --popout-modal-blur: 0px;
  --popout-modal-size: cover;
  --popout-modal-position: center;
  --home-button-image: url('${store.homeIconUrl}');
  --home-button-size: cover;
  --home-button-position: center;
  --serverlist-brightness: ${store.serverlistBrightness};
  --left-brightness: ${store.leftBrightness};
  --middle-brightness: ${store.middleBrightness};
  --right-brightness: 0;
  --popout-modal-brightness: 0.6;
  --gradient-primary: ${store.gradientPrimary};
  --gradient-secondary: ${store.gradientSecondary};
  --link-colour: ${store.linkColour};
  --scrollbar-colour: rgba(255, 255, 255, 0.05);
  --gradient-direction: ${store.gradientDirection};
  --font: Quicksand;
  --window-padding: 0px;
  --window-roundness: 0px;
  --update-notice-1: none;
  --columns: 2;
  --guildgap: 2;
  --aligndms: 0;
  --rs-small-spacing: 0px;
  --rs-medium-spacing: 0px;
  --rs-large-spacing: 0px;
  --rs-small-width: 2.5px;
  --rs-medium-width: 2.5px;
  --rs-large-width: 2px;
  --rs-avatar-shape: 50%;
  --rs-online-color: #1ED883;
  --rs-idle-color: #EE9A0E;
  --rs-dnd-color: #F12222;
  --rs-offline-color: #636b75;
  --rs-streaming-color: #6E29E4;
  --rs-phone-visible: block;
}`;
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
