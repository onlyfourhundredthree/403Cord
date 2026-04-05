/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "MessageAccessoriesAPI",
    description: "API to add message accessories.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "#{intl::REMOVE_ATTACHMENT_BODY}",
            replacement: {
                match: /children:(\[[^\]]{0,100}?this.renderSuppressConfirmModal[^\]]{0,100}?\])/,
                replace: "children:Vencord.Api.MessageAccessories._modifyAccessories($1,this.props)",
            },
        },
    ],
});
