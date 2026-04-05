/*
 * 403Cord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "BetterGifPicker",
    description: "Makes the gif picker open the favourite category by default",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "renderHeaderContent(){",
            replacement: [
                {
                    match: /(?<=state={resultType:)null/,
                    replace: '"Favorites"'
                }
            ]
        }
    ]
});
