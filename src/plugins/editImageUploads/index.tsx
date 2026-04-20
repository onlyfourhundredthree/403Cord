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
        // Plugin is starting!
    },

    stop() {
        // Plugin is stopped!
    },

    patches: [
        {
            find: ".attachmentItemSmall",
            replacement: {
                match: /(?<=return )(\i\.jsx\(\i,{)(\n?.+?)(?=upload:)/s,
                replace: "$1...$self.Components.injectUploadButton(arguments[0]),$2"
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
