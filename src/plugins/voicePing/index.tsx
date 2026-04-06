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
                setPing(val > 0 ? val : null);
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
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "10px",
                fontFamily: "var(--font-code)",
                alignSelf: "center",
                cursor: "default",
                verticalAlign: "middle"
            }}
        >
            {ping !== null ? Math.round(ping) : "---"}ms
        </span>
    );
}

export default definePlugin({
    name: "Ses Pingim",
    description: "Bulunduğunuz ses kanalında anlık ortalama ping değerini kanal isminin yanında gösterir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            // Find the Voice Channel component in the sidebar using a very specific handler name
            find: ".handleVoiceStatusClick",
            replacement: [
                {
                    // Target the beginning of the status icons array (children__2ea32)
                    match: /className:\i\.children,children:\[/,
                    replace: "$&$self.VoicePing({channelId:this.props.channel.id}),"
                }
            ]
        }
    ],

    VoicePing
});
