(function(Scratch) {
    'use strict';

    class WarpLinkStableBridge {
        constructor() {
            this.vm = Scratch.vm;
            this.isHandlingEvent = false;
            this.setupHooks();
        }

        getInfo() { return { id: 'warplinkbridge', name: 'WarpLink Safe Bridge', blocks: [] }; }

        setupHooks() {
            if (!this.vm) return;

            // Catch individual block updates safely and forward out to Tampermonkey
            this.vm.runtime.on('QUERY_COMPILE', (e) => {
                if (this.isHandlingEvent) return;
                window.postMessage({ type: 'TW_EDITOR_LOCAL_ACTION', event: e }, '*');
            });

            // Catch incoming actions captured by Tampermonkey from your friend
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'TW_EDITOR_REMOTE_ACTION') {
                    this.applyEvent(event.data.event);
                }
            });
        }

        applyEvent(eventData) {
            this.isHandlingEvent = true;
            try {
                const workspace = this.vm.runtime.getEditingTarget()?.blocks;
                if (workspace && eventData && eventData.element === 'block') {
                    if (workspace.getBlock(eventData.blockId)) {
                        workspace.moveBlock(eventData.blockId, eventData.newX, eventData.newY);
                    }
                    this.vm.emitWorkspaceUpdate();
                }
            } catch (err) {}
            this.isHandlingEvent = false;
        }
    }

    Scratch.extensions.register(new WarpLinkStableBridge());
})(Scratch);
