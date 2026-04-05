/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { downloadSettingsBackup, uploadSettingsBackup } from "@api/SettingsSync/offline";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { Button, Text } from "@webpack/common";

function BackupAndRestoreTab() {
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="0.5em">
                <Card variant="warning">
                    <Heading tag="h4">Uyarı</Heading>
                    <Paragraph>Önceden var olan bir yedek dosyasını geri yüklemek şuanki ayarlarınızın tamamen silinmesine ve üzerine yazılmasına yol açacaktır.</Paragraph>
                </Card>

                <Text variant="text-md/normal" className={Margins.bottom8}>
                    403Cord eklentilerinizi, temalarınızı ve diğer ayarlarınızı güvenle bir JSON dosyası olarak bilgisayarınıza dışa aktarabilirsiniz.
                    Bu dışa aktarım, 403Cord çöktüğünde veya Discord'u yeniden yüklediğinizde o eklenti ve tasarımlarınızı saniyeler içinde geri kazanmanızı sağlar.
                </Text>

                <Heading tag="h4">Yedeklenen Verilerin İçeriği:</Heading>
                <Text variant="text-md/normal" className={Margins.bottom8}>
                    <ul>
                        <li>&mdash; Özel HızlıCSS (QuickCSS) Komutlarınız</li>
                        <li>&mdash; Temalarınız ve Tema CSS Bağlantılarınız</li>
                        <li>&mdash; Tüm 403Cord Eklentilerinizin Tıklanma ve İçerik Ayarları</li>
                    </ul>
                </Text>

                <Flex>
                    <Button onClick={() => uploadSettingsBackup()}>
                        Yedeği Geri Yükle
                    </Button>
                    <Button onClick={downloadSettingsBackup}>
                        Yedek Al (Dışa Aktar)
                    </Button>
                </Flex>
            </Flex>
        </SettingsTab >
    );
}

export default wrapTab(BackupAndRestoreTab, "Yedekle & Geri Yükle");
