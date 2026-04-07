/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IS_MAC } from "@utils/constants";
import definePlugin from "@utils/types";
import { findCssClassesLazy } from "@webpack";

const SpoilerClasses = findCssClassesLazy("spoilerContent", "hidden");
const MessagesClasses = findCssClassesLazy("messagesWrapper", "navigationDescription");

export default definePlugin({
    name: "RevealAllSpoilers",
    description: "Reveal all spoilers in a message by Ctrl-clicking a spoiler, or in the chat with Ctrl+Shift-click",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    patches: [
        {
            find: ".removeObscurity,",
            replacement: {
                match: /(?<=removeObscurity(?:",|=)(\i)=>{)/,
                replace: (_, event) => `$self.reveal(${event});`
            }
        }
    ],

    reveal(event: MouseEvent) {
        const { ctrlKey, metaKey, shiftKey, target } = event;

        if (!(IS_MAC ? metaKey : ctrlKey)) { return; }

        const { spoilerContent, hidden } = SpoilerClasses;
        const { messagesWrapper } = MessagesClasses;

        const parent = shiftKey
            ? document.querySelector(`div.${messagesWrapper}`)
            : (target as HTMLSpanElement).parentElement;

        for (const spoiler of parent!.querySelectorAll(`span.${spoilerContent}.${hidden}`)) {
            (spoiler as HTMLSpanElement).click();
        }
    }

});
