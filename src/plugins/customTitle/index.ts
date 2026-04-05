/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

let originalTitleDesc: PropertyDescriptor | undefined;

export default definePlugin({
    name: "CustomTitle",
    description: "Forces the application window title to always be '4 0 3'",
    authors: [Devs.Toji, Devs.Aki],
    enabledByDefault: true,

    start() {
        originalTitleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title");
        if (!originalTitleDesc) return;

        Object.defineProperty(document, "title", {
            configurable: true,
            get: () => "4 0 3",
            set: v => {
                // Ignore Discord's attempts to set the title, always set it to 4 0 3
                originalTitleDesc!.set!.call(document, "4 0 3");
            }
        });

        // Set it initially
        originalTitleDesc.set!.call(document, "4 0 3");
    },

    stop() {
        if (originalTitleDesc) {
            Object.defineProperty(document, "title", originalTitleDesc);
            document.title = "Discord"; // Reset to default
        }
    }
});
