/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore, useStateFromStores } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const ping = useStateFromStores([RTCConnectionStore, SelectedChannelStore], () => {
        if (SelectedChannelStore.getVoiceChannelId() !== channelId) return null;
        return RTCConnectionStore.getAveragePing();
    });

    if (ping == null || ping <= 0) return null;

    return (
        <span style={{
            color: "var(--text-positive)",
            fontSize: "11px",
            marginLeft: "6px",
            marginRight: "4px",
            fontFamily: "var(--font-code)",
            fontWeight: "700",
            backgroundColor: "rgba(0, 0, 0, 0.15)",
            padding: "1px 4px",
            borderRadius: "4px",
            verticalAlign: "middle",
            display: "inline-flex",
            alignItems: "center",
            height: "16px",
            lineHeight: "1"
        }}>
            {Math.round(ping)}ms
        </span>
    );
}

export default definePlugin({
    name: "Ses Pingim",
    description: "Bulunduğunuz ses kanalında anlık ortalama ping değerini kanal isminin yanında gösterir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            find: "UNREAD_IMPORTANT:",
            replacement: {
                // Match the end of the destructuring block where channel and name are extracted
                // and inject our name modification right after the statement finishes.
                match: /({channel:(\i),name:(\i).+?;)/,
                replace: "$1 $3=$self.patchName($3, $2);"
            }
        }
    ],

    patchName(name: any, channel: any) {
        // Only for voice and stage channels
        if (channel.type !== 2 && channel.type !== 13) return name;

        return (
            <React.Fragment>
                <VoicePing channelId={channel.id} />
                <span className="vc-voice-ping-name-wrapper" style={{ display: "inline" }}>
                    {name}
                </span>
            </React.Fragment>
        );
    },

    VoicePing
});
