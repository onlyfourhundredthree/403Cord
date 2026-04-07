/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { React } from "@webpack/common";

let ERROR_CODES: Record<string, string> | undefined;

export default definePlugin({
    name: "ReactErrorDecoder",
    description: 'Replaces "Minifed React Error" with the actual error.',
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    patches: [
        {
            find: "React has blocked a javascript: URL as a security precaution.",
            replacement: {
                match: /"https:\/\/react.dev\/errors\/"\+\i;/,
                replace: "$&const vcDecodedError=$self.decodeError(...arguments);if(vcDecodedError)return vcDecodedError;"
            }
        }
    ],

    async start() {
        const CODES_URL = `https://raw.githubusercontent.com/facebook/react/v${React.version}/scripts/error-codes/codes.json`;

        ERROR_CODES = await fetch(CODES_URL)
            .then(res => res.json())
            .catch(e => console.error("[ReactErrorDecoder] Failed to fetch React error codes\n", e));
    },

    stop() {
        ERROR_CODES = undefined;
    },

    decodeError(code: number, ...args: any) {
        let index = 0;
        return ERROR_CODES?.[code]?.replace(/%s/g, () => {
            const arg = args[index];
            index++;
            return arg;
        });
    }
});
