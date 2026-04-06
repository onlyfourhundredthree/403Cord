/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

let originalTitleDesc: PropertyDescriptor | undefined;
let intervalId: any;
let observer: MutationObserver | undefined;

const TARGET_TITLE = "4 0 3";

function forceTitle() {
    if (document.title !== TARGET_TITLE) {
        if (originalTitleDesc?.set) {
            originalTitleDesc.set.call(document, TARGET_TITLE);
        } else {
            document.title = TARGET_TITLE;
        }
    }
}

export default definePlugin({
    name: "CustomTitle",
    description: "Uygulama penceresi başlığını her zaman '4 0 3' olarak zorlar",
    authors: [Devs.Toji, Devs.Aki],
    enabledByDefault: true,

    start() {
        originalTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title");

        Object.defineProperty(document, "title", {
            configurable: true,
            get: () => TARGET_TITLE,
            set: v => {
                forceTitle();
            }
        });

        // Set it initially
        forceTitle();

        // Fallback: MutationObserver to watch for <title> tag changes
        const titleEl = document.querySelector("title");
        if (titleEl) {
            observer = new MutationObserver(() => forceTitle());
            observer.observe(titleEl, { childList: true, characterData: true });
        }

        // Periodic check to ensure it stays
        intervalId = setInterval(forceTitle, 5000);
    },

    stop() {
        clearInterval(intervalId);
        observer?.disconnect();
        if (originalTitleDesc) {
            Object.defineProperty(document, "title", originalTitleDesc);
            document.title = "Discord";
        }
    }
});
