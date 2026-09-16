'use strict'; window.NET = {};
(function () {
  let isHost = false;
  let roomCode = null;
  let peer = null;
  let hostConn = null;
  let clientConns = {};
  let bc = null;
  let localPlayerId = 0;
  let lobbyConfig = { mode: 'coop', maxPlayers: 2, pvpTargetKills: 10, friendlyFire: false };
  let players = [];
  let myElement = DATA.canonicalId(SAVE.sel || 'e1');
  function entityPacket(id) {
    const key = DATA.canonicalId(id || SAVE.sel || 'e1');
    const el = DATA.EL(key) || {};
    return { entityId:key, elementId:key, entityKind:el.mol ? 'compound' : 'element', entityName:el.name || el.sym || key, formula:el.f || el.formula || '', symbol:el.sym || '' };
  }
  function resolvePacketEntity(pkt) {
    if (!pkt) return DATA.canonicalId('e1');
    const candidates = [pkt.entityId, pkt.elementId, pkt.formula, pkt.entityName, pkt.symbol].filter(Boolean);
    for (const c of candidates) {
      try { const k=DATA.canonicalId(c); if (k!=='e1' || String(c)==='e1' || DATA.ELEMS[k] || DATA.MOLDEF[k]) return k; } catch(e) {}
    }
    return 'e1';
  }
  let myName = 'Operator-' + Math.floor(100 + Math.random() * 900);
  let isReady = false;
  let netActive = false;
  let myClientId = 'C' + Math.random().toString(36).slice(2, 10);
  let joinAcked = false;
  let joinTimer = null;
  // Chromebook/file:// transport: direct WebRTC data channels, no server required.
  let localTransport = (location.protocol === 'file:' && new URLSearchParams(location.search).get('chrome') === '1') ? 'rtc' : 'hybrid';
  let rtcHostPc = null;
  let rtcHostChannels = {};
  let rtcClientPc = null;
  let rtcClientChannel = null;
  let rtcClientReady = false;


  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return 'ISO-' + c;
  }

  function initLocalBC(code) {
    if (localTransport === 'rtc') return;
    try {
      if (bc) bc.close();
      bc = new BroadcastChannel('isotope_room_' + code);
      bc.onmessage = e => handlePacket(e.data, 'bc');
    } catch (err) {
      console.warn('BroadcastChannel not supported or error:', err);
    }
  }

  function createLobby(mode, maxPlayers, pvpTargetKills, friendlyFire) {
    reset();
    isHost = true;
    localPlayerId = 0;
    roomCode = generateRoomCode();
    lobbyConfig = { mode: mode || 'coop', maxPlayers: Math.min(5, Math.max(2, maxPlayers || 2)), pvpTargetKills: pvpTargetKills || 10, friendlyFire: !!friendlyFire };
    myElement = DATA.canonicalId(SAVE.sel || 'e1');
    isReady = true;

    myClientId = 'host';
    players = [{
      id: 0,
      clientId: 'host',
      name: myName,
      elementId: myElement,
      ...entityPacket(myElement),
      signatureSlot: SAVE.getSignature ? SAVE.getSignature(myElement) : 0,
      ready: true,
      isHost: true,
      kills: 0,
      deaths: 0,
      ping: 10
    }];

    netActive = true;
    initLocalBC(roomCode);

    if (localTransport === 'rtc') {
      updateNetBadge('CHROMEBOOK P2P · AWAITING CONNECTION');
    } else if (window.Peer && location.protocol !== 'file:') {
      try {
        const peerId = 'isotope-' + roomCode.replace('-', '').toLowerCase();
        peer = new Peer(peerId);
        peer.on('open', id => {
          updateNetBadge('ONLINE · HOST');
        });
        peer.on('connection', conn => {
          setupHostConn(conn);
        });
        peer.on('error', err => {
          console.log('PeerJS note (using local fallback if needed):', err.type);
          updateNetBadge('LOCAL / P2P ONLINE');
        });
      } catch (e) {
        console.warn('PeerJS init error:', e);
        updateNetBadge('LOCAL P2P ONLINE');
      }
    } else {
      updateNetBadge('LOCAL P2P ONLINE');
    }

    notifyLobbyUpdated();
    return roomCode;
  }

  function setupHostConn(conn) {
    clientConns[conn.peer] = conn;
    conn.on('data', data => handlePacket(data, conn.peer));
    conn.on('close', () => removePeerClient(conn.peer));
  }

  function removePeerClient(peerId) {
    delete clientConns[peerId];
    players = players.filter(p => p.peerId !== peerId);
    reindexPlayers();
    broadcastLobbyState();
    notifyLobbyUpdated();
  }

  function reindexPlayers() {
    players.forEach((p, idx) => {
      p.id = idx;
    });
  }

  function joinLobby(code, callback) {
    reset();

    code = (code || '').trim().toUpperCase();
    if (!code.startsWith('ISO-')) {
      if (code.length === 4) code = 'ISO-' + code;
    }

    roomCode = code;
    isHost = false;
    myElement = DATA.canonicalId(SAVE.sel || 'e1');
    isReady = true;
    netActive = true;
    joinAcked = false;
    myClientId = 'C' + Math.random().toString(36).slice(2, 10);

    initLocalBC(roomCode);

    function trySendJoin() {
      const joinPacket = {
        type: 'JOIN_REQ',
        clientId: myClientId,
        name: myName,
        elementId: myElement,
        ...entityPacket(myElement),
        signatureSlot: SAVE.getSignature ? SAVE.getSignature(myElement) : 0,
        toClientId: 'host',
        fromClientId: myClientId
      };

      if (bc) bc.postMessage(joinPacket);
      if (hostConn && hostConn.open) hostConn.send(joinPacket);
    }

    if (localTransport === 'rtc') {
      updateNetBadge('CHROMEBOOK P2P · WAITING FOR HOST');
    } else if (window.Peer && location.protocol !== 'file:') {
      try {
        peer = new Peer();

        peer.on('open', () => {
          const targetPeerId = 'isotope-' + roomCode.replace('-', '').toLowerCase();
          hostConn = peer.connect(targetPeerId);

          hostConn.on('open', () => {
            updateNetBadge('ONLINE · CLIENT');
            trySendJoin();
          });

          hostConn.on('data', data => handlePacket(data, 'host'));

          hostConn.on('close', () => {
            if (window.UI) UI.toast('Disconnected from lobby host', 'bad');
            reset();
          });
        });

        peer.on('error', err => {
          console.warn('Peer connect error:', err);
          updateNetBadge('LOCAL P2P CLIENT');
        });
      } catch (e) {
        console.warn('PeerJS client error:', e);
      }
    }

    setTimeout(() => {
      trySendJoin();
      if (callback) callback();
    }, 350);

    if (joinTimer) clearInterval(joinTimer);
    joinTimer = setInterval(() => {
      if (!netActive || joinAcked) {
        clearInterval(joinTimer);
        joinTimer = null;
        return;
      }
      trySendJoin();
    }, 800);
  }

  function handlePacket(pkt, senderId) {
    if (!pkt || !pkt.type) return;

    if (isHost) {
      if (pkt.toClientId && pkt.toClientId !== 'host') return;

      if (pkt.type === 'JOIN_REQ') {
        const existing = players.find(p => p.clientId === pkt.clientId);

        if (existing) {
          if (senderId !== 'bc') existing.peerId = senderId;

          sendToClient(existing.clientId, {
            type: 'JOIN_ACK',
            assignedId: existing.id,
            config: lobbyConfig,
            players
          });

          broadcastLobbyState();
          notifyLobbyUpdated();
          return;
        }

        if (players.length >= lobbyConfig.maxPlayers) {
          sendToClient(pkt.clientId, { type: 'JOIN_REJ', reason: 'Lobby full' });
          return;
        }

        const newId = players.length;
        const newPlayer = {
          id: newId,
          clientId: pkt.clientId || ('C' + Math.random().toString(36).slice(2, 10)),
          name: pkt.name || ('Operator-' + (newId + 1)),
          elementId: resolvePacketEntity(pkt),
          ...entityPacket(resolvePacketEntity(pkt)),
          entityName: pkt.entityName || pkt.formula || '',
          formula: pkt.formula || '',
          signatureSlot: Number.isFinite(+pkt.signatureSlot) ? Math.max(0, Math.min(2, +pkt.signatureSlot)) : 0,
          ready: true,
          isHost: false,
          peerId: senderId === 'bc' ? null : senderId,
          kills: 0,
          deaths: 0,
          ping: 15
        };

        players.push(newPlayer);

        sendToClient(newPlayer.clientId, {
          type: 'JOIN_ACK',
          assignedId: newId,
          config: lobbyConfig,
          players
        });

        broadcastLobbyState();
        notifyLobbyUpdated();

        if (window.UI) UI.toast(newPlayer.name + ' connected!', 'good');
      }

      else if (pkt.type === 'PLAYER_READY') {
        const p = players.find(x => x.clientId === pkt.clientId) || players.find(x => x.id === pkt.playerId);
        if (p) {
          p.ready = pkt.ready;
          broadcastLobbyState();
          notifyLobbyUpdated();
        }
      }

      else if (pkt.type === 'PLAYER_ELEM') {
        const p = players.find(x => x.clientId === pkt.clientId) || players.find(x => x.id === pkt.playerId);
        if (p) {
          p.elementId = resolvePacketEntity(pkt);
          Object.assign(p, entityPacket(p.elementId));
          if(pkt.entityName) p.entityName=pkt.entityName;
          if(pkt.formula) p.formula=pkt.formula;
          p.signatureSlot = Math.max(0, Math.min(2, Number(pkt.signatureSlot) || 0));
          broadcastLobbyState();
          notifyLobbyUpdated();
        }
      }

      else if (pkt.type === 'PLAYER_LEAVE') {
        const p = players.find(x => x.clientId === pkt.clientId) || players.find(x => x.id === pkt.playerId);
        if (p) {
          players = players.filter(x => x !== p);
          reindexPlayers();
          broadcastLobbyState();
          notifyLobbyUpdated();
        }
      }

      else if (pkt.type === 'CHAT') {
        broadcast(pkt);
        if (NET.onChatMessage) NET.onChatMessage(pkt.sender, pkt.text);
      }

      else if (pkt.type === 'CLIENT_INPUT') {
        const p = players.find(x => x.clientId === pkt.clientId) || players.find(x => x.id === pkt.playerId);
        if (p && NET.onClientInput) NET.onClientInput(p.id, pkt.input);
      }

      else if (pkt.type === 'CLIENT_ACTION') {
        const p = players.find(x => x.clientId === pkt.clientId) || players.find(x => x.id === pkt.playerId);
        if (p && NET.onClientAction) NET.onClientAction(p.id, pkt.action);
      }
    }

    else {
      if (pkt.toClientId && pkt.toClientId !== myClientId) return;

      if (pkt.type === 'JOIN_ACK') {
        joinAcked = true;
        if (joinTimer) {
          clearInterval(joinTimer);
          joinTimer = null;
        }

        localPlayerId = pkt.assignedId;

        if (pkt.config) lobbyConfig = pkt.config;
        if (pkt.players) players = pkt.players;

        notifyLobbyUpdated();

        sendToHost({
          type: 'PLAYER_READY',
          playerId: localPlayerId,
          clientId: myClientId,
          ready: true
        });

        if (window.UI) UI.toast('Connected to lobby as Operator ' + (localPlayerId + 1), 'good');
      }

      else if (pkt.type === 'JOIN_REJ') {
        if (window.UI) UI.toast('Join failed: ' + (pkt.reason || 'Rejected'), 'bad');
        reset();
      }

      else if (pkt.type === 'LOBBY_STATE') {
        lobbyConfig = pkt.config;
        players = pkt.players;
        notifyLobbyUpdated();
      }

      else if (pkt.type === 'CHAT') {
        if (NET.onChatMessage) NET.onChatMessage(pkt.sender, pkt.text);
      }

      else if (pkt.type === 'GAME_START') {
        lobbyConfig = pkt.config;
        players = pkt.players;
        if (NET.onGameStart) NET.onGameStart(lobbyConfig, players, localPlayerId);
      }

      else if (pkt.type === 'STATE_SNAPSHOT') {
        if (NET.onStateSnapshot) NET.onStateSnapshot(pkt.snapshot);
      }

      else if (pkt.type === 'MATCH_END') {
        if (window.UI) UI.toast('Host ended the match', 'bad');
        reset();
        if (window.UI) UI.show('scr-menu');
      }
    }
  }

  function sendToHost(packet) {
    packet.toClientId = 'host';
    packet.fromClientId = myClientId;

    if (bc) bc.postMessage(packet);
    if (hostConn && hostConn.open) hostConn.send(packet);
    if (localTransport === 'rtc' && rtcClientChannel && rtcClientChannel.readyState === 'open') {
      try { rtcClientChannel.send(JSON.stringify(packet)); } catch (e) { console.warn('RTC client send failed', e); }
    }
  }

  function sendToClient(clientId, packet) {
    if (!clientId) return;

    packet.toClientId = clientId;

    if (bc) bc.postMessage(packet);
    if (localTransport === 'rtc') {
      Object.values(rtcHostChannels).forEach(ch => { if (ch && ch.readyState === 'open') { try { ch.send(JSON.stringify(packet)); } catch (e) {} } });
    }

    const p = players.find(x => x.clientId === clientId);
    if (p && p.peerId && clientConns[p.peerId] && clientConns[p.peerId].open) {
      clientConns[p.peerId].send(packet);
    }
  }

  function sendToSender(senderId, packet) {
    if (senderId === 'bc' && bc) {
      bc.postMessage(packet);
    } else if (clientConns[senderId]) {
      clientConns[senderId].send(packet);
    }
  }

  function broadcast(packet) {
    if (bc) bc.postMessage(packet);
    Object.values(clientConns).forEach(conn => {
      if (conn.open) conn.send(packet);
    });
    if (localTransport === 'rtc') {
      Object.values(rtcHostChannels).forEach(ch => { if (ch && ch.readyState === 'open') { try { ch.send(JSON.stringify(packet)); } catch (e) {} } });
    }
  }

  function __rtcWaitIce(pc) {
    return new Promise(resolve => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const done = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); resolve(); } };
      pc.addEventListener('icegatheringstatechange', done);
      setTimeout(() => { try { pc.removeEventListener('icegatheringstatechange', done); } catch(e) {} resolve(); }, 4000);
    });
  }
  function __rtcWireHostChannel(ch) {
    const key = 'ch_' + Math.random().toString(36).slice(2,8);
    rtcHostChannels[key] = ch;
    ch.onmessage = e => { try { const p = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; handlePacket(p, key); } catch(err) {} };
    ch.onopen = () => {
      updateNetBadge('CHROMEBOOK P2P · CONNECTED');
      broadcastLobbyState();
      if (window.UI) UI.toast('Chromebook player connected!', 'good');
    };
    ch.onclose = () => { delete rtcHostChannels[key]; };
  }
  async function rtcCreateHostOffer() {
    localTransport = 'rtc';
    if (rtcHostPc) { try { rtcHostPc.close(); } catch(e) {} }
    rtcHostPc = new RTCPeerConnection({ iceServers: [] });
    __rtcWireHostChannel(rtcHostPc.createDataChannel('isotope'));
    const offer = await rtcHostPc.createOffer();
    await rtcHostPc.setLocalDescription(offer);
    await __rtcWaitIce(rtcHostPc);
    return JSON.stringify(rtcHostPc.localDescription);
  }
  async function rtcHostApplyAnswer(answerText) {
    if (!rtcHostPc) throw new Error('Create the host connection first.');
    const ans = JSON.parse(answerText);
    await rtcHostPc.setRemoteDescription(ans);
    updateNetBadge('CHROMEBOOK P2P · CONNECTING…');
  }
  async function rtcClientMakeAnswer(offerText) {
    localTransport = 'rtc';
    if (rtcClientPc) { try { rtcClientPc.close(); } catch(e) {} }
    rtcClientPc = new RTCPeerConnection({ iceServers: [] });
    rtcClientPc.ondatachannel = e => {
      rtcClientChannel = e.channel;
      rtcClientChannel.onmessage = ev => { try { const p = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data; handlePacket(p, 'rtc-host'); } catch(err) {} };
      rtcClientChannel.onopen = () => {
        rtcClientReady = true;
        updateNetBadge('CHROMEBOOK P2P · CONNECTED');
        // JOIN_REQ is sent by the normal joinLobby retry loop.
      };
      rtcClientChannel.onclose = () => { rtcClientReady = false; };
    };
    const offer = JSON.parse(offerText);
    await rtcClientPc.setRemoteDescription(offer);
    const answer = await rtcClientPc.createAnswer();
    await rtcClientPc.setLocalDescription(answer);
    await __rtcWaitIce(rtcClientPc);
    return JSON.stringify(rtcClientPc.localDescription);
  }
  function setChromebookTransport(enabled) { localTransport = enabled ? 'rtc' : 'hybrid'; }

  function broadcastLobbyState() {
    broadcast({
      type: 'LOBBY_STATE',
      config: lobbyConfig,
      players: players
    });
  }

  function toggleReady() {
    isReady = !isReady;

    if (isHost) {
      const p = players.find(x => x.id === 0);
      if (p) p.ready = isReady;

      broadcastLobbyState();
      notifyLobbyUpdated();
    } else {
      sendToHost({
        type: 'PLAYER_READY',
        playerId: localPlayerId,
        clientId: myClientId,
        ready: isReady
      });
    }
  }

  function setMyElement(elemId) {
    myElement = DATA.canonicalId(elemId);
    const meta = entityPacket(myElement);

    if (isHost) {
      const p = players.find(x => x.id === 0);
      if (p) Object.assign(p, meta);
      broadcastLobbyState();
      notifyLobbyUpdated();
    } else {
      sendToHost(Object.assign({
        type: 'PLAYER_ELEM',
        playerId: localPlayerId,
        clientId: myClientId,
        signatureSlot: SAVE.getSignature ? SAVE.getSignature(myElement) : 0
      }, meta));
    }
  }

  function setMySignature(slot) {
    const s = Math.max(0, Math.min(2, Number(slot) || 0));
    if (SAVE.setSignature) SAVE.setSignature(myElement, s);
    if (isHost) {
      const p = players.find(x => x.id === 0); if (p) p.signatureSlot = s;
      broadcastLobbyState(); notifyLobbyUpdated();
    } else sendToHost(Object.assign({type:'PLAYER_ELEM', playerId:localPlayerId, clientId:myClientId, signatureSlot:s}, entityPacket(myElement)));
  }

  function sendClientInput(input) {
    if (isHost) return;

    sendToHost({
      type: 'CLIENT_INPUT',
      playerId: localPlayerId,
      clientId: myClientId,
      input
    });
  }

  function sendClientAction(action) {
    if (isHost) return;

    sendToHost({
      type: 'CLIENT_ACTION',
      playerId: localPlayerId,
      clientId: myClientId,
      action
    });
  }

  function setLobbyConfig(cfg) {
    if (!isHost) return;
    Object.assign(lobbyConfig, cfg);
    broadcastLobbyState();
    notifyLobbyUpdated();
  }

  function sendChat(text) {
    if (!text || !text.trim()) return;
    const packet = {
      type: 'CHAT',
      sender: myName,
      text: text.trim()
    };
    if (isHost) {
      broadcast(packet);
      if (NET.onChatMessage) NET.onChatMessage(packet.sender, packet.text);
    } else {
      sendToHost(packet);
    }
  }

  function startGame() {
    if (!isHost) return;
    const packet = {
      type: 'GAME_START',
      config: lobbyConfig,
      players: players
    };
    broadcast(packet);
    if (NET.onGameStart) NET.onGameStart(lobbyConfig, players, 0);
  }

  function broadcastSnapshot(snapshot) {
    if (!isHost) return;
    broadcast({ type: 'STATE_SNAPSHOT', snapshot: snapshot });
  }

  function notifyLobbyUpdated() {
    if (NET.onLobbyUpdate) NET.onLobbyUpdate(players, lobbyConfig, isHost, localPlayerId);
  }

  function updateNetBadge(txt) {
    const b = document.getElementById('net-status');
    if (b) b.textContent = txt;
  }

  function updateConfig(mode, pvpTargetKills, friendlyFire) {
    if (!isHost) return;
    lobbyConfig.mode = mode || lobbyConfig.mode;
    if (pvpTargetKills) lobbyConfig.pvpTargetKills = pvpTargetKills;
    if (friendlyFire !== undefined) lobbyConfig.friendlyFire = !!friendlyFire;
    broadcastLobbyState();
    notifyLobbyUpdated();
  }

  function reset() {
    if (joinTimer) {
      clearInterval(joinTimer);
      joinTimer = null;
    }

    if (bc) {
      bc.close();
      bc = null;
    }

    if (peer) {
      peer.destroy();
      peer = null;
    }
    if (rtcHostPc) { try { rtcHostPc.close(); } catch(e) {} rtcHostPc = null; }
    Object.values(rtcHostChannels).forEach(ch => { try { ch.close(); } catch(e) {} });
    rtcHostChannels = {};
    if (rtcClientPc) { try { rtcClientPc.close(); } catch(e) {} rtcClientPc = null; }
    rtcClientChannel = null; rtcClientReady = false;

    hostConn = null;
    clientConns = {};

    isHost = false;
    roomCode = null;
    localPlayerId = 0;
    players = [];
    netActive = false;
    isReady = false;
    joinAcked = false;
    myClientId = 'C' + Math.random().toString(36).slice(2, 10);

    updateNetBadge('STANDBY');
  }

  function endMatch() {
    if (!isHost) return;

    broadcast({ type: 'MATCH_END' });

    setTimeout(() => {
      reset();
    }, 80);
  }

  function leaveMatch() {
    if (isHost) {
      endMatch();
      return;
    }

    sendToHost({
      type: 'PLAYER_LEAVE',
      clientId: myClientId,
      playerId: localPlayerId
    });

    reset();
  }

  Object.assign(NET, {
    createLobby, joinLobby, toggleReady, setMyElement, setLobbyConfig, updateConfig,
    sendChat, startGame, setMySignature, sendClientInput, sendClientAction, broadcastSnapshot, reset,
    rtcCreateHostOffer, rtcHostApplyAnswer, rtcClientMakeAnswer, setChromebookTransport,
    onLobbyUpdate: null, onChatMessage: null, onGameStart: null,
    onStateSnapshot: null, onClientInput: null, onClientAction: null
  });

  Object.defineProperties(NET, {
    isHost: { get() { return isHost; }, enumerable: true, configurable: true },
    amHost: { get() { return isHost; }, enumerable: true, configurable: true },
    isInLobby: { get() { return netActive; }, enumerable: true, configurable: true },
    roomCode: { get() { return roomCode; }, enumerable: true, configurable: true },
    players: { get() { return players; }, enumerable: true, configurable: true },
    lobbyConfig: { get() { return lobbyConfig; }, enumerable: true, configurable: true },
    localPlayerId: { get() { return localPlayerId; }, enumerable: true, configurable: true },
    localId: { get() { return localPlayerId; }, enumerable: true, configurable: true },
    netActive: { get() { return netActive; }, enumerable: true, configurable: true }
  });
})();
