/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoSystemBadge",
    description: "Disables the taskbar and system tray unread count badge.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: ",setSystemTrayApplications",
            replacement: [
                {
                    match: /setBadge\(\i\).+?},/,
                    replace: "setBadge(){},"
                },
                {
                    match: /setSystemTrayIcon\(\i\).+?},/,
                    replace: "setSystemTrayIcon(){},"
                }
            ]
        }
    ]
});
