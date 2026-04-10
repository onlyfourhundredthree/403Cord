/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import managedStyle from "./style.css?managed";

function updateAttribute(key: string, value: any) {
    if (typeof document === "undefined" || !document.body) return;
    document.body.setAttribute(`data-cleanui-${key}`, String(value));
}

const settings = definePluginSettings({
    hideWishlist: {
        type: OptionType.BOOLEAN,
        default: true,
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
    hideNitro: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Sol menüdeki 'Nitro' butonunu gizler.",
        name: "Nitro Butonunu Gizle",
        onChange: v => updateAttribute("hideNitro", v)
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
    }
});

export default definePlugin({
    name: "Arayüz Temizleyici",
    description: "Discord arayüzündeki gereksiz öğeleri (İstek Listesi, Mağaza, Nitro vb.) gizlemenizi sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    managedStyle,
    settings,

    onStart() {
        for (const key in settings.def) {
            updateAttribute(key, settings.store[key]);
        }
    },

    onStop() {
        if (typeof document === "undefined" || !document.body) return;
        for (const key in settings.def) {
            document.body.removeAttribute(`data-cleanui-${key}`);
        }
    }
});
