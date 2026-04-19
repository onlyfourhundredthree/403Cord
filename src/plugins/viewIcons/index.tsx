/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { ImageIcon } from "@components/Icons";
import { openImageModal } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { User } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { Button, GuildMemberStore, IconUtils, Menu } from "@webpack/common";

const UserProfileClasses = findByPropsLazy("profileButtons", "profileBody");

const settings = definePluginSettings({
    format: {
        type: OptionType.SELECT,
        description: "Choose the image format to use for non animated images.",
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

function openImage(url: string, width: number, height?: number) {
    const u = new URL(url, window.location.href);
    const format = u.searchParams.get("animated") === "true" ? "gif" : settings.store.format;
    u.searchParams.set("size", settings.store.imgSize);
    u.pathname = u.pathname.replace(/\.(png|jpe?g|webp)$/, `.${format}`);
    const finalUrl = u.toString();
    u.searchParams.set("size", "4096");
    openImageModal({ url: finalUrl, original: u.toString(), width, height });
}

const openAvatar = (url: string) => openImage(url, 512, 512);
const openBanner = (url: string) => openImage(url, 1024);

function ProfileViewButton({ user }: { user: User; }) {
    return (
        <Button
            size={Button.Sizes.SMALL}
            color={Button.Colors.SECONDARY}
            look={Button.Looks.FILLED}
            onClick={e => {
                e.stopPropagation();
                const avatar = IconUtils.getUserAvatarURL(user, true);
                if (avatar) openAvatar(avatar);
            }}
            className="vc-viewicons-profile-button"
        >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <ImageIcon width={16} height={16} />
                <span>Görseller</span>
            </div>
        </Button>
    );
}

export default definePlugin({
    name: "ViewIcons",
    description: "Kullanıcı profilindeki yan butonlara 'Görseller' seçeneği ekler. Ayrıca banner ve ikonlara sağ tıkla erişim sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    dependencies: ["DynamicImageModalAPI"],
    settings,

    openAvatar,
    openBanner,
    ProfileViewButton,

    patches: [
        // Inject button into the profile buttons row
        {
            find: "#{intl::USER_PROFILE_MESSAGE}",
            replacement: {
                match: /(children:\[)(?=\i\(.+?#{intl::USER_PROFILE_MESSAGE})/,
                replace: "$1$self.ProfileViewButton({user:arguments[0].user}),"
            }
        },
        // Banners
        {
            find: 'backgroundColor:"COMPLETE"',
            replacement: {
                match: /(overflow:"visible",.{0,125}?!1\),)style:{(?=.+?backgroundImage:null!=(\i)\?`url\(\$\{\2\}\))/,
                replace: (_, rest, bannerSrc) => `${rest}onClick:()=>$self.openBanner(${bannerSrc}),style:{cursor:"pointer",`
            }
        }
    ],

    contextMenus: {
        "user-context": (children, { user, guildId }) => {
            if (!user) return;
            const memberAvatar = GuildMemberStore.getMember(guildId!, user.id)?.avatar || null;
            children.splice(-1, 0, (
                <Menu.MenuGroup>
                    <Menu.MenuItem id="view-avatar" label="Avatarı Görüntüle" action={() => openAvatar(IconUtils.getUserAvatarURL(user, true))} icon={ImageIcon} />
                    {memberAvatar && (
                        <Menu.MenuItem id="view-server-avatar" label="Sunucu Avatarını Görüntüle" action={() => openAvatar(IconUtils.getGuildMemberAvatarURLSimple({ userId: user.id, avatar: memberAvatar, guildId: guildId!, canAnimate: true }))} icon={ImageIcon} />
                    )}
                </Menu.MenuGroup>
            ));
        }
    }
});
