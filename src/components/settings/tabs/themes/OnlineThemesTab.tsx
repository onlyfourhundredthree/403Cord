/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Forms, TextArea, useState } from "@webpack/common";

export function OnlineThemesTab() {
    const settings = useSettings(["themeLinks"]);

    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));

    // When the user leaves the online theme textbox, update the settings
    function onBlur() {
        settings.themeLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];
    }

    return (
        <Flex flexDirection="column" gap="1em">
            <Card variant="warning" defaultPadding>
                <Forms.FormText size="md">
                    Bu bölüm sadece ileri düzey ve uzman kullanıcılar içindir. Eğer buradan link girmekte zorlanıyorsanız, bunun yerine Yerel Temalar sekmesini kullanın.
                </Forms.FormText>
            </Card>
            <Card>
                <Forms.FormTitle tag="h5">Buraya CSS dosyalarının linklerini yapıştırın</Forms.FormTitle>
                <Forms.FormText>Her satıra bir link gelecek şekilde düzenleyin</Forms.FormText>
                <Forms.FormText>Discord temanıza göre açık veya kapalı kalması için satırların başına @light veya @dark ekleyebilirsiniz</Forms.FormText>
                <Forms.FormText>Dosyalara doğrudan (raw veya github.io) bağlantılar kullandığınızdan emin olun!</Forms.FormText>
            </Card>

            <section>
                <Forms.FormTitle tag="h5">Çevrimiçi Temalar</Forms.FormTitle>
                <TextArea
                    value={themeText}
                    onChange={setThemeText}
                    className={"vc-settings-theme-links"}
                    placeholder="Tema Bağlantısını Yapıştırın..."
                    spellCheck={false}
                    onBlur={onBlur}
                    rows={10}
                />
            </section>
        </Flex>
    );
}
