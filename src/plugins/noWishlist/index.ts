/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, migratePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const CSS_RULES: Record<string, string> = {
    hideWishlist: '[aria-label="İstek Listesi"], [aria-label="Wishlist"], [class*="overlay_"][class*="container_"] { display: none !important; }',
    hideShop: 'a[href="/shop"], [aria-label="Mağaza"], [aria-label="Shop"] { display: none !important; }',
    hideGift: '[aria-label*="hediye" i], [aria-label*="gift" i], [class*="button_"]:has([aria-label*="hediye" i]), [class*="button_"]:has([aria-label*="gift" i]) { display: none !important; }',
    hideInbox: '[aria-label="Gelen Kutusu"], [aria-label="Inbox"] { display: none !important; }',
    hideHelp: '[aria-label="Yardım"], [aria-label="Help"], a[href*="support.discord.com"] { display: none !important; }',
    hideGameCollection: '[class*="innerContainer_"][class*="card_"]:has([class*="displayCountText_"]), [class*="overlay_"][class*="innerContainer_"][class*="card_"] { display: none !important; }',
    hideMemberlistActivity: '[class*="membersGroup_"]:has([class*="toggleExpandIcon_"]), [class*="membersGroup_"]:has([class*="header_"]), [class*="membersWrap_"] [class*="container_"][class*="openOnHover_"]:has([class*="infoSection_"]) { display: none !important; }',
    hideAppLauncher: '[aria-label="Uygulamalar"], [aria-label="App Launcher"] { display: none !important; }',
    hideQuests: 'a[href="/quest-home"] { display: none !important; }',
    hideAvatarDecorations: '[class*="avatarDecoration"], svg:has(foreignObject + [class*="avatarDecoration"]), [class*="avatar_"] > svg > foreignObject + [class*="avatarDecoration"] { display: none !important; }',
    hideProfileEffects: '[class*="profileEffects"] { display: none !important; }',
    muteEveryone: '[class*="mention"][class*="everyone"], [class*="mention"][class*="here"] { background-color: transparent !important; color: var(--text-normal) !important; }',
    muteRoles: '[class*="mention"]:not([class*="everyone"], [class*="here"]) { background-color: transparent !important; }'
};

const CACHE_KEY = "vc-cleanui-emergency-v1";

function getEmergencyCache() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch { return {}; }
}

function updateEmergencyCache(key: string, val: boolean) {
    try {
        const cache = getEmergencyCache();
        cache[key] = val;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { }
}

function applyStyles() {
    if (typeof document === "undefined") return;

    let styleTag = document.getElementById("vc-cleanui-styles") as HTMLStyleElement;
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "vc-cleanui-styles";
        (document.head || document.documentElement).appendChild(styleTag);
    }

    let css = "";
    const emergency = getEmergencyCache();
    let store: any = null;
    try { store = settings.store; } catch { }

    for (const key in CSS_RULES) {
        // We TRUST Vencord store if it has a value, otherwise we use Emergency Cache
        const val = (store && store[key] !== undefined) ? store[key] : emergency[key];
        if (val) {
            css += CSS_RULES[key] + "\n";
        }
    }

    if (styleTag.textContent !== css) styleTag.textContent = css;
}

const handle = (key: string, v: boolean) => {
    updateEmergencyCache(key, v);
    applyStyles();
};

const settings = definePluginSettings({
    hideWishlist: { type: OptionType.BOOLEAN, default: false, description: "İstek Listesini Gizle", onChange: v => handle("hideWishlist", v) },
    hideShop: { type: OptionType.BOOLEAN, default: false, description: "Mağaza Butonunu Gizle", onChange: v => handle("hideShop", v) },
    hideGift: { type: OptionType.BOOLEAN, default: false, description: "Hediye Butonunu Gizle", onChange: v => handle("hideGift", v) },
    hideInbox: { type: OptionType.BOOLEAN, default: false, description: "Gelen Kutusunu Gizle", onChange: v => handle("hideInbox", v) },
    hideHelp: { type: OptionType.BOOLEAN, default: false, description: "Yardım Butonunu Gizle", onChange: v => handle("hideHelp", v) },
    hideGameCollection: { type: OptionType.BOOLEAN, default: false, description: "Oyun Koleksiyonunu Gizle", onChange: v => handle("hideGameCollection", v) },
    hideMemberlistActivity: { type: OptionType.BOOLEAN, default: false, description: "Üye Listesi Etkinliklerini Gizle", onChange: v => handle("hideMemberlistActivity", v) },
    hideAppLauncher: { type: OptionType.BOOLEAN, default: false, description: "Uygulama Başlatıcıyı Gizle", onChange: v => handle("hideAppLauncher", v) },
    hideQuests: { type: OptionType.BOOLEAN, default: false, description: "Görevleri Gizle", onChange: v => handle("hideQuests", v) },
    hideAvatarDecorations: { type: OptionType.BOOLEAN, default: false, description: "Avatar Dekorasyonlarını Gizle", onChange: v => handle("hideAvatarDecorations", v) },
    hideProfileEffects: { type: OptionType.BOOLEAN, default: false, description: "Profil Efektlerini Gizle", onChange: v => handle("hideProfileEffects", v) },
    muteEveryone: { type: OptionType.BOOLEAN, default: false, description: "@everyone & @here Sustur", onChange: v => handle("muteEveryone", v) },
    muteRoles: { type: OptionType.BOOLEAN, default: false, description: "Rol Etiketlerini Sustur", onChange: v => handle("muteRoles", v) }
});

export default definePlugin({
    name: "CleanUI",
    description: "Discord arayüzündeki gereksiz öğeleri gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

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
        migratePluginSettings("CleanUI", "Arayüz Temizleyici", "noWishlist", "NoWishlist");

        // Expose for console debugging
        if (typeof window !== "undefined") {
            (window as any).__CLEANUI_DEBUG = {
                apply: applyStyles,
                settings: settings,
                cache: getEmergencyCache,
                rules: CSS_RULES
            };
        }

        applyStyles();

        // Initial sync of emergency cache with store once READY
        setTimeout(() => {
            const cache = getEmergencyCache();
            const { store } = settings;
            let changed = false;
            for (const key in settings.def) {
                if (store[key] !== undefined && store[key] !== cache[key]) {
                    cache[key] = store[key];
                    changed = true;
                }
            }
            if (changed) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                applyStyles();
            }
        }, 3000);

        this.interval = setInterval(applyStyles, 1000);

        const observer = new MutationObserver(() => {
            if (!document.getElementById("vc-cleanui-styles")) applyStyles();
        });
        observer.observe(document.head || document.documentElement, { childList: true });
    },

    onStop() {
        if (this.interval) clearInterval(this.interval);
        document.getElementById("vc-cleanui-styles")?.remove();
    }
});
