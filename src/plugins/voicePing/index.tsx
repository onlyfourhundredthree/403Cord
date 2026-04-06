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
    authors: [{ name: "antigravity", id: 0n }],

    patches: [
        {
            find: "UNREAD_IMPORTANT:",
            replacement: {
                // Patch into the Children.count check which is where status icons are rendered
                match: /\.Children\.count.{0,10}?:null(?<=,channel:(\i).+?)/,
                replace: (m, channel) => `${m},$self.VoicePing({channelId:${channel}.id})`
            }
        }
    ],

    patchName(name: any, channel: any) {
        // Only for voice and stage channels
        if (channel.type !== 2 && channel.type !== 13) return name;

        return (
            <React.Fragment>
                <VoicePing channelId={channel.id} />
                {name}
            </React.Fragment>
        );
    },

    VoicePing
});
