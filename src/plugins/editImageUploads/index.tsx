/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

import { Components } from "./components"; // We'll export components as an object or modify the code
import { hooks } from "./hooks";
import { utils } from "./utils";

const settings = definePluginSettings({
    backgroundColor: {
        type: OptionType.STRING,
        description: "Editor Background Color",
        default: "#393946",
    },
    exportType: {
        type: OptionType.SELECT,
        description: "Export Image Format",
        options: [
            { label: "WebP", value: "image/webp", default: true },
            { label: "PNG", value: "image/png" },
            { label: "JPEG", value: "image/jpeg" }
        ]
    },
    smoothing: {
        type: OptionType.SELECT,
        description: "Image Smoothing",
        options: [
            { label: "Auto", value: "auto", default: true },
            { label: "Off", value: "off" },
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" }
        ]
    }
});

export default definePlugin({
    name: "EditImageUploads",
    description: "Adds an option to edit images before sending. Ported from Naru-kami's EditImageUploads.",
    authors: [
        { name: "Narukami", id: 0n } // Original BD plugin author
    ],
    settings,

    start() {
        // Enforce discovery of internal Discord modules for the components to use
        const { Webpack } = Vencord;

        // Find stores
        Components.internals.SelectedChannelStore = Webpack.findStore("SelectedChannelStore");

        // Find Action Bar styles
        const actionStyles = Webpack.findByProps("actionBarIcon");
        if (actionStyles) Components.internals.actionIconClass = actionStyles;

        const buttonStyles = Webpack.findByProps("actionButton", "button");
        if (buttonStyles) Components.internals.actionButtonClass = buttonStyles;

        // Find Modal components
        const ModalSystem = Webpack.findByProps("ModalRoot", "ModalHeader");
        if (ModalSystem) {
            Components.internals.ModalSystem = ModalSystem;
            Object.assign(Components.internals.keys, {
                ModalRoot: (Webpack.filters.byProps("ModalRoot")(ModalSystem) ? "ModalRoot" : Object.keys(ModalSystem).find(k => ModalSystem[k]?.displayName === "ModalRoot")) as string,
                ModalHeader: "ModalHeader",
                ModalContent: "ModalContent",
                ModalFooter: "ModalFooter"
            });
        }

        // Find native UI components
        Components.internals.nativeUI = Webpack.findByProps("openModal", "closeModal") || {};
        Components.internals.keys.openModal = "openModal";
        Components.internals.keys.closeModal = "closeModal";
        Components.internals.keys.FocusRing = "FocusRing";

        // Find Upload Dispatcher (Crucial for saving edits)
        // DEBUG: Log module 572855 source to fix patch
        try {
            const rawMod = (Webpack as any).modules?.["572855"] || (Webpack as any).m?.["572855"];
            console.log("EditImageUploads - Modül 572855 Kaynak Kod:", rawMod?.toString() || "Modül bulunamadı");
        } catch (e) {
            console.error("EditImageUploads - Log hatası:", e);
        }

        const UploadDispatcher = Webpack.findByProps("dispatch", "enqueue");
    },

    patches: [
        {
            find: ".attachmentItemSmall",
            replacement: {
                match: /actions:\(0,\i\.jsxs\)\(\i\.Fragment,{children:\[/g,
                replace: "$&$self.Components.injectUploadButton(arguments[0]),"
            }
        },
        {
            find: 'children:["IMAGE"===',
            replacement: {
                match: /(type:"IMAGE"[^]+?)(?=return )/,
                replace: "$1return $self.Components.injectRemixButton(arguments[0], $self.hooks, $self.utils);"
            }
        }
    ],

    Components,
    hooks,
    utils
});
