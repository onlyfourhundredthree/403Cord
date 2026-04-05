/*
 * 403Cord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { HeadingSecondary } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { Forms, React } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, Newer, Updatable } from "./Components";

function VesktopSection() {
    if (!IS_VESKTOP) return null;

    const [isVesktopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="info">
                <HeadingSecondary>Vesktop & 403Cord</HeadingSecondary>
                <Paragraph>Vesktop ve 403Cord eklentileri bağımsız ayrı yapılardır. Şu an gördüğünüz bu menü sadece 403Cord Modül Güncelleyicisidir.</Paragraph>
                <Paragraph className={Margins.top8}>
                    Vesktop güncellemeleri için ayrı bir bildirim ekranı mevcuttur. Dilerseniz en yeni <Link href="https://vesktop.dev/install">versiyonu bu linkten</Link> indirerek de güncelleyebilirsiniz.
                </Paragraph>
            </Card>

            {isVesktopOutdated && (
                <Card variant="warning">
                    <HeadingSecondary>Vesktop Sürümü Eski</HeadingSecondary>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph>Kullandığınız Vesktop sürümü oldukça eski, güncelleme yapınız!</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>Vesktop Güncelleyiciyi Çalıştır</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: "Loading...",
        onError: e => UpdateLogger.error("Failed to retrieve repo", err)
    });

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <SettingsTab>
            <VesktopSection />

            <FormSwitch
                title="Otomatik Güncelleme Modu"
                description="Onay veya sorgu beklemeden 403Cord'u arka planda sessizce yeni sürümlerine günceller"
                value={settings.autoUpdate}
                onChange={(v: boolean) => settings.autoUpdate = v}
            />
            <FormSwitch
                title="Güncelleme Bittiğinde Bildir"
                description="403Cord başarılı bir şekilde otomatik olarak güncellendiğinde sağ alttan size fırlatma bildirim yollar"
                value={settings.autoUpdateNotification}
                onChange={(v: boolean) => settings.autoUpdateNotification = v}
                disabled={!settings.autoUpdate}
            />

            <Forms.FormTitle tag="h5" className={Margins.top20}>Discord Sunucusu</Forms.FormTitle>

            <Forms.FormText>
                <Link href={"https://discord.gg/403"}>
                    discord.gg/403
                </Link>
                {" "}
                ({gitHash})
            </Forms.FormText>

            <Divider className={classes(Margins.top16, Margins.bottom16)} />

            <Forms.FormTitle tag="h5">Sürümler / Güncellemeler</Forms.FormTitle>

            {isNewer
                ? <Newer {...commonProps} />
                : <Updatable {...commonProps} />
            }
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "Güncelleyici");
