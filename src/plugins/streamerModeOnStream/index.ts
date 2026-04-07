/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

interface StreamEvent {
    streamKey: string;
}

function toggleStreamerMode({ streamKey }: StreamEvent, value: boolean) {
    if (!streamKey.endsWith(UserStore.getCurrentUser().id)) return;

    FluxDispatcher.dispatch({
        type: "STREAMER_MODE_UPDATE",
        key: "enabled",
        value
    });
}

export default definePlugin({
    name: "StreamerModeOnStream",
    description: "Automatically enables streamer mode when you start streaming in Discord",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    flux: {
        STREAM_CREATE: d => toggleStreamerMode(d, true),
        STREAM_DELETE: d => toggleStreamerMode(d, false)
    }
});
