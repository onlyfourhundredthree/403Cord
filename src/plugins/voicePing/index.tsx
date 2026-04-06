/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const [ping, setPing] = React.useState<number | null>(null);

    React.useEffect(() => {
        const update = () => {
            if (SelectedChannelStore.getVoiceChannelId() === channelId) {
                setPing(RTCConnectionStore.getAveragePing());
            } else if (ping !== null) {
                setPing(null);
            }
        };

        update();
        const interval = setInterval(update, 2500);
        return () => clearInterval(interval);
    }, [channelId, ping]);

    if (ping == null || ping <= 0) return null;

    return (
        <div
            className="vc-voice-ping"
            style={{
                color: "var(--text-positive)",
                fontSize: "11px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                marginRight: "4px",
                fontFamily: "var(--font-code)",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                padding: "0 4px",
                borderRadius: "4px",
                height: "16px",
                lineHeight: "16px",
                alignSelf: "center"
            }}
        >
            {Math.round(ping)}ms
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
            replacement: {
                // Patch into the Children.count check which is where status icons are rendered.
                // Placing our component BEFORE the match ensures it appears to the left of other icons.
                match: /\.Children\.count.{0,10}?:null(?<=,channel:(\i).+?)/,
                replace: (m, channel) => `$self.VoicePing({channelId:${channel}.id}),${m}`
            }
        }
    ],

    VoicePing
});
