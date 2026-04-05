/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import definePlugin from "@utils/types";

export default definePlugin({
    name: "PlainFolderIcon",
    description: "Dont show the small guild icons in folders",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            find: "#{intl::GUILD_FOLDER_TOOLTIP_A11Y_LABEL}",
            replacement: [
                {
                    // Discord always renders both plain and guild icons folders and uses a css transtion to switch between them
                    match: /\.slice\(0,4\).+?\]:(\i),\[\i\.\i\]:!\1/,
                    replace: (m, hasFolderButtonContent) => `${m},"vc-plainFolderIcon-plain":!${hasFolderButtonContent}`
                }

            ]
        }
    ]
});
