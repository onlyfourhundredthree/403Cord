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
                const val = rtcStore?.getAveragePing?.() ?? null;

                if (typeof val === "number" && !isNaN(val) && val >= 0) {
                    setPing(val);
                }
            } catch (e) {
                console.error("[VoicePing] Failed to get ping:", e);
            }
        };

        update();
        intervalManager.setInterval("voicePing", update, 2000);

        return () => { intervalManager.clearInterval("voicePing"); };
    }, [inChannel, channelId, isVisible]);

    if (!inChannel) return null;

    return (
        <span style={{
            color: "var(--text-positive)",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-code)",
            marginLeft: "4px"
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
            find: "One of participant or participants",
            replacement: [
                {
                    match: /\{children:t,participants:n,channel:a,onPopoutClosed/,
                    replace: "{children:[$self.VoicePing({channelId:a.id}),t],participants:n,channel:a,onPopoutClosed"
                }
            ]
        }
    ],

    VoicePing
});
