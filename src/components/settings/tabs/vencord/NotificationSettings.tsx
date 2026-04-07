/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { ModalCloseButton, ModalContent, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Forms, Select, Slider, Text } from "@webpack/common";

export function NotificationSection() {
    return (
        <section className={Margins.top16}>
            <Forms.FormTitle tag="h5">Bildirimler</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>
                403Cord tarafından gönderilen bildirimlerin ayarları.
                Bu, Discord bildirimlerini (mesajlar vb.) İÇERMEZ.
            </Forms.FormText>
            <Flex>
                <Button onClick={openNotificationSettingsModal}>
                    Bildirim Ayarları
                </Button>
                <Button onClick={openNotificationLogModal}>
                    Bildirim Geçmişi
                </Button>
            </Flex>
        </section>
    );
}

export function openNotificationSettingsModal() {
    openModal(props => (
        <ModalRoot {...props} size={ModalSize.MEDIUM}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Bildirim Ayarları</Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>

            <ModalContent>
                <NotificationSettings />
            </ModalContent>
        </ModalRoot>
    ));
}

function NotificationSettings() {
    const settings = useSettings(["notifications.*"]).notifications;

    return (
        <div style={{ padding: "1em 0" }}>
            <Forms.FormTitle tag="h5">Bildirim Stili</Forms.FormTitle>
            {settings.useNative !== "never" && Notification?.permission === "denied" && (
                <ErrorCard style={{ padding: "1em" }} className={Margins.bottom8}>
                    <Forms.FormTitle tag="h5">Masaüstü Bildirim İzni Reddedildi</Forms.FormTitle>
                    <Forms.FormText>Bildirim izinlerini reddetmişsiniz. Bu nedenle masaüstü bildirimleri çalışmayacaktır!</Forms.FormText>
                </ErrorCard>
            )}
            <Forms.FormText className={Margins.bottom8}>
                Bazı eklentiler size bildirim gösterebilir. Bunlar iki şekilde gelir:
                <ul>
                    <li><strong>403Cord Bildirimleri</strong>: Bunlar uygulama içi bildirimlerdir</li>
                    <li><strong>Masaüstü Bildirimleri</strong>: Yerel masaüstü bildirimleri (ping aldığınızda gelen gibi)</li>
                </ul>
            </Forms.FormText>
            <Select
                placeholder="Notification Style"
                options={[
                    { label: "Yalnızca Discord odakta değilken masaüstü bildirimlerini kullan", value: "not-focused", default: true },
                    { label: "Her zaman masaüstü bildirimlerini kullan", value: "always" },
                    { label: "Her zaman 403Cord bildirimlerini kullan", value: "never" },
                ] satisfies Array<{ value: typeof settings["useNative"]; } & Record<string, any>>}
                closeOnSelect={true}
                select={v => settings.useNative = v}
                isSelected={v => v === settings.useNative}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>Bildirim Konumu</Forms.FormTitle>
            <Select
                isDisabled={settings.useNative === "always"}
                placeholder="Bildirim Konumu"
                options={[
                    { label: "Sağ Alt", value: "bottom-right", default: true },
                    { label: "Sağ Üst", value: "top-right" },
                ] satisfies Array<{ value: typeof settings["position"]; } & Record<string, any>>}
                select={v => settings.position = v}
                isSelected={v => v === settings.position}
                serialize={identity}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>Bildirim Süresi</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>Otomatik kapanmasını istemiyorsanız 0s olarak ayarlayın</Forms.FormText>
            <Slider
                disabled={settings.useNative === "always"}
                markers={[0, 1000, 2500, 5000, 10_000, 20_000]}
                minValue={0}
                maxValue={20_000}
                initialValue={settings.timeout}
                onValueChange={v => settings.timeout = v}
                onValueRender={v => (v / 1000).toFixed(2) + "s"}
                onMarkerRender={v => (v / 1000) + "s"}
                stickToMarkers={false}
            />

            <Forms.FormTitle tag="h5" className={Margins.top16 + " " + Margins.bottom8}>Bildirim Geçmişi Limiti</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom16}>
                Eski bildirimler silinmeden önce kayıt altına alınacak bildirim sayısı.
                <code>0</code> olarak ayarlarsanız bildirim geçmişi devre dışı kalır, <code>∞</code> olarak ayarlarsanız eski bildirimler hiçbir zaman otomatik silinmez.
            </Forms.FormText>
            <Slider
                markers={[0, 25, 50, 75, 100, 200]}
                minValue={0}
                maxValue={200}
                stickToMarkers={true}
                initialValue={settings.logLimit}
                onValueChange={v => settings.logLimit = v}
                onValueRender={v => v === 200 ? "∞" : v}
                onMarkerRender={v => v === 200 ? "∞" : v}
            />
        </div>
    );
}
