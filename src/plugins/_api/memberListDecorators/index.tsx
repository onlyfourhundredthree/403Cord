/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

import managedStyle from "./style.css?managed";

export default definePlugin({
    name: "MemberListDecoratorsAPI",
    description: "API to add decorators to member list (both in servers and DMs)",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    managedStyle,

    patches: [
        {
            find: "#{intl::GUILD_OWNER}),children:",
            replacement: [
                {
                    match: /children:\[(?=.{0,300},lostPermissionTooltipText:)/,
                    replace: "children:[Vencord.Api.MemberListDecorators.__getDecorators(arguments[0],'guild'),"
                }
            ]
        },
        {
            find: "PrivateChannel.renderAvatar",
            replacement: {
                match: /decorators:(\i\.isSystemDM\(\)\?.+?:null)/,
                replace: "decorators:[Vencord.Api.MemberListDecorators.__getDecorators(arguments[0],'dm'),$1]"
            }
        }
    ]
});
