/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import managedStyle from "./style.css?managed";

function updateAttribute(key: string, value: any) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const attr = `data-cleanui-${key}`;
    const val = String(value);
    if (root.getAttribute(attr) !== val) {
        root.setAttribute(attr, val);
    }
}

const settings = definePluginSettings({
    hideWishlist: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mağazadaki 'İstek Listesi' sekmesini gizler.",
        name: "İstek Listesini Gizle",
        onChange: v => updateAttribute("hideWishlist", v)
    },
    hideShop: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sol menüdeki 'Mağaza' butonunu gizler.",
        name: "Mağaza Butonunu Gizle",
        onChange: v => updateAttribute("hideShop", v)
    },
    hideGift: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mesaj kutusundaki 'Hediye' butonunu gizler.",
        name: "Hediye Butonunu Gizle",
        onChange: v => updateAttribute("hideGift", v)
    },
    hideInbox: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sağ üstteki 'Gelen Kutusu' butonunu gizler.",
        name: "Gelen Kutusunu Gizle",
        onChange: v => updateAttribute("hideInbox", v)
    },
    hideHelp: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sağ üstteki 'Yardım' butonunu gizler.",
        name: "Yardım Butonunu Gizle",
        onChange: v => updateAttribute("hideHelp", v)
    },
    hideGameCollection: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Profildeki 'Oyun Koleksiyonu' kısmını gizler.",
        name: "Oyun Koleksiyonunu Gizle",
        onChange: v => updateAttribute("hideGameCollection", v)
    },
    hideMemberlistActivity: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Üye listesinin en üstündeki 'Etkinlik' kısmını gizler.",
        name: "Üye Listesi Etkinliklerini Gizle",
        onChange: v => updateAttribute("hideMemberlistActivity", v)
    },
    hideAppLauncher: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mesaj kutusundaki 'Uygulamalar' butonunu gizler.",
        name: "Uygulama Başlatıcıyı Gizle",
        onChange: v => updateAttribute("hideAppLauncher", v)
    },
    hideQuests: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sol menüdeki 'Görevler' butonunu gizler.",
        name: "Görevleri Gizle",
        onChange: v => updateAttribute("hideQuests", v)
    },
    hideAvatarDecorations: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm kullanıcıların avatar dekorasyonlarını gizler.",
        name: "Avatar Dekorasyonlarını Gizle",
        onChange: v => updateAttribute("hideAvatarDecorations", v)
    },
    muteEveryone: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm sunucularda @everyone ve @here etiketlerini susturur.",
        name: "@everyone & @here Sustur",
        onChange: v => updateAttribute("muteEveryone", v)
    },
    muteRoles: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm sunucularda rol etiketlerini (@Rol) susturur.",
        name: "Rol Etiketlerini Sustur",
        onChange: v => updateAttribute("muteRoles", v)
    },
    hideProfileEffects: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Tüm kullanıcıların profil efektlerini gizler.",
        name: "Profil Efektlerini Gizle",
        onChange: v => updateAttribute("hideProfileEffects", v)
    }
});

export default definePlugin({
    name: "Arayüz Temizleyici",
    description: "Discord arayüzündeki gereksiz öğeleri (İstek Listesi, Mağaza, Nitro vb.) gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    managedStyle,
    settings,

    observer: null as MutationObserver | null,

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
        // Apply immediately
        this.applyAllAttributes();

        // Apply again after a short delay to ensure DOM is ready and settings are synced
        setTimeout(() => this.applyAllAttributes(), 500);
        setTimeout(() => this.applyAllAttributes(), 2000);
        setTimeout(() => this.applyAllAttributes(), 5000);

        // Persistent observer to ensure attributes stay there
        if (typeof document !== "undefined") {
            this.observer = new MutationObserver(mutations => {
                // If any attributes were changed or nodes added, re-verify our attributes
                for (const mutation of mutations) {
                    if (mutation.type === "attributes" || mutation.type === "childList") {
                        this.applyAllAttributes();
                        break;
                    }
                }
            });

            this.observer.observe(document.documentElement, {
                attributes: true,
                childList: true,
                subtree: false // Only need to watch <html> level
            });

            // Also watch <body> just in case Discord resets it
            const watchBody = () => {
                if (document.body) {
                    this.observer?.observe(document.body, { attributes: true });
                } else {
                    setTimeout(watchBody, 100);
                }
            };
            watchBody();
        }
    },

    applyAllAttributes() {
        try {
            const { store } = settings;
            if (!store) return;

            for (const key in settings.def) {
                const value = store[key];
                if (value !== undefined) {
                    updateAttribute(key, value);
                }
            }
        } catch (e) {
            // Silently fail if settings aren't ready yet
        }
    },

    onStop() {
        this.observer?.disconnect();
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        for (const key in settings.def) {
            root.removeAttribute(`data-cleanui-${key}`);
        }
        if (document.body) {
            for (const key in settings.def) {
                document.body.removeAttribute(`data-cleanui-${key}`);
            }
        }
    }
});
