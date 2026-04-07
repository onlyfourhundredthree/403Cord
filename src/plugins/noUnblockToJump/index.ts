/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoUnblockToJump",
    description: "Allows you to jump to messages of blocked or ignored users and likely spammers without unblocking them",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "#{intl::UNIGNORE_TO_JUMP_BODY}",
            replacement: {
                match: /if\(\i\.\i\.isBlockedForMessage\(/,
                replace: "return true;$&"
            }
        }
    ]
});
