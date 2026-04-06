/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getCurrentChannel } from "@utils/discord";
import { UserProfileStore, useStateFromStores, React } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

import { PronounsFormat, settings } from "./settings";

const ProfileFetcher = findByPropsLazy("fetchProfile");
const fetchedProfiles = new Set<string>();
const fetchQueue: { id: string; guildId: string | undefined; }[] = [];
let fetchTimer: NodeJS.Timeout | null = null;

function queueFetchProfile(id: string, guildId: string | undefined) {
    if (fetchedProfiles.has(id)) return;
    fetchedProfiles.add(id);
    fetchQueue.push({ id, guildId });

    if (!fetchTimer) {
        fetchTimer = setInterval(() => {
            const next = fetchQueue.shift();
            if (!next) {
                clearInterval(fetchTimer!);
                fetchTimer = null;
                return;
            }
            if (ProfileFetcher?.fetchProfile) {
                ProfileFetcher.fetchProfile(next.id, { guildId: next.guildId }).catch(() => { });
            }
        }, 250); // Saniyede maksimum 4 profil degeri (Discord Rate-Limit asmamak icin guvenli 250ms)
    }
}

function useDiscordPronouns(id: string, useGlobalProfile: boolean = false): string | undefined {
    const guildId = getCurrentChannel()?.getGuildId();

    React.useEffect(() => {
        queueFetchProfile(id, guildId);
    }, [id, guildId]);

    const globalPronouns: string | undefined = useStateFromStores([UserProfileStore], () => UserProfileStore.getUserProfile(id)?.pronouns);
    const guildPronouns: string | undefined = useStateFromStores([UserProfileStore], () => UserProfileStore.getGuildMemberProfile(id, guildId)?.pronouns);

    if (useGlobalProfile) return globalPronouns;
    return guildPronouns || globalPronouns;
}

export function useFormattedPronouns(id: string, useGlobalProfile: boolean = false) {
    const pronouns = useDiscordPronouns(id, useGlobalProfile)?.trim().replace(/\n+/g, "");
    return settings.store.pronounsFormat === PronounsFormat.Lowercase ? pronouns?.toLowerCase() : pronouns;
}
