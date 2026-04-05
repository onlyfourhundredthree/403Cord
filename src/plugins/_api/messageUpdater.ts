/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "MessageUpdaterAPI",
    description: "API for updating and re-rendering messages.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            // Message accessories have a custom logic to decide if they should render again, so we need to make it not ignore changed message reference
            find: "}renderStickersAccessories(",
            replacement: {
                match: /(?<=this.props,\i,\[)"message",/,
                replace: ""
            }
        }
    ]
});
