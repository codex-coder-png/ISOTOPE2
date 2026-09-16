ISOTOPE — LOCAL MULTIPLAYER
============================

WINDOWS
1. Double-click START_LOCAL_STREAM.bat.
2. It starts a localhost server at http://127.0.0.1:8765/ and opens Isotope.
3. Open another tab on the same localhost URL.
4. Use the same ISO-XXXX lobby code.

CHROMEBOOK / ANY BROWSER WITH THE DOWNLOADED HTML
1. Open OPEN_CHROMEBOOK_LOCAL.html, or open index.html directly.
2. Press OPEN LOCAL CO-OP.
3. Two local browser tabs can connect without a website or Python server.
4. In one tab choose HOST. In the other choose JOIN.
5. Copy the HOST offer into JOIN, generate the answer, then copy the answer back to HOST.
6. Press APPLY ANSWER on HOST. When both tabs say CONNECTED, start the lobby.

The Chromebook fallback uses WebRTC DataChannel directly between the two tabs.
It therefore does not require localhost, GitHub, a website, Python, or a BAT file.
The only requirement is that the browser/managed Chromebook allows RTCPeerConnection.
