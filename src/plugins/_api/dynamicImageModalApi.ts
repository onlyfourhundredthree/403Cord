/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";


export default definePlugin({
    name: "DynamicImageModalAPI",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    description: "Allows you to omit either width or height when opening an image modal",
    patches: [
        {
            // TODO: bundler compat
            find: ".renderLinkComponent",
            replacement: {
                // widthAndHeightPassed = w != null && w !== 0 && h == null || h === 0
                match: /(?<=\i=)(null!=\i&&0!==\i)&&(null!=\i&&0!==\i)/,
                replace: "($1)||($2)"
            }
        }
    ]
});
