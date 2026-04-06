/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore, useStateFromStores } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const [ping, setPing] = React.useState<number | null>(null);
    const inChannel = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getVoiceChannelId() === channelId);

    React.useEffect(() => {
        if (!inChannel) return;

        const update = () => {
            const val = RTCConnectionStore.getAveragePing();
            setPing(typeof val === "number" ? val : null);
        };

        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [inChannel, channelId]);

    if (!inChannel) return null;

    return (
        <div
            className="vc-voice-ping"
            style={{
                color: "var(--text-positive)",
                fontSize: "11px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "8px",
                fontFamily: "var(--font-code)",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                padding: "1px 6px",
                borderRadius: "4px",
                height: "18px",
                lineHeight: "18px",
                alignSelf: "center",
                cursor: "default"
            }}
        >
            {ping !== null && ping > 0 ? Math.round(ping) : "---"}ms
        </div>
    );
}

export default definePlugin({
    name: "Ses Pingim",
    description: "Bulunduğunuz ses kanalında anlık ortalama ping değerini kanal isminin yanında gösterir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            find: "UNREAD_IMPORTANT:",
            replacement: [
                {
                    // Match the Children.count anchor and append our ping after it (at the far right of icons)
                    match: /\.Children\.count.+?:null(?<=,channel:(\i).+?)/,
                    replace: (m, channel) => `${m},$self.VoicePing({channelId:${channel}.id})`
                }
            ]
        }
    ],

    VoicePing
});
