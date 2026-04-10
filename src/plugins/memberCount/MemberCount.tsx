/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getCurrentChannel } from "@utils/discord";
import { isObjectEmpty } from "@utils/misc";
import { ChannelStore, GuildMemberCountStore, PermissionsBits, PermissionStore, SelectedChannelStore, Tooltip, useEffect, useMemo, useStateFromStores, VoiceStateStore } from "@webpack/common";

import { ChannelMemberStore, cl, numberFormat, settings, ThreadMemberListStore } from ".";
import { CircleIcon } from "./CircleIcon";
import { OnlineMemberCountStore } from "./OnlineMemberCountStore";
import { VoiceIcon } from "./VoiceIcon";

export function MemberCount({ isTooltip, tooltipGuildId }: { isTooltip?: true; tooltipGuildId?: string; }) {
    const { voiceActivity } = settings.use(["voiceActivity"]);
    const includeVoice = voiceActivity && !isTooltip;

    const currentChannel = useStateFromStores([SelectedChannelStore], () => getCurrentChannel());
    const guildId = isTooltip ? tooltipGuildId! : currentChannel?.guild_id;

    const voiceActivityCount = useStateFromStores(
        [VoiceStateStore],
        () => {
            if (!includeVoice) return 0;

            const voiceStates = VoiceStateStore.getVoiceStates(guildId);
            if (!voiceStates) return 0;

            return Object.values(voiceStates)
                .filter(({ channelId }) => {
                    if (!channelId) return false;
                    const channel = ChannelStore.getChannel(channelId);
                    return channel && PermissionStore.can(PermissionsBits.VIEW_CHANNEL, channel);
                })
                .length;
        },
        [guildId, includeVoice]
    );

    const totalCount = useStateFromStores(
        [GuildMemberCountStore],
        () => GuildMemberCountStore.getMemberCount(guildId!),
        [guildId]
    );

    const { groups } = useStateFromStores(
        [ChannelMemberStore],
        () => ChannelMemberStore.getProps(guildId, currentChannel?.id),
        [guildId, currentChannel?.id]
    );

    const threadGroups = useStateFromStores(
        [ThreadMemberListStore],
        () => ThreadMemberListStore.getMemberListSections(currentChannel?.id),
        [currentChannel?.id]
    );

    const onlineCountFromStore = useStateFromStores(
        [OnlineMemberCountStore],
        () => OnlineMemberCountStore.getCount(guildId),
        [guildId]
    );

    const onlineCount = useMemo(() => {
        let count = onlineCountFromStore;

        if (!isTooltip && groups?.length >= 1 && groups[0].id !== "unknown") {
            count = groups.reduce((total, curr) => total + (curr.id === "offline" ? 0 : curr.count ?? 0), 0);
        }

        if (!isTooltip && threadGroups && !isObjectEmpty(threadGroups)) {
            count = Object.values(threadGroups).reduce((total, curr: any) => total + (curr.sectionId === "offline" ? 0 : curr.userIds?.length ?? 0), 0);
        }

        return count;
    }, [isTooltip, groups, threadGroups, guildId, onlineCountFromStore]);

    useEffect(() => {
        if (!guildId) return;
        try {
            OnlineMemberCountStore.ensureCount(guildId);
        } catch { }
    }, [guildId]);

    const formattedVoiceCount = useMemo(() => numberFormat(voiceActivityCount ?? 0), [voiceActivityCount]);
    const formattedOnlineCount = useMemo(() => onlineCount != null ? numberFormat(onlineCount) : "?", [onlineCount]);

    if (totalCount == null)
        return null;

    return (
        <div className={cl("widget", { tooltip: isTooltip, "member-list": !isTooltip })}>
            <Tooltip text={`Bu kanalda ${formattedOnlineCount} çevrimiçi üye var.`} position="bottom">
                {props => (
                    <div {...props} className={cl("container")}>
                        <CircleIcon className={cl("online-count")} />
                        <span className={cl("online")}>{formattedOnlineCount}</span>
                    </div>
                )}
            </Tooltip>
            <Tooltip text={`Bu sunucuda ${numberFormat(totalCount)} üye var.`} position="bottom">
                {props => (
                    <div {...props} className={cl("container")}>
                        <CircleIcon className={cl("total-count")} />
                        <span className={cl("total")}>{numberFormat(totalCount)}</span>
                    </div>
                )}
            </Tooltip>
            {includeVoice && voiceActivityCount > 0 &&
                <Tooltip text={`${formattedVoiceCount} üye sesli kanallarda`} position="bottom">
                    {props => (
                        <div {...props} className={cl("container")}>
                            <VoiceIcon className={cl("voice-icon")} />
                            <span className={cl("voice")}>{formattedVoiceCount}</span>
                        </div>
                    )}
                </Tooltip>
            }
        </div>
    );
}
