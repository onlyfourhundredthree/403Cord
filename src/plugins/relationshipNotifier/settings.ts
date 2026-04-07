/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export default definePluginSettings({
    notices: {
        type: OptionType.BOOLEAN,
        description: "Sizi çıkaranlar olduğunda ekranın üst kısmında bir uyarı göster (bildirimleri kaçırmak istemiyorsanız bunu kullanın).",
        default: false
    },
    offlineRemovals: {
        type: OptionType.BOOLEAN,
        description: "Çevrimdışıyken çıkarıldıysanız, Discord'u açtığınızda sizi bilgilendirir.",
        default: true
    },
    friends: {
        type: OptionType.BOOLEAN,
        description: "Bir arkadaşınız sizi çıkardığında bildir",
        default: true
    },
    friendRequestCancels: {
        type: OptionType.BOOLEAN,
        description: "Bir arkadaşlık isteği iptal edildiğinde bildir",
        default: true
    },
    servers: {
        type: OptionType.BOOLEAN,
        description: "Bir sunucudan çıkarıldığınızda bildir",
        default: true
    },
    groups: {
        type: OptionType.BOOLEAN,
        description: "Bir grup sohbetinden çıkarıldığınızda bildir",
        default: true
    }
});
