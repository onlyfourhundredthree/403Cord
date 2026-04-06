/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, Settings } from "@api/Settings";
import { userStyleRootNode } from "@api/Styles";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const VARS_ID = "403cord-vars";

// Online Themes uzerinden yuklenen tema URL'leri
const THEME_URLS = [
    "https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap",
    "https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css",
    "https://discordstyles.github.io/Addons/windows-titlebar.css",
    "https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css",
];

function addThemeLinks() {
    // Once eski kalintilari temizle
    Settings.themeLinks = Settings.themeLinks.filter(url => !THEME_URLS.includes(url));
    // Simdi temiz sekilde ekle
    Settings.themeLinks = [...Settings.themeLinks, ...THEME_URLS];
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
        // userStyleRootNode'un EN SONUNA ekliyoruz
        // Boylece tema importlarindan (@import) SONRA gelir
        // ve CSS cascade'de bizim degerlerimiz kazanir
        userStyleRootNode.appendChild(el);
    }

    el.textContent = `:root {
  --background-image: url('${store.backgroundImage}');
  --background-image-blur: ${store.backgroundBlur}px;
  --background-image-size: ${store.backgroundSize};
  --background-image-position: ${store.backgroundPosition};
  --popout-modal-image: ${store.popoutImage === "transparent" ? "transparent" : "url('" + store.popoutImage + "')"};
  --popout-modal-blur: ${store.popoutBlur}px;
  --popout-modal-size: cover;
  --popout-modal-position: center;
  --home-button-image: url('${store.homeIconUrl}');
  --home-button-size: cover;
  --home-button-position: center;
  --serverlist-brightness: ${store.serverlistBrightness};
  --left-brightness: ${store.leftBrightness};
  --middle-brightness: ${store.middleBrightness};
  --right-brightness: 0;
  --popout-modal-brightness: ${store.popoutBrightness};
  --gradient-primary: ${store.gradientPrimary};
  --gradient-secondary: ${store.gradientSecondary};
  --link-colour: ${store.linkColour};
  --scrollbar-colour: rgba(255, 255, 255, 0.05);
  --gradient-direction: ${store.gradientDirection};
  --font: Quicksand;
  --window-padding: ${store.windowPadding}px;
  --window-roundness: ${store.windowRoundness}px;
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
