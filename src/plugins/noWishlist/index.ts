/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, migratePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

// Dynamic CSS mapping
const CSS_RULES: Record<string, string> = {
    hideWishlist: `
        [aria-label="İstek Listesi"], [aria-label="Wishlist"], [class*="overlay_"][class*="container_"] { display: none !important; }
    `,
    hideShop: `
        a[href="/shop"], [aria-label="Mağaza"], [aria-label="Shop"] { display: none !important; }
    `,
    hideGift: `
        [aria-label*="hediye" i], [aria-label*="gift" i], [class*="button_"]:has([aria-label*="hediye" i]), [class*="button_"]:has([aria-label*="gift" i]) { display: none !important; }
    `,
    hideInbox: `
        [aria-label="Gelen Kutusu"], [aria-label="Inbox"] { display: none !important; }
    `,
    hideHelp: `
        [aria-label="Yardım"], [aria-label="Help"], a[href*="support.discord.com"] { display: none !important; }
    `,
    hideGameCollection: `
        [class*="innerContainer_"][class*="card_"]:has([class*="displayCountText_"]), [class*="overlay_"][class*="innerContainer_"][class*="card_"] { display: none !important; }
    `,
    hideMemberlistActivity: `
        [class*="membersGroup_"]:has([class*="toggleExpandIcon_"]), [class*="membersGroup_"]:has([class*="header_"]), [class*="membersWrap_"] [class*="container_"][class*="openOnHover_"]:has([class*="infoSection_"]) { display: none !important; }
    `,
    hideAppLauncher: `
        [aria-label="Uygulamalar"], [aria-label="App Launcher"] { display: none !important; }
    `,
    hideQuests: `
        a[href="/quest-home"] { display: none !important; }
    `,
    hideAvatarDecorations: `
        [class*="avatarDecoration"], svg:has(foreignObject + [class*="avatarDecoration"]), [class*="avatar_"] > svg > foreignObject + [class*="avatarDecoration"] { display: none !important; }
    `,
    hideProfileEffects: `
        [class*="profileEffects"] { display: none !important; }
    `,
    muteEveryone: `
        [class*="mention"][class*="everyone"], [class*="mention"][class*="here"] { background-color: transparent !important; color: var(--text-normal) !important; }
    `,
    muteRoles: `
        [class*="mention"]:not([class*="everyone"], [class*="here"]) { background-color: transparent !important; }
    `
};

const styleElement: HTMLStyleElement | null = null;

function applyStyles() {
    if (typeof document === "undefined") return;

    let style = document.getElementById("vc-cleanui-styles") as HTMLStyleElement;
    if (!style) {
        style = document.createElement("style");
        style.id = "vc-cleanui-styles";
        document.head.appendChild(style);
    }

    let css = "";
    try {
        // Try several setting keys to find the right one
        const pluginSettings = settings.store ||
            (Vencord as any).Api?.Settings?.Settings?.plugins?.CleanUI ||
            (Vencord as any).Api?.Settings?.Settings?.plugins?.["Arayüz Temizleyici"];

        if (pluginSettings) {
            for (const key in CSS_RULES) {
                if (pluginSettings[key] === true) {
                    css += CSS_RULES[key];
                }
            }
        }
    } catch (e) {
        // Silent error
    }

    if (style.textContent !== css) {
        style.textContent = css;
    }
}

// Migrate settings from old IDs to new name
if (typeof Vencord !== "undefined") {
    migratePluginSettings("CleanUI", "Arayüz Temizleyici", "noWishlist", "NoWishlist");
}

const settings = definePluginSettings({
    hideWishlist: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mağazadaki 'İstek Listesi' sekmesini gizler.",
        name: "İstek Listesini Gizle",
        onChange: applyStyles
    },
    hideShop: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sol menüdeki 'Mağaza' butonunu gizler.",
        name: "Mağaza Butonunu Gizle",
        onChange: applyStyles
    },
    hideGift: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mesaj kutusundaki 'Hediye' butonunu gizler.",
        name: "Hediye Butonunu Gizle",
        onChange: applyStyles
    },
    hideInbox: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sağ üstteki 'Gelen Kutusu' butonunu gizler.",
        name: "Gelen Kutusunu Gizle",
        onChange: applyStyles
    },
    hideHelp: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sağ üstteki 'Yardım' butonunu gizler.",
        name: "Yardım Butonunu Gizle",
        onChange: applyStyles
    },
    hideGameCollection: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Profildeki 'Oyun Koleksiyonu' kısmını gizler.",
        name: "Oyun Koleksiyonunu Gizle",
        onChange: applyStyles
    },
    hideMemberlistActivity: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Üye listesinin en üstündeki 'Etkinlik' kısmını gizler.",
        name: "Üye Listesi Etkinliklerini Gizle",
        onChange: applyStyles
    },
    hideAppLauncher: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mesaj kutusundaki 'Uygulamalar' butonunu gizler.",
        name: "Uygulama Başlatıcıyı Gizle",
        onChange: applyStyles
    },
    hideQuests: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sol menüdeki 'Görevler' butonunu gizler.",
        name: "Görevleri Gizle",
        onChange: applyStyles
    },
    hideAvatarDecorations: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm kullanıcıların avatar dekorasyonlarını gizler.",
        name: "Avatar Dekorasyonlarını Gizle",
        onChange: applyStyles
    },
    hideProfileEffects: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm kullanıcıların profil efektlerini gizler.",
        name: "Profil Efektlerini Gizle",
        onChange: applyStyles
    },
    muteEveryone: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm sunucularda @everyone ve @here etiketlerini susturur.",
        name: "@everyone & @here Sustur",
        onChange: applyStyles
    },
    muteRoles: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm sunucularda rol etiketlerini (@Rol) susturur.",
        name: "Rol Etiketlerini Sustur",
        onChange: applyStyles
    }
});

export default definePlugin({
    name: "CleanUI",
    description: "Discord arayüzündeki gereksiz öğeleri (İstek Listesi, Mağaza, Nitro vb.) gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    interval: null as any,
    fastInterval: null as any,

    patches: [
        ...[
            '"MessageStore"',
            '"ReadStateStore"'
        ].map(find => ({
            find,
            replacement: [
                {
                    match: /(?<=function (\i)\((\i)\){)(?=.*MESSAGE_CREATE:\1)/,
                    replace: (_, _funcName, props) => `
                        const msg = ${props}.message;
                        if (msg) {
                            if ($self.settings.store.muteEveryone) msg.mention_everyone = false;
                            if ($self.settings.store.muteRoles) msg.mention_roles = [];
                        }
                    `
                }
            ]
        }))
    ],

    onStart() {
        // Initial application
        applyStyles();

        // Fast retries for the first 5 seconds (every 200ms)
        let count = 0;
        this.fastInterval = setInterval(() => {
            applyStyles();
            count++;
            if (count > 25) clearInterval(this.fastInterval);
        }, 200);

        // Long-term maintenance (every 3 seconds)
        this.interval = setInterval(applyStyles, 3000);

        // Watch for style tag deletion
        const observer = new MutationObserver(() => {
            if (!document.getElementById("vc-cleanui-styles")) applyStyles();
        });
        observer.observe(document.head, { childList: true });
    },

    onStop() {
        if (this.interval) clearInterval(this.interval);
        if (this.fastInterval) clearInterval(this.fastInterval);
        document.getElementById("vc-cleanui-styles")?.remove();
    }
});
