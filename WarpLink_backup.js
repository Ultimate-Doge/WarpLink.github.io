// ==UserScript==
// @name         WarpLink Direct Editor Injection
// @namespace    http://tampermonkey.net
// @version      5.3
// @description  Uses clean visual injection without forcing VM reloads to prevent race-condition wipes
// @author       Kalub
// @match        *://*.turbowarp.org/*
// @match        *://turbowarp.org/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const socket = new WebSocket('ws://127.0.0.1:8080');

    socket.onopen = () => {
        console.log("%c[WarpLink Network] Connected to PowerShell backend port 8080!", "color: green; font-weight: bold;");
        socket.send(JSON.stringify({ type: 'join', roomId: 'dev-workspace-3d' }));
    };

    socket.onmessage = (e) => {
        try {
            const packet = JSON.parse(e.data);
            if (packet.type === 'editor_event' && packet.jsonState) {
                window.postMessage(JSON.stringify({ type: 'WARPLINK_REMOTE_JSON_LOAD', packet: packet.jsonState }), '*');
            }
        } catch (err) {}
    };

    window.addEventListener('message', (event) => {
        try {
            if (typeof event.data === 'string' && event.data.includes('WARPLINK_LOCAL_JSON_SAVE')) {
                const parsed = JSON.parse(event.data);
                if (socket.readyState === WebSocket.OPEN && parsed.payload) {
                    socket.send(JSON.stringify({ type: 'editor_event', jsonState: parsed.payload }));
                }
            }
        } catch (e) {}
    });

    // CORE WORKSPACE INJECTION ENGINE
    function initMultiplayerSync() {
        if (typeof window.Blockly === 'undefined' || !window.Blockly.getMainWorkspace() || typeof window.vm === 'undefined') {
            setTimeout(initMultiplayerSync, 200);
            return;
        }

        console.log("%c[WarpLink Core] Successfully injected into Blockly memory space!", "color: cyan; font-weight: bold;");

        window.WarpLinkProcessingNetworkEvent = false;

        // 📥 VISUAL LAYER INJECTION: Clean and simple
        window.addEventListener('message', (msgEvent) => {
            try {
                if (typeof msgEvent.data === 'string' && msgEvent.data.includes('WARPLINK_REMOTE_JSON_LOAD')) {
                    const parsedMessage = JSON.parse(msgEvent.data);
                    const dataPackage = parsedMessage.packet;

                    if (dataPackage && dataPackage.xml && dataPackage.targetName) {

                        // Only update if we are looking at the correct sprite
                        if (window.vm.editingTarget && window.vm.editingTarget.getName() === dataPackage.targetName) {

                            window.WarpLinkProcessingNetworkEvent = true;

                            const activeWorkspace = window.Blockly.getMainWorkspace();
                            const xmlDom = window.Blockly.Xml.textToDom(dataPackage.xml);

                            // 1. Temporarily disable events to prevent immediate echo
                            // (We re-enable them quickly so the VM can catch up)

                            // 2. Clear and Draw
                            activeWorkspace.clear();
                            window.Blockly.Xml.domToWorkspace(xmlDom, activeWorkspace);

                            // 3. Visual Layout Fixes (Resize & Center)
                            if (typeof window.Blockly.svgResize === 'function') {
                                window.Blockly.svgResize(activeWorkspace);
                            }

                            // Snap view to the new blocks
                            if (typeof activeWorkspace.scrollCenter === 'function') {
                                activeWorkspace.scrollCenter();
                            }

                            // 4. Force graphical render
                            // We DO NOT call emitWorkspaceUpdate() here because it triggers a reload race condition!
                            // We trust TurboWarp's native listeners to hear the block creation events and update the VM.

                            console.log(`%c[WarpLink Core] Visually rendered blocks for: ${dataPackage.targetName}`, "color: lime; font-weight: bold;");

                            setTimeout(() => {
                                window.WarpLinkProcessingNetworkEvent = false;
                            }, 100);
                        }
                    }
                }
            } catch (err) {
                console.error("[WarpLink Core Error] Visual load failed:", err);
                window.WarpLinkProcessingNetworkEvent = false;
            }
        });

        // 📤 SAVE PACKETS: Capture changes from the active workspace
        function setupChangeListener() {
            const activeWorkspace = window.Blockly.getMainWorkspace();
            if (!activeWorkspace) return;

            activeWorkspace.addChangeListener((event) => {
                if (window.WarpLinkProcessingNetworkEvent) return;
                if (event.isUiEvent) return;

                if (event.type === 'move' || event.type === 'create' || event.type === 'delete' || event.type === 'change') {
                    try {
                        const currentWorkspace = window.Blockly.getMainWorkspace();
                        const currentTargetName = window.vm.editingTarget ? window.vm.editingTarget.getName() : null;

                        if (currentWorkspace && currentTargetName) {
                            const xmlDom = window.Blockly.Xml.workspaceToDom(currentWorkspace);
                            const xmlTextString = window.Blockly.Xml.domToText(xmlDom);

                            const payload = {
                                xml: xmlTextString,
                                targetName: currentTargetName
                            };

                            const dataPacket = JSON.stringify({ type: 'WARPLINK_LOCAL_JSON_SAVE', payload: payload });
                            window.postMessage(dataPacket, '*');
                        }
                    } catch (err) {
                        console.error("[WarpLink Core Error] Failed to serialize workspace state:", err);
                    }
                }
            });
        }

        setupChangeListener();

        window.vm.runtime.on('PROJECT_CHANGED', () => {
            setTimeout(setupChangeListener, 150);
        });
    }

    const script = document.createElement('script');
    script.textContent = `(${initMultiplayerSync.toString()})();`;
    document.documentElement.appendChild(script);
})();
