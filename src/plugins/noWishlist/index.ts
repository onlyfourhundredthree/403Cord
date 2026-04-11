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

function applyStyles() {
    if (typeof document === "undefined") return;

    let styleTag = document.getElementById("vc-cleanui-styles") as HTMLStyleElement;
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "vc-cleanui-styles";
        (document.head || document.documentElement).appendChild(styleTag);
    }

    let css = "";
    try {
        // Accessing settings via multiple paths to ensure we get something
        const store = settings.store || (Vencord as any).Api?.Settings?.Settings?.plugins?.CleanUI;
        if (store) {
            for (const key in CSS_RULES) {
                if (store[key] === true) {
                    css += CSS_RULES[key] + "\n";
                }
            }
        }
    } catch (e) {
        // Fail silently
    }

    if (styleTag.textContent !== css) {
        styleTag.textContent = css;
    }
}

const settings = definePluginSettings({
    hideWishlist: { type: OptionType.BOOLEAN, default: false, description: "İstek Listesini Gizle", onChange: applyStyles },
    hideShop: { type: OptionType.BOOLEAN, default: false, description: "Mağaza Butonunu Gizle", onChange: applyStyles },
    hideGift: { type: OptionType.BOOLEAN, default: false, description: "Hediye Butonunu Gizle", onChange: applyStyles },
    hideInbox: { type: OptionType.BOOLEAN, default: false, description: "Gelen Kutusunu Gizle", onChange: applyStyles },
    hideHelp: { type: OptionType.BOOLEAN, default: false, description: "Yardım Butonunu Gizle", onChange: applyStyles },
    hideGameCollection: { type: OptionType.BOOLEAN, default: false, description: "Oyun Koleksiyonunu Gizle", onChange: applyStyles },
    hideMemberlistActivity: { type: OptionType.BOOLEAN, default: false, description: "Üye Listesi Etkinliklerini Gizle", onChange: applyStyles },
    hideAppLauncher: { type: OptionType.BOOLEAN, default: false, description: "Uygulama Başlatıcıyı Gizle", onChange: applyStyles },
    hideQuests: { type: OptionType.BOOLEAN, default: false, description: "Görevleri Gizle", onChange: applyStyles },
    hideAvatarDecorations: { type: OptionType.BOOLEAN, default: false, description: "Avatar Dekorasyonlarını Gizle", onChange: applyStyles },
    hideProfileEffects: { type: OptionType.BOOLEAN, default: false, description: "Profil Efektlerini Gizle", onChange: applyStyles },
    muteEveryone: { type: OptionType.BOOLEAN, default: false, description: "@everyone & @here Sustur", onChange: applyStyles },
    muteRoles: { type: OptionType.BOOLEAN, default: false, description: "Rol Etiketlerini Sustur", onChange: applyStyles }
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

        // Ensure settings are ready by forcing the pluginName if necessary
        try { (settings as any).pluginName = "CleanUI"; } catch { }

        applyStyles();

        // Multiple retries for startup as Vencord settings can be slow to sync to disk
        setTimeout(applyStyles, 500);
        setTimeout(applyStyles, 2000);
        setTimeout(applyStyles, 5000);

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
