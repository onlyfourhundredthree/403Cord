/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoTypingAnimation",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    description: "Disables the CPU-intensive typing dots animation",
    patches: [
        {
            find: "dotCycle",
            replacement: {
                match: /focused:(\i)/g,
                replace: (_, focused) => `_focused:${focused}=false`
            }
        }
    ]
});
