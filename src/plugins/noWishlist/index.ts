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

const CACHE_KEY = "vc-cleanui-cache";

function getCachedSettings(): Record<string, boolean> {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
}

function cacheSettings(settings: Record<string, boolean>) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore
    }
}

let isStartingUp = true;

function applyStyles() {
    if (typeof document === "undefined") return;

    let style = document.getElementById("vc-cleanui-styles") as HTMLStyleElement;
    if (!style) {
        style = document.createElement("style");
        style.id = "vc-cleanui-styles";
        (document.head || document.documentElement).appendChild(style);
    }

    if (!style) return;

    let css = "";
    try {
        const cached = getCachedSettings();

        // During startup, we trust the cache MORE than the settings store
        // because the store might not be fully linked to the disk yet.
        for (const key in CSS_RULES) {
            let val = cached[key] || false;

            // If we are not in startup, or if the store definitely has a value, use it
            if (!isStartingUp) {
                try {
                    const vStore = settings.store;
                    if (vStore && vStore[key] !== undefined) val = vStore[key];
                } catch { }
            }

            if (val === true) css += CSS_RULES[key];
        }
    } catch (e) {
        // Fallback
    }

    if (style.textContent !== css) {
        style.textContent = css;
    }
}

function handleSettingChange(key: string, value: boolean) {
    const cached = getCachedSettings();
    cached[key] = value;
    cacheSettings(cached);
    applyStyles();
}

// Migrate settings
if (typeof Vencord !== "undefined") {
    migratePluginSettings("CleanUI", "Arayüz Temizleyici", "noWishlist", "NoWishlist");
}

const settings = definePluginSettings({
    hideWishlist: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "İstek Listesini Gizle",
        onChange: v => handleSettingChange("hideWishlist", v)
    },
    hideShop: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mağaza Butonunu Gizle",
        onChange: v => handleSettingChange("hideShop", v)
    },
    hideGift: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Hediye Butonunu Gizle",
        onChange: v => handleSettingChange("hideGift", v)
    },
    hideInbox: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Gelen Kutusunu Gizle",
        onChange: v => handleSettingChange("hideInbox", v)
    },
    hideHelp: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Yardım Butonunu Gizle",
        onChange: v => handleSettingChange("hideHelp", v)
    },
    hideGameCollection: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Oyun Koleksiyonunu Gizle",
        onChange: v => handleSettingChange("hideGameCollection", v)
    },
    hideMemberlistActivity: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Üye Listesi Etkinliklerini Gizle",
        onChange: v => handleSettingChange("hideMemberlistActivity", v)
    },
    hideAppLauncher: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Uygulama Başlatıcıyı Gizle",
        onChange: v => handleSettingChange("hideAppLauncher", v)
    },
    hideQuests: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Görevleri Gizle",
        onChange: v => handleSettingChange("hideQuests", v)
    },
    hideAvatarDecorations: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Avatar Dekorasyonlarını Gizle",
        onChange: v => handleSettingChange("hideAvatarDecorations", v)
    },
    hideProfileEffects: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Profil Efektlerini Gizle",
        onChange: v => handleSettingChange("hideProfileEffects", v)
    },
    muteEveryone: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "@everyone & @here Sustur",
        onChange: v => handleSettingChange("muteEveryone", v)
    },
    muteRoles: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Rol Etiketlerini Sustur",
        onChange: v => handleSettingChange("muteRoles", v)
    }
});

export default definePlugin({
    name: "CleanUI",
    description: "Discord arayüzündeki gereksiz öğeleri (İstek Listesi, Mağaza, Nitro vb.) gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    interval: null as any,

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
        // 1. Migrate settings immediately
        migratePluginSettings("CleanUI", "Arayüz Temizleyici", "noWishlist", "NoWishlist");

        // 2. Initial application (uses cache)
        applyStyles();

        // 3. Sync Cache with Store after a delay (Settings Store should be ready by then)
        setTimeout(() => {
            isStartingUp = false;
            try {
                const { store } = settings;
                const cached = getCachedSettings();
                let changed = false;
                for (const key in settings.def) {
                    if (store[key] !== undefined && store[key] !== cached[key]) {
                        cached[key] = store[key];
                        changed = true;
                    }
                }
                if (changed) cacheSettings(cached);
                applyStyles();
            } catch { }
        }, 10000); // 10 seconds startup grace period

        // 4. Maintenance
        this.interval = setInterval(applyStyles, 3000);

        const observer = new MutationObserver(() => {
            if (!document.getElementById("vc-cleanui-styles")) applyStyles();
        });
        observer.observe(document.head || document.documentElement, { childList: true });
    },

    onStop() {
        isStartingUp = true;
        if (this.interval) clearInterval(this.interval);
        document.getElementById("vc-cleanui-styles")?.remove();
    }
});
