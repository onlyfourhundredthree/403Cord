/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "UserSettingsAPI",
    description: "Patches Discord's UserSettings to expose their group and name.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            find: ",updateSetting:",
            replacement: [
                // Main setting definition
                {
                    match: /\.updateAsync\(.+?(?=,useSetting:)/,
                    replace: "$&,userSettingsAPIGroup:arguments[0],userSettingsAPIName:arguments[1]"
                },
                // Selective wrapper
                {
                    match: /updateSetting:.{0,100}SELECTIVELY_SYNCED_USER_SETTINGS_UPDATE/,
                    replace: "userSettingsAPIGroup:arguments[0].userSettingsAPIGroup,userSettingsAPIName:arguments[0].userSettingsAPIName,$&"
                },
                // Override wrapper
                {
                    match: /updateSetting:.{0,60}USER_SETTINGS_OVERRIDE_CLEAR/,
                    replace: "userSettingsAPIGroup:arguments[0].userSettingsAPIGroup,userSettingsAPIName:arguments[0].userSettingsAPIName,$&"
                }

            ]
        }
    ]
});
