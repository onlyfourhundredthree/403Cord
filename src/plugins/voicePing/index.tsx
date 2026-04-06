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
            const val = (RTCConnectionStore as any).getAveragePing?.() ?? (RTCConnectionStore as any).getRTT?.() ?? 0;
            if (val > 0) setPing(Math.round(val));
        };
        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [inChannel, channelId]);

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

    vcp: null as any,

    patches: [
        {
            find: "UNREAD_IMPORTANT:",
            replacement: [
                {
                    // Injection 1: Capture the channel and prepare the ping component
                    match: /({channel:(\i),name:(\i).+?;)/,
                    replace: "$1 $self.vcp = $self.VoicePing({channelId:$2.id});"
                },
                {
                    // Injection 2: Put the ping component into the status icons array.
                    // Using comma syntax inside the array [..., $self.vcp, original, ...]
                    match: /\.Children\.count.+?:null(?<=,channel:\i.+?)/,
                    replace: "$self.vcp, $&"
                }
            ]
        }
    ],

    VoicePing
});
