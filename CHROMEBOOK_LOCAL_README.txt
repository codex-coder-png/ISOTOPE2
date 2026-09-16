ISOTOPE — CHROMEBOOK LOCAL MULTIPLAYER
======================================

This build includes a browser-only local multiplayer fallback. It does NOT need:
- a website
- GitHub
- Python
- a .bat file
- localhost

ChromeOS browsers cannot run the Windows START_LOCAL_STREAM.bat file, and an HTML
file cannot create a localhost HTTP server by itself. Instead, this build uses a
direct WebRTC data channel between two browser tabs.

HOW TO USE
1. Extract/open index.html on the Chromebook.
2. Press OPEN LOCAL CO-OP. A second tab opens the same local game.
3. In one tab press HOST.
4. In the second tab press JOIN.
5. Copy the HOST offer from tab 1 into the top box of tab 2.
6. Press GENERATE / ACCEPT in tab 2.
7. Copy the ANSWER from tab 2 into the lower box in tab 1.
8. Press APPLY ANSWER (HOST) in tab 1.
9. When both tabs say CONNECTED, use the same lobby/room flow.

The connection is peer-to-peer. The copied offer/answer text is only signaling data;
a separate web server is not used by the game transport.

NOTE
WebRTC support is required. Current Chrome/Chromium-based browsers normally provide
RTCPeerConnection/DataChannel. If a school-managed Chromebook disables WebRTC,
local multiplayer cannot be enabled purely from an HTML file; the browser policy
would need to allow WebRTC.
