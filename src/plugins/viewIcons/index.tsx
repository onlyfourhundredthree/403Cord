/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { ImageIcon } from "@components/Icons";
import { openImageModal } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel, Guild, User } from "@vencord/discord-types";
import { GuildMemberStore, IconUtils, Menu } from "@webpack/common";

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

interface GuildContextProps {
    guild?: Guild;
}

interface GroupDMContextProps {
    channel: Channel;
}

const settings = definePluginSettings({
    format: {
        type: OptionType.SELECT,
        description: "Choose the image format to use for non animated images. Animated images will always use .gif",
        options: [
            { label: "webp", value: "webp" },
            { label: "png", value: "png", default: true },
            { label: "jpg", value: "jpg" }
        ]
    },
    imgSize: {
        type: OptionType.SELECT,
        description: "The image size to use",
        options: ["128", "256", "512", "1024", "2048", "4096"].map(n => ({ label: n, value: n, default: n === "2048" }))
    }
});

const openAvatar = (url: string) => openImage(url, 512, 512);
const openBanner = (url: string) => openImage(url, 1024);

function openImage(url: string, width: number, height?: number) {
    const u = new URL(url, window.location.href);

    const format = url.startsWith("/")
        ? "png"
        : u.searchParams.get("animated") === "true"
            ? "gif"
            : settings.store.format;

    u.searchParams.set("size", settings.store.imgSize);
    u.pathname = u.pathname.replace(/\.(png|jpe?g|webp)$/, `.${format}`);
    url = u.toString();

    u.searchParams.set("size", "4096");
    const original = u.toString();

    openImageModal({
        url,
        original,
        width,
        height
    });
}

const UserContext: NavContextMenuPatchCallback = (children, { user, guildId }: UserContextProps) => {
    if (!user) return;
    const memberAvatar = GuildMemberStore.getMember(guildId!, user.id)?.avatar || null;

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="view-avatar"
                label="Avatarı Görüntüle"
                action={() => openAvatar(IconUtils.getUserAvatarURL(user, true))}
                icon={ImageIcon}
            />
            {memberAvatar && (
                <Menu.MenuItem
                    id="view-server-avatar"
                    label="Sunucu Avatarını Görüntüle"
                    action={() => openAvatar(IconUtils.getGuildMemberAvatarURLSimple({
                        userId: user.id,
                        avatar: memberAvatar,
                        guildId: guildId!,
                        canAnimate: true
                    }))}
                    icon={ImageIcon}
                />
            )}
        </Menu.MenuGroup>
    ));
};

const GuildContext: NavContextMenuPatchCallback = (children, { guild }: GuildContextProps) => {
    if (!guild) return;
    const { id, icon, banner } = guild;
    if (!banner && !icon) return;

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            {icon ? (
                <Menu.MenuItem
                    id="view-icon"
                    label="Avatarı Görüntüle"
                    action={() => openAvatar(IconUtils.getGuildIconURL({ id, icon, canAnimate: true })!)}
                    icon={ImageIcon}
                />
            ) : null}
            {banner ? (
                <Menu.MenuItem
                    id="view-banner"
                    label="Banneri Görüntüle"
                    action={() => openBanner(IconUtils.getGuildBannerURL(guild, true)!)}
                    icon={ImageIcon}
                />
            ) : null}
        </Menu.MenuGroup>
    ));
};

const GroupDMContext: NavContextMenuPatchCallback = (children, { channel }: GroupDMContextProps) => {
    if (!channel) return;
    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="view-group-channel-icon"
                label="Avatarı Görüntüle"
                action={() => openAvatar(IconUtils.getChannelIconURL(channel)!)}
                icon={ImageIcon}
            />
        </Menu.MenuGroup>
    ));
};

let clickListener: (e: MouseEvent) => void;

export default definePlugin({
    name: "ViewIcons",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    description: "Kullanıcı profillerinde avatar ve bannerlara tıklayarak büyütmenizi sağlar. Ayrıca sağ tık menüsüne seçenekler ekler.",
    tags: ["ImageUtilities"],
    dependencies: ["DynamicImageModalAPI"],
    settings,

    openAvatar,
    openBanner,

    contextMenus: {
        "user-context": UserContext,
        "guild-context": GuildContext,
        "gdm-context": GroupDMContext
    },

    start() {
        clickListener = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const wrapper = target.closest?.('[class*="wrapper__44b0c"]');
            if (!wrapper) return;

            // Sadece büyük avatarlar (profil popout/modal)
            if ((wrapper as HTMLElement).offsetWidth < 80) return;

            // Profil içinde olduğumuzdan emin olalım
            const isProfile = target.closest?.('[class*="userPopoutOuter_"], [class*="userProfileModalOuter_"], [class*="overlay_"]');
            if (!isProfile) return;

            const img = wrapper.querySelector?.('img[class*="avatar__44b0c"]') as HTMLImageElement;
            if (img?.src) {
                e.preventDefault();
                e.stopPropagation();
                openAvatar(img.src);
            }
        };
        document.addEventListener("click", clickListener, true);
    },

    stop() {
        document.removeEventListener("click", clickListener, true);
    },

    patches: [
        // Banners
        {
            find: 'backgroundColor:"COMPLETE"',
            replacement: {
                match: /(overflow:"visible",.{0,125}?!1\),)style:{(?=.+?backgroundImage:null!=(\i)\?`url\(\$\{\2\}\))/,
                replace: (_, rest, bannerSrc) => `${rest}onClick:()=>${bannerSrc}!=null&&$self.openBanner(${bannerSrc}),style:{cursor:${bannerSrc}!=null?"pointer":void 0,`
            }
        },
        // Group DMs top small & large icon
        {
            find: '["aria-hidden"],"aria-label":',
            replacement: {
                match: /null==\i\.icon\?.+?src:(\(0,\i\.\i\).+?\))(?=[,}])/,
                replace: (m, iconUrl) => `${m},onClick:()=>arguments[0]?.size!=="SIZE_48"&&$self.openAvatar(${iconUrl})`
            }
        },
        // User DMs top small icon
        {
            find: ".channel.getRecipientId(),",
            replacement: {
                match: /(?=,src:(\i.getAvatarURL\(.+?[)]))/,
                replace: (_, avatarUrl) => `,onClick:()=>$self.openAvatar(${avatarUrl})`
            }
        },
        // User Dms top large icon
        {
            find: ".EMPTY_GROUP_DM)",
            replacement: {
                match: /(?<=SIZE_80,)(?=src:(.+?\))[,}])/,
                replace: (_, avatarUrl) => `onClick:()=>$self.openAvatar(${avatarUrl}),`
            }
        }
    ]
});
