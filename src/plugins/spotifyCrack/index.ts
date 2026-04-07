/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    noSpotifyAutoPause: {
        description: "Disable Spotify auto-pause",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true
    },
    keepSpotifyActivityOnIdle: {
        description: "Keep Spotify activity playing when idling",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "SpotifyCrack",
    description: "Free listen along, no auto-pausing in voice chat, and allows activity to continue playing when idling",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    patches: [
        {
            find: '.dispatch({type:"SPOTIFY_PROFILE_UPDATE"',
            replacement: {
                predicate: () => Settings.plugins.SpotifyControls?.enabled,
                match: /SPOTIFY_PROFILE_UPDATE.+?isPremium:(?="premium"===(\i)\.body\.product)/,
                replace: (m, req) => `${m}(${req}.body.product="premium")&&`
            },
        },
        {
            find: "}getPlayableComputerDevices(){",
            replacement: [
                {
                    predicate: () => settings.store.noSpotifyAutoPause,
                    match: /(?<=function \i\(\){)(?=.{0,200}SPOTIFY_AUTO_PAUSED\))/,
                    replace: "return;"
                },
                {
                    predicate: () => settings.store.keepSpotifyActivityOnIdle,
                    match: /(shouldShowActivity\(\){.{0,50})&&!\i\.\i\.isIdle\(\)/,
                    replace: "$1"
                }
            ]
        }
    ]
});
