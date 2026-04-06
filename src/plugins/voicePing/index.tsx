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
                setPing(typeof val === "number" && val > 0 ? val : null);
            }
        };

        update();
        const interval = setInterval(update, 2000);
        return () => clearInterval(interval);
    }, [channelId]);

    if (!inChannel) return null;

    return (
        <div
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
            {ping !== null ? Math.round(ping) : "---"}ms
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
                    // Inject a local variable for the ping during prop destructuring
                    match: /({channel:(\i),name:(\i).+?;)/,
                    replace: "$1 let $vcping=$self.VoicePing({channelId:$2.id});"
                },
                {
                    // Put the ping at the beginning of the status icons area
                    match: /\.Children\.count.+?:null(?<=,channel:\i.+?)/,
                    replace: "($vcping, $&)"
                }
            ]
        },
        {
            // Redundant patch for VoiceChannel component directly
            find: "VoiceChannel.renderPopout: There must always be something to render",
            replacement: [
                {
                    match: /className:(\i)\.children,children:\[/,
                    replace: "$&$self.VoicePing({channelId:this.props.channel.id}),"
                }
            ]
        }
    ],

    VoicePing
});
