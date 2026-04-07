/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IntervalManager } from "@utils/IntervalManager";
import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore, useStateFromStores } from "@webpack/common";

const intervalManager = new IntervalManager();

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
        intervalManager.setInterval("voicePing", update, 2000);

        return () => {
            intervalManager.clearInterval("voicePing");
        };
    }, [inChannel]);

    if (!inChannel) return null;

    return (
        <span style={{
            color: "#57F287",
            fontSize: "11px",
            fontWeight: "700",
            marginLeft: "8px",
            fontFamily: "var(--font-code)"
        }}>
            {ping !== null && ping > 0 ? Math.round(ping) : "---"}ms
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
            replacement: [
                {
                    match: /\.Children\.count.+?:null(?<=,channel:(\i).+?)/,
                    replace: (m, channel) => `${m},$self.VoicePing({channelId:${channel}.id})`
                }
            ]
        }
    ],

    VoicePing
});
