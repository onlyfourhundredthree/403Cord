/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoF1",
    description: "Disables F1 help bind.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: ',"f1"],comboKeysBindGlobal:',
            replacement: {
                match: ',"f1"],comboKeysBindGlobal:',
                replace: "],comboKeysBindGlobal:",
            },
        },
    ],
});
