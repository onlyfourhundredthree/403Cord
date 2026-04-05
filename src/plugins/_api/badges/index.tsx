/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./fixDiscordBadgePadding.css";

import { _getBadges, BadgePosition, BadgeUserArgs, ProfileBadge } from "@api/Badges";
import ErrorBoundary from "@components/ErrorBoundary";
import { DONOR_ROLE_ID, VENCORD_GUILD_ID } from "@utils/constants";
import { copyWithToast } from "@utils/discord";
import { Logger } from "@utils/Logger";
import { shouldShowContributorBadge } from "@utils/misc";
import definePlugin from "@utils/types";
import { ContextMenuApi, GuildMemberStore, Menu, Toasts } from "@webpack/common";

const CONTRIBUTOR_BADGE = "https://cdn.discordapp.com/emojis/1357798511126777866.webp";

const ContributorBadge: ProfileBadge = {
    description: "403Cord Developer",
    iconSrc: CONTRIBUTOR_BADGE,
    position: BadgePosition.START,
    shouldShow: ({ userId }) => shouldShowContributorBadge(userId)
};

// Removed MemberBadges
let DonorBadges = {} as Record<string, Array<Record<"tooltip" | "badge", string>>>;

async function loadBadges(noCache = false) {
    const init = {} as RequestInit;
    if (noCache)
        init.cache = "no-cache";

    DonorBadges = await fetch(`https://raw.githubusercontent.com/onlyfourhundredthree/403CordBadges/refs/heads/main/403.json?t=${Date.now()}`, init)
        .then(r => r.json()).catch(() => ({}));

    // YENI UYELER (SPECIAL MEMBERS) artık sunucu rolünden kontrol ediliyor.
}

let intervalId: any;

function BadgeContextMenu({ badge }: { badge: ProfileBadge & BadgeUserArgs; }) {
    return (
        <Menu.Menu
            navId="vc-badge-context"
            onClose={ContextMenuApi.closeContextMenu}
            aria-label="Badge Options"
        >
            {badge.description && (
                <Menu.MenuItem
                    id="vc-badge-copy-name"
                    label="Copy Badge Name"
                    action={() => copyWithToast(badge.description!)}
                />
            )}
            {badge.iconSrc && (
                <Menu.MenuItem
                    id="vc-badge-copy-link"
                    label="Copy Badge Image Link"
                    action={() => copyWithToast(badge.iconSrc!)}
                />
            )}
        </Menu.Menu>
    );
}

export default definePlugin({
    name: "BadgeAPI",
    description: "API to add badges to users",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    required: true,
    patches: [
        {
            find: "#{intl::PROFILE_USER_BADGES}",
            replacement: [
                {
                    match: /alt:" ","aria-hidden":!0,src:.{0,50}(\i).iconSrc/,
                    replace: "...$1.props,$&"
                },
                {
                    match: /(?<=forceOpen:.{0,40}?ariaHidden:!0,)children:(?=.{0,50}?(\i)\.id)/,
                    replace: "children:$1.component?$self.renderBadgeComponent({...$1}) :"
                },
                // handle onClick and onContextMenu
                {
                    match: /href:(\i)\.link/,
                    replace: "...$self.getBadgeMouseEventHandlers($1),$&"
                }
            ]
        },
        {
            find: "getLegacyUsername(){",
            replacement: {
                match: /getBadges\(\)\{.{0,100}?return\[/,
                replace: "$&...$self.getBadges(this),"
            }
        }
    ],

    // for access from the console or other plugins
    get DonorBadges() {
        return DonorBadges;
    },

    toolboxActions: {
        async "Refetch Badges"() {
            await loadBadges(true);
            Toasts.show({
                id: Toasts.genId(),
                message: "Successfully refetched badges!",
                type: Toasts.Type.SUCCESS
            });
        }
    },

    userProfileBadge: ContributorBadge,

    async start() {
        await loadBadges();

        clearInterval(intervalId);
        intervalId = setInterval(loadBadges, 1000 * 60 * 30); // 30 minutes
    },

    async stop() {
        clearInterval(intervalId);
    },

    getBadges(profile: { userId: string; guildId: string; }) {
        if (!profile) return [];

        try {
            return _getBadges(profile);
        } catch (e) {
            new Logger("BadgeAPI#getBadges").error(e);
            return [];
        }
    },

    renderBadgeComponent: ErrorBoundary.wrap((badge: ProfileBadge & BadgeUserArgs) => {
        const Component = badge.component!;
        return <Component {...badge} />;
    }, { noop: true }),


    getBadgeMouseEventHandlers(badge: ProfileBadge & BadgeUserArgs) {
        const handlers = {} as Record<string, (e: React.MouseEvent) => void>;

        if (!badge) return handlers; // sanity check

        const { onClick, onContextMenu } = badge;

        if (onClick) handlers.onClick = e => onClick(e, badge);
        if (onContextMenu) handlers.onContextMenu = e => onContextMenu(e, badge);

        return handlers;
    },

    getDonorBadges(userId: string) {
        const badges = [] as (ProfileBadge & BadgeUserArgs)[];

        // 1. Ozel Üye Badgeleri (Sunucu Rolünden)
        const isDonor = GuildMemberStore?.getMember(VENCORD_GUILD_ID, userId)?.roles.includes(DONOR_ROLE_ID);
        if (isDonor) {
            badges.push({
                iconSrc: "https://cdn.discordapp.com/emojis/1357798501232414992.webp",
                description: "403Cord Özel Üye",
                position: BadgePosition.START,
                userId,
                guildId: "", // Not necessary since it's only passed along
                props: {
                    style: {
                        borderRadius: "50%",
                        transform: "scale(0.9)"
                    }
                },
                onContextMenu(event, badge) {
                    ContextMenuApi.openContextMenu(event, () => <BadgeContextMenu badge={badge} />);
                }
            } satisfies ProfileBadge & BadgeUserArgs);
        }

        // 2. Kisiye Ozel URL'li Badge'ler (403.json'dan)
        if (DonorBadges[userId]) {
            const customBadges = DonorBadges[userId].map(badge => ({
                iconSrc: badge.badge,
                description: badge.tooltip,
                position: BadgePosition.START,
                userId,
                guildId: "",
                props: {
                    style: {
                        borderRadius: "50%",
                        transform: "scale(0.9)"
                    }
                },
                onContextMenu(event, badge) {
                    ContextMenuApi.openContextMenu(event, () => <BadgeContextMenu badge={badge} />);
                },
            } satisfies ProfileBadge & BadgeUserArgs));
            badges.push(...customBadges);
        }

        return badges.length ? badges : undefined;
    }
});
