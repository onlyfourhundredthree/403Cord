/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const providers = [
    "Apple",
    "BlobMoji",
    "Facebook",
    "Google",
    "Huawei",
    "JoyPixels",
    "Microsoft",
    "Microsoft-3D",
    "OpenMoji",
    "Samsung",
    "Samsung-Old",
    "Toss",
    "WhatsApp"
] as const;

const settings = definePluginSettings({
    provider: {
        type: OptionType.SELECT,
        description: "Discord'un varsayılan emojilerini (Twemoji) hangi sağlayıcı ile değiştirmek istersiniz?",
        options: providers.map(p => ({ label: p, value: p })),
        default: "Apple",
        restartNeeded: false,
        onChange(newValue) {
            updateStyle(newValue as string);
        }
    },
});

let style: HTMLStyleElement | null = null;

function updateStyle(provider: string) {
    if (!style) {
        style = document.createElement("style");
        style.id = "vc-emoji-replace-style";
        document.head.append(style);
    }
    style.textContent = `@import url(https://mwittrien.github.io/BetterDiscordAddons/Themes/EmojiReplace/base/${provider}.css);`;
}

export default definePlugin({
    name: "EmojiReplace",
    description: "Discord'un varsayılan emojilerini Apple, Google, Facebook ve daha fazlası gibi farklı sağlayıcıların emojileriyle değiştirir.",
    authors: [
        { name: "DevilBro", id: 278543574059057154n },
        { name: "Antigravity", id: 0n }
    ],
    settings,

    start() {
        updateStyle(settings.store.provider!);
    },

    stop() {
        style?.remove();
        style = null;
    }
});
