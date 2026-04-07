/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoOnboardingDelay",
    description: "Skips the slow and annoying onboarding delay",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "#{intl::ONBOARDING_COVER_WELCOME_SUBTITLE}",
            replacement: {
                match: "3e3",
                replace: "0"
            },
        },
    ],
});
