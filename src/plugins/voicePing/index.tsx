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
    const [isVisible, setIsVisible] = React.useState(!document.hidden);

    const currentVoiceChannelId = useStateFromStores(
        [SelectedChannelStore],
        () => SelectedChannelStore.getVoiceChannelId(),
        []
    );

    const inChannel = currentVoiceChannelId === channelId;

    React.useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    React.useEffect(() => {
        if (!inChannel || !isVisible) return;

        const update = () => {
            try {
                const rtcStore = RTCConnectionStore as any;
                const val = rtcStore?.getAveragePing?.() ?? rtcStore?.getRTT?.() ?? null;

                if (typeof val === "number" && !isNaN(val) && val >= 0) {
                    setPing(val);
                }
            } catch (e) {
                console.error("[VoicePing] Failed to get ping:", e);
            }
        };

        update();
        intervalManager.setInterval("voicePing", update, 2000);

        return () => { intervalManager.clearInterval("voicePing");
        };
    }, [inChannel, channelId, isVisible]);

    if (!inChannel) return null;

    return (
        <div
            className="vc-voice-ping"
            style={{
                color: "var(--text-positive)",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                marginRight: "6px",
                fontFamily: "var(--font-code)",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                padding: "0 4px",
                borderRadius: "4px",
                height: "16px",
                lineHeight: "16px",
                alignSelf: "center"
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
            find: "VoiceChannel.renderPopout: There must always be something to render",
            replacement: [
                {
                    match: /this\.renderEditButton\(\)/,
                    replace: "$self.renderVoicePing(this.props.channel.id, this.renderEditButton())"
                }
            ]
        }
    ],

    renderVoicePing(channelId: string, rendered: any) {
        return [
            rendered,
            <VoicePing key="voice-ping" channelId={channelId} />
        ];
    },
});
