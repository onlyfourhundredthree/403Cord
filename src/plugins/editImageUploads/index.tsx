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
        const { Webpack } = Vencord;

        // Find stores
        Components.internals.SelectedChannelStore = Webpack.findStore("SelectedChannelStore");

        // Find Action Bar styles
        Components.internals.actionIconClass = Webpack.findByProps("actionBarIcon") || {};
        Components.internals.actionButtonClass = Webpack.findByProps("actionButton", "button") || {};

        // Find Modal components DYNAMICALLY by displayName
        const ModalMod = Webpack.find(m => m.default?.ModalRoot)?.default || Webpack.find(m => m.ModalRoot);
        if (ModalMod) {
            Components.internals.ModalSystem = ModalMod;
            const findKey = (name: string) => Object.keys(ModalMod).find(k => ModalMod[k]?.displayName === name || ModalMod[k]?.type?.displayName === name);

            Object.assign(Components.internals.keys, {
                ModalRoot: findKey("ModalRoot") || "ModalRoot",
                ModalHeader: findKey("ModalHeader") || "ModalHeader",
                ModalContent: findKey("ModalContent") || "ModalContent",
                ModalFooter: findKey("ModalFooter") || "ModalFooter"
            });
        }

        // Find native UI components
        const UI = Webpack.findByProps("openModal", "closeModal") || {};
        Components.internals.nativeUI = UI;
        Components.internals.keys.openModal = "openModal";
        Components.internals.keys.closeModal = "closeModal";
        Components.internals.keys.FocusRing = "FocusRing";

        // Find Upload Dispatcher
        Components.internals.uploadDispatcher = Webpack.findByProps("addFile", "setFile");

        // Use findByCode to ensure we found the right modules for patching
        const uploadMod = Webpack.findByCode(".attachmentItemSmall");
        const mediaMod = Webpack.findByCode("GlobalDiscoveryAppsDetailCarousel");

        if (uploadMod) console.log("EditImageUploads: Upload Card Hooked.");
        if (mediaMod) console.log("EditImageUploads: Media Viewer Hooked.");
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
            // Media Viewer Module - Targeting the items mapping
            find: "GlobalDiscoveryAppsDetailCarousel",
            replacement: {
                match: /type:"IMAGE"/g,
                replace: "$&,editImageUploads:true"
            }
        },
        {
            // Media Viewer Module - Alternative hook in the useCallback
            find: "GlobalDiscoveryAppsDetailCarousel",
            replacement: {
                match: /if\(e\.type===\i\.geh\.IMG\){let \i=a\.filter/g,
                replace: "if(e.type===$self.utils.dummyLine,true){$self.logger.log('Media hook triggered');} $&"
            }
        }
    ],

    Components,
    hooks,
    utils
});
