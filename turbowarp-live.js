(function(Scratch) {
    'use strict';

    class TurboWarpLiveSandboxed {
        constructor() {}

        getInfo() {
            return {
                id: 'twlivesandboxed',
                name: 'TurboWarp Live (Safe)',
                blocks: [
                    {
                        opcode: 'sendCloudData',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'Send 3D Data [DATA]',
                        arguments: {
                            DATA: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "0,0,0"
                            }
                        }
                    },
                    {
                        opcode: 'getCloudData',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'Friend\'s 3D Data'
                    }
                ]
            };
        }

        // Sets the value of a project cloud variable natively inside the sandbox
        sendCloudData(args) {
            if (typeof Scratch !== 'undefined' && Scratch.vmData) {
                Scratch.vmData.setCloudVariable('☁ multiplayer_data', args.DATA);
            }
        }

        // Reads the value of the cloud variable updated by the other tab
        getCloudData() {
            if (typeof Scratch !== 'undefined' && Scratch.vmData) {
                return Scratch.vmData.getCloudVariable('☁ multiplayer_data') || "0,0,0";
            }
            return "0,0,0";
        }
    }

    Scratch.extensions.register(new TurboWarpLiveSandboxed());
})(Scratch);
