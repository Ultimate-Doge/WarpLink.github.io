(function(Scratch) {
    'use strict';

    class WarpLinkSafeEditor {
        constructor() {
            this.incomingCodeData = "No shared code yet.";
        }

        getInfo() {
            return {
                id: 'warplinksafe',
                name: 'WarpLink Safe Editor',
                blocks: [
                    {
                        opcode: 'shareScriptText',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Share script layout [TEXT]',
                        arguments: {
                            TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: "move 10 steps" }
                        }
                    },
                    {
                        opcode: 'getSharedScriptText',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Friend\'s shared layout'
                    }
                ]
            };
        }

        // Updates the native TurboWarp cloud network safely inside the sandbox
        shareScriptText(args) {
            if (typeof Scratch !== 'undefined' && Scratch.vmData) {
                Scratch.vmData.setCloudVariable('☁ shared_editor_stream', args.TEXT);
            }
        }

        // Reads incoming workspace variables without touching hidden system directories
        getSharedScriptText() {
            if (typeof Scratch !== 'undefined' && Scratch.vmData) {
                return Scratch.vmData.getCloudVariable('☁ shared_editor_stream') || "No shared code yet.";
            }
            return this.incomingCodeData;
        }
    }

    Scratch.extensions.register(new WarpLinkSafeEditor());
})(Scratch);
