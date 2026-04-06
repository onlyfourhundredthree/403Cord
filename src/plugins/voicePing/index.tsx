/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React, RTCConnectionStore, SelectedChannelStore, useStateFromStores } from "@webpack/common";

function VoicePing({ channelId }: { channelId: string; }) {
    const ping = useStateFromStores([RTCConnectionStore, SelectedChannelStore], () => {
        if (SelectedChannelStore.getVoiceChannelId() !== channelId) return null;
        return RTCConnectionStore.getAveragePing();
    });

    if (ping == null || ping <= 0) return null;

    return (
        <span
            className="vc-voice-ping"
            style={{
                color: "var(--text-feedback-positive)",
                fontSize: "12px",
                fontWeight: "400",
                display: "inline-flex",
                alignItems: "center",
                marginLeft: "10px",
                fontFamily: "var(--font-code)",
                alignSelf: "center",
                cursor: "default",
                verticalAlign: "middle"
            }}
        >
            {Math.round(ping)}ms
        </span>
    );
}

export default definePlugin({
    name: "Ses Pingim",
    description: "Bulunduğunuz ses kanalında anlık ortalama ping değerini kanal isminin yanında gösterir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            // peak working module version (from v403.044.044.044.044)
            find: "VoiceChannel.renderPopout: There must always be something to render",
            replacement: [
                {
                    match: /this\.renderEditButton\(\)/,
                    replace: "$&, $self.VoicePing({channelId:this.props.channel.id})"
                }
            ]
        }
    ],

    VoicePing
});
