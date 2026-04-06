/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

let originalTitleDesc: PropertyDescriptor | undefined;
let intervalId: any;
let observer: MutationObserver | undefined;
let trueTitle = "";

const settings = definePluginSettings({
    titleFormat: {
        description: "Pencere Başlığı Formatı ({current} = Orijinal Başlık)",
        type: OptionType.STRING,
        default: "{current} - 4 0 3",
        onChange: () => forceTitle()
    }
});

function forceTitle() {
    const format = settings.store.titleFormat || "{current} - 4 0 3";
    const newTitle = format.replace("{current}", trueTitle || document.title);

    if (document.title !== newTitle) {
        if (originalTitleDesc?.set) {
            originalTitleDesc.set.call(document, newTitle);
        } else {
            // Shadowing instance
            Object.defineProperty(document, "title", {
                value: newTitle,
                writable: true,
                configurable: true
            });
        }
    }
}

export default definePlugin({
    name: "CustomTitle",
    description: "Forces the application window title to be customized. Use {current} for original Discord title.",
    authors: [Devs.Toji, Devs.Aki],
    settings,
    enabledByDefault: true,

    start() {
        trueTitle = document.title;
        originalTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title");

        const originalSet = originalTitleDesc?.set;
        Object.defineProperty(document, "title", {
            configurable: true,
            get: () => {
                const format = settings.store.titleFormat || "{current} - 4 0 3";
                return format.replace("{current}", trueTitle);
            },
            set: v => {
                if (v !== (settings.store.titleFormat || "{current} - 4 0 3").replace("{current}", trueTitle)) {
                    trueTitle = v;
                    forceTitle();
                }
            }
        });

        forceTitle();

        // Fallback: MutationObserver to watch for <title> tag changes
        const titleEl = document.querySelector("title");
        if (titleEl) {
            observer = new MutationObserver(() => forceTitle());
            observer.observe(titleEl, { childList: true, characterData: true });
        }

        intervalId = setInterval(forceTitle, 5000);
    },

    stop() {
        clearInterval(intervalId);
        observer?.disconnect();
        if (originalTitleDesc) {
            Object.defineProperty(document, "title", originalTitleDesc);
        }
    }
});
