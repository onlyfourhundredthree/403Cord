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
