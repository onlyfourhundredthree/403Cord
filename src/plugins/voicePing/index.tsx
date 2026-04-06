/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const [ping, setPing] = React.useState<number | null>(null);
    const [inChannel, setInChannel] = React.useState(false);

    React.useEffect(() => {
        const update = () => {
            const currentId = SelectedChannelStore.getVoiceChannelId();
            const isIn = currentId === channelId;
            setInChannel(isIn);
            if (isIn) {
                const val = (RTCConnectionStore as any).getAveragePing?.() ?? (RTCConnectionStore as any).getRTT?.() ?? 0;
                if (typeof val === "number" && val > 0) setPing(Math.round(val));
            }
        };

        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [channelId]);

    if (!inChannel) return null;

    return (
        <span
            className="vc-voice-ping"
            style={{
                color: "var(--text-feedback-positive)",
                fontSize: "12px",
                fontWeight: "400",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "8px",
                fontFamily: "var(--font-code)",
                alignSelf: "center",
                cursor: "default",
                verticalAlign: "middle"
            }}
        >
            {ping !== null ? `${ping}ms` : "---ms"}
        </span>
    );
}

export default definePlugin({
    name: "Ses Pingim",
    description: "Bulunduğunuz ses kanalında anlık ortalama ping değerini kanal isminin yanında gösterir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            // UNREAD_IMPORTANT is the most stable module for channel items
            find: "UNREAD_IMPORTANT:",
            replacement: [
                {
                    // Safely inject the ping component into the children array of the main component.
                    // We use the Children.count anchor which is where status icons are rendered.
                    // We use (a, b) comma syntax or direct insertion to be safe.
                    match: /\.Children\.count.{0,10}?:null(?<=,channel:(\i).+?)/,
                    replace: (m, channel) => `${m}, $self.VoicePing({channelId:${channel}.id})`
                }
            ]
        }
    ],

    VoicePing
});
