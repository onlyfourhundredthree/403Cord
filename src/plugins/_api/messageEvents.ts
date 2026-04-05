/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "MessageEventsAPI",
    description: "Api required by anything using message events.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "#{intl::EDIT_TEXTAREA_HELP}",
            replacement: {
                match: /(?<=,channel:\i\}\)\.then\().+?(?=\i\.content!==this\.props\.message\.content&&\i\((.+?)\)\})/,
                replace: (match, args) => "" +
                    `async ${match}` +
                    `if(await 403Cord.Api.MessageEvents._handlePreEdit(${args}))` +
                    "return Promise.resolve({shouldClear:false,shouldRefocus:true});"
            }
        },
        {
            find: ".handleSendMessage,onResize:",
            replacement: {
                // https://regex101.com/r/7iswuk/1
                match: /let (\i)=\i\.\i\.parse\((\i),.+?\.getSendMessageOptions\(\{.+?\}\)?;(?=.+?(\i)\.flags=)(?<=\)\(({.+?})\)\.then.+?)/,
                replace: (m, parsedMessage, channel, replyOptions, extra) => m +
                    `if(await 403Cord.Api.MessageEvents._handlePreSend(${channel}.id,${parsedMessage},${extra},${replyOptions}))` +
                    "return{shouldClear:false,shouldRefocus:true};"
            }
        },
        {
            find: '("interactionUsernameProfile',
            replacement: {
                match: /let\{id:\i}=(\i),{id:\i}=(\i);return \i\.useCallback\((\i)=>\{/,
                replace: (m, message, channel, event) =>
                    `const vcMsg=${message},vcChan=${channel};${m}Vencord.Api.MessageEvents._handleClick(vcMsg,vcChan,${event});`
            }
        }
    ]
});
