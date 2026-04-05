/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SpecialCard } from "@components/settings/SpecialCard";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { IS_MAC, IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { relaunch } from "@utils/native";
import { Alerts, Forms, React, useMemo, UserStore } from "@webpack/common";

import { DonateButtonComponent, isDonor } from "./DonateButton";
import { VibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";

const DEFAULT_DONATE_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://media.discordapp.net/stickers/1039992459209490513.png";
const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const COZY_CONTRIB_IMAGE = "https://cdn.discordapp.com/emojis/1026533070955872337.png";
const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const CONTRIB_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070166481895484.png?size=2048";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "winNativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: "Özel CSS Ayarlarını (Quick CSS) Etkinleştir",
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "React Geliştirici Araçlarını (DevTools) Etkinleştir",
            restartRequired: true
        },
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS ? {
            key: "frameless",
            title: "Pencere çerçevesini devre dışı bırak",
            restartRequired: true
        } : {
            key: "winNativeTitleBar",
            title: "Discord'un kendi başlığı yerine Windows'un yerel başlık çubuğunu kullan",
            restartRequired: true
        }),
        !IS_WEB && {
            key: "transparent",
            title: "Pencere şeffaflığını (Transparency) etkinleştir",
            description: "Bu ayarın çalışması için şeffaflığı destekleyen bir tema gerekir, aksi takdirde hiçbir işe yaramaz. Yan etki olarak pencerenin yeniden boyutlandırılmasını durdurur.",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "Minimum pencere boyutunu devre dışı bırak",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Discord'u kapatmak için Ctrl+Q kısayolunu kullan (Alt+F4 Alternatifi)",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        title: string;
        description?: string;
        restartRequired?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { key, title, description, restartRequired } = setting;

        return (
            <FormSwitch
                key={key}
                title={title}
                description={description}
                value={settings[key]}
                onChange={v => {
                    settings[key] = v;

                    if (restartRequired) {
                        Alerts.show({
                            title: "Yeniden Başlatma Gerekli",
                            body: "Bu değişikliğin uygulanması için Discord'un yeniden başlatılması gerekiyor.",
                            confirmText: "Şimdi Yeniden Başlat",
                            cancelText: "Daha Sonra!",
                            onConfirm: relaunch
                        });
                    }
                }}
            />
        );
    });
}

function VencordSettings() {
    const donateImage = useMemo(() =>
        Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE,
        []
    );

    const needsVibrancySettings = IS_DISCORD_DESKTOP && IS_MAC;

    const user = UserStore?.getCurrentUser();

    return (
        <SettingsTab>
            {isDonor(user?.id)
                ? (
                    <SpecialCard
                        title="Bağışlar"
                        subtitle="Bağış yaptığın için teşekkürler!"
                        description="Özelliklerini istediğin zaman @vending.machine'e mesaj atarak yönetebilirsin."
                        cardImage={VENNIE_DONATOR_IMAGE}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#ED87A9"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
                : (
                    <SpecialCard
                        title="Discord Sunucumuz"
                        description="403Cord güncellemeleri, yama notları ve yeni rozet başvuruları için sende resmi sunucumuza katıl!"
                        cardImage={donateImage}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#c3a3ce"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
            }



            <section>
                <Forms.FormTitle tag="h5">Hızlı Eylemler</Forms.FormTitle>

                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text="Bildirim Kaydı"
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="HızlıCSS Düzenle"
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    {!IS_WEB && (
                        <>
                            <QuickAction
                                Icon={RestartIcon}
                                text="Discord'u Yeniden Başlat"
                                action={relaunch}
                            />
                            <QuickAction
                                Icon={FolderIcon}
                                text="Ayarlar Klasörünü Aç"
                                action={() => VencordNative.settings.openFolder()}
                            />
                        </>
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text="Kaynak Kodunu İncele"
                        action={() => VencordNative.native.openExternal("https://github.com/onlyfourhundredthree")}
                    />
                </QuickActionCard>
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Forms.FormTitle tag="h5">Genel Ayarlar</Forms.FormTitle>
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    İpucu: Bu bölümün ve 403Cord sekmesinin nerede konumlanacağını {" "}
                    <a onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}>
                        Ayarlar
                    </a> eklentisinden dilediğiniz gibi değiştirebilirsiniz!
                </Forms.FormText>

                <Switches />
            </section>


            {needsVibrancySettings && <VibrancySettings />}

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "403Cord Ayarları");
