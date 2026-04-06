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

    // Fonts
    if (settings.store.fontQuicksand) {
        css.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
        css.push("body, button, input, select, textarea, [class*='text-'], [class*='name-'], [class*='header-'] { font-family: 'Quicksand', sans-serif !important; }");
    }

    // Addons
    if (settings.store.themeFrostedGlass) {
        css.push("@import url('https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css');");
    }
    if (settings.store.themeWindowsTitlebar) {
        css.push("@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');");
    }
    if (settings.store.themeServerColumns) {
        css.push("@import url('https://mwittrien.github.io/BetterDiscordAddons/Themes/ServerColumns/ServerColumns.css');");
    }
    if (settings.store.themeRadialStatus) {
        css.push("@import url('https://discordstyles.github.io/RadialStatus/dist/RadialStatus.css');");
    }
    if (settings.store.themeDiscolored) {
        css.push("@import url('https://nyri4.github.io/Discolored/main.css');");
    }

    // Custom Colors & Variables
    css.push(":root {");
    if (settings.store.accentColor) {
        css.push(`  --brand-experiment: ${settings.store.accentColor} !important;`);
        css.push(`  --brand-experiment-500: ${settings.store.accentColor} !important;`);
        css.push(`  --text-link: ${settings.store.accentColor} !important;`);
    }
    if (settings.store.backgroundChat) {
        css.push(`  --background-primary: ${settings.store.backgroundChat} !important;`);
    }
    if (settings.store.backgroundSidebar) {
        css.push(`  --background-secondary: ${settings.store.backgroundSidebar} !important;`);
        css.push(`  --background-secondary-alt: ${settings.store.backgroundSidebar} !important;`);
    }
    if (settings.store.backgroundTertiary) {
        css.push(`  --background-tertiary: ${settings.store.backgroundTertiary} !important;`);
    }
    if (settings.store.homeIconUrl) {
        css.push(`  --home-image: url('${settings.store.homeIconUrl}') !important;`);
        css.push(`  .homeIcon-158wK6 { content: var(--home-image); }`);
    }
    css.push("}");

    // Custom CSS from string
    if (settings.store.customCss) {
        css.push(settings.store.customCss);
    }

    styleEl.innerHTML = css.join("\n");
}

const settings = definePluginSettings({
    fontQuicksand: {
        description: "Quicksand Font Kullan (Google Fonts'tan Özel İnce Yazı Tipi)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeFrostedGlass: {
        description: "Frosted Glass Aktifleştir (Buzlu Cam Saydam Tema Efekti)",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: () => updateThemeStyles(settings)
    },
    themeWindowsTitlebar: {
        description: "Windows Uyumlu Üst Bar (Daha zarif ve temiz native titlebar)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeServerColumns: {
        description: "Sunucu Sütunları (Sunucu listesini ızgara diziliminde yapar)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeRadialStatus: {
        description: "Yuvarlak Durum Çizgileri (Kullanıcı durumlarını profil fotoğrafı etrafına sarar)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    themeDiscolored: {
        description: "Discolored Eklentisi (Discord'un sıkıcı SVG ikonlarını renkli hale getirir)",
        type: OptionType.BOOLEAN,
        default: true,
        onChange: () => updateThemeStyles(settings)
    },
    accentColor: {
        description: "Vurgu Rengi (Hex Kodu Örn: #5865f2)",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    backgroundChat: {
        description: "Sohbet Arka Planı (Hex Kodu Örn: #1e1e1e)",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    backgroundSidebar: {
        description: "Yan Panel Arka Planı (Sunucu Listesi vb.)",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    backgroundTertiary: {
        description: "Üçüncül Arka Plan (Ayarlar, Arama vb.)",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    homeIconUrl: {
        description: "Discord Ana Sayfa Butonu Görseli (URL)",
        type: OptionType.STRING,
        default: "",
        onChange: () => updateThemeStyles(settings)
    },
    customCss: {
        description: "Özel CSS Kodları",
        type: OptionType.STRING,
        multiline: true,
        default: "",
        onChange: () => updateThemeStyles(settings)
    }
});

export default definePlugin({
    name: "ThemeEditor",
    description: "403Cord Dinamik Tema ve Özel Stiller Yöneticisi.",
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
