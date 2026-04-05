/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "ServerListAPI",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    description: "Api required for plugins that modify the server list",
    patches: [
        {
            find: "#{intl::DISCODO_DISABLED}",
            replacement: {
                match: /(?<=#{intl::DISCODO_DISABLED}.+?return)(\(.{0,150}?tutorialId:"friends-list".+?}\))(?=}function)/,
                replace: "[$1].concat(Vencord.Api.ServerList.renderAll(Vencord.Api.ServerList.ServerListRenderPosition.Above))"
            }
        },
        {
            find: ".setGuildsTree(",
            replacement: {
                match: /(?<=#{intl::SERVERS}\),gap:"xs",children:)\i\.map\(.{0,50}\.length\)/,
                replace: "Vencord.Api.ServerList.renderAll(Vencord.Api.ServerList.ServerListRenderPosition.In).concat($&)"
            }
        }
    ]
});
