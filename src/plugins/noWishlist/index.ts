/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, migratePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import managedStyle from "./style.css?managed";

const CACHE_KEY = "vc-cleanui-v3-cache";

function getCache() {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch { return {}; }
}

function setCache(c: any) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch { }
}

let isStartingUp = true;

function updateClasses() {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const cache = getCache();

    let store: any = null;
    try {
        store = settings.store;
    } catch { }

    for (const key in settings.def) {
        const className = `vc-clean-${key}`;

        // Cache is our primary source during startup
        let val = cache[key] || false;

        // After startup, we sync with the store
        if (!isStartingUp && store && store[key] !== undefined) {
            val = store[key];
            // Update cache if they differ
            if (val !== cache[key]) {
                cache[key] = val;
                setCache(cache);
            }
        }

        if (val) {
            if (!root.classList.contains(className)) root.classList.add(className);
        } else {
            if (root.classList.contains(className)) root.classList.remove(className);
        }
    }
}

const settings = definePluginSettings({
    hideWishlist: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "İstek Listesini Gizle",
        onChange: v => {
            const c = getCache();
            c.hideWishlist = v;
            setCache(c);
            updateClasses();
        }
    },
    hideShop: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Mağaza Butonunu Gizle",
        onChange: v => {
            const c = getCache();
            c.hideShop = v;
            setCache(c);
            updateClasses();
        }
    },
    hideGift: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Hediye Butonunu Gizle",
        onChange: v => {
            const c = getCache();
            c.hideGift = v;
            setCache(c);
            updateClasses();
        }
    },
    hideInbox: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Gelen Kutusunu Gizle",
        onChange: v => {
            const c = getCache();
            c.hideInbox = v;
            setCache(c);
            updateClasses();
        }
    },
    hideHelp: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Yardım Butonunu Gizle",
        onChange: v => {
            const c = getCache();
            c.hideHelp = v;
            setCache(c);
            updateClasses();
        }
    },
    hideGameCollection: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Oyun Koleksiyonunu Gizle",
        onChange: v => {
            const c = getCache();
            c.hideGameCollection = v;
            setCache(c);
            updateClasses();
        }
    },
    hideMemberlistActivity: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Üye Listesi Etkinliklerini Gizle",
        onChange: v => {
            const c = getCache();
            c.hideMemberlistActivity = v;
            setCache(c);
            updateClasses();
        }
    },
    hideAppLauncher: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Uygulama Başlatıcıyı Gizle",
        onChange: v => {
            const c = getCache();
            c.hideAppLauncher = v;
            setCache(c);
            updateClasses();
        }
    },
    hideQuests: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Görevleri Gizle",
        onChange: v => {
            const c = getCache();
            c.hideQuests = v;
            setCache(c);
            updateClasses();
        }
    },
    hideAvatarDecorations: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Avatar Dekorasyonlarını Gizle",
        onChange: v => {
            const c = getCache();
            c.hideAvatarDecorations = v;
            setCache(c);
            updateClasses();
        }
    },
    hideProfileEffects: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Profil Efektlerini Gizle",
        onChange: v => {
            const c = getCache();
            c.hideProfileEffects = v;
            setCache(c);
            updateClasses();
        }
    },
    muteEveryone: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "@everyone & @here Sustur",
        onChange: v => {
            const c = getCache();
            c.muteEveryone = v;
            setCache(c);
            updateClasses();
        }
    },
    muteRoles: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Rol Etiketlerini Sustur",
        onChange: v => {
            const c = getCache();
            c.muteRoles = v;
            setCache(c);
            updateClasses();
        }
    }
});

export default definePlugin({
    name: "CleanUI",
    description: "Discord arayüzündeki gereksiz öğeleri gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,
    managedStyle,

    maintenanceInterval: null as any,

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

        isStartingUp = true;
        updateClasses();

        // Nuclear startup: re-apply frequently to fight Discord's initial renders
        const start = Date.now();
        const startInterval = setInterval(() => {
            updateClasses();
            if (Date.now() - start > 20000) {
                clearInterval(startInterval);
                isStartingUp = false;
                updateClasses(); // Final sync with store
            }
        }, 1000);

        this.maintenanceInterval = setInterval(updateClasses, 5000);
    },

    onStop() {
        isStartingUp = true;
        if (this.maintenanceInterval) clearInterval(this.maintenanceInterval);
        if (typeof document !== "undefined") {
            const root = document.documentElement;
            for (const key in settings.def) {
                root.classList.remove(`vc-clean-${key}`);
            }
        }
    }
});
