/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore, useStateFromStores } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const [ping, setPing] = React.useState<number | null>(null);
    const currentVoiceChannelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getVoiceChannelId());

    const inChannel = currentVoiceChannelId === channelId;

    React.useEffect(() => {
        if (!inChannel) return;

        const update = () => {
            const val = RTCConnectionStore.getAveragePing();
            if (typeof val === "number") setPing(val);
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
                marginRight: "6px",
                fontFamily: "var(--font-code)",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                padding: "0 4px",
                borderRadius: "4px",
                height: "16px",
                lineHeight: "16px",
                alignSelf: "center",
                cursor: "default"
            }}
        >
            {ping && ping > 0 ? Math.round(ping) : "---"}ms
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
                // Find the children container for status icons (children__2ea32 in HTML)
                // and inject VoicePing as the first element of that array.
                match: /({channel:(\i).+?className:(\i)\.children,children:\[)/,
                replace: "$1 $self.VoicePing({channelId:$2.id}),"
            }
        }
    ],

    VoicePing
});
