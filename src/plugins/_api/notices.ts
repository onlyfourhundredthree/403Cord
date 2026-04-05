/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoticesAPI",
    description: "Fixes notices being automatically dismissed",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    required: true,
    patches: [
        {
            find: '"NoticeStore"',
            replacement: [
                {
                    match: /(?<=!1;)\i=null;(?=.{0,80}getPremiumSubscription\(\))/g,
                    replace: "if(Vencord.Api.Notices.currentNotice)return false;$&"
                },
                {
                    match: /(?<=,NOTICE_DISMISS:function\(\i\){)return null!=(\i)/,
                    replace: (m, notice) => `if(${notice}?.id=="VencordNotice")return(${notice}=null,Vencord.Api.Notices.nextNotice(),true);${m}`
                },
                // FIXME(Bundler agressive inline): Remove the non used compability once enough time has passed
                {
                    match: /(?<=function (\i)\(\i\){)return null!=(\i)(?=.+?NOTICE_DISMISS:\1)/,
                    replace: (m, _, notice) => `if(${notice}?.id=="VencordNotice")return(${notice}=null,Vencord.Api.Notices.nextNotice(),true);${m}`,
                    noWarn: true
                }
            ]
        }
    ],
});
