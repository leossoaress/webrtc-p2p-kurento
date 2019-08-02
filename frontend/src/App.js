import React, {useState, useEffect} from 'react';

import {Connection} from './services/api';
import {peerConnectionConfig, constraints} from './configs/peer2peer';

const App = () => {

  let localVideo = null;
  let localStream = null;
  let remoteVideo = null;
  let peerConnection = null;
  let gumStream = null;
  let track = null;
  let arrivesdp = false;

  let [username, setUsername] = useState('');
  let [peer, setPeer] = useState('');
  let [state, setState] = useState('off');

  useEffect(() => {
    init();
  });

  const handlerUsername = (event) => {
    event.preventDefault();
    setUsername(event.target.value);
  }

  const handlePeer = (event) => {
    event.preventDefault();
    setPeer(event.target.value);
  }

  const handleUsernameSubmit = (event) => {
    event.preventDefault();
    let message = {
      id : 'register',
		  name : username
    }
    sendMessage(message);
  }

  function handlePeerSubmit(event) {
    event.preventDefault();
    let message = {
      id : 'call',
      from: username,
		  to : peer
    }
    sendMessage(message);
    startCall(true);
  }

  const sendMessage = (message) => {
    let msg = JSON.stringify(message);
    console.log('Sending message: ' + msg);
    Connection.send(msg);
  }

  const init = () => {
    localVideo = document.getElementById('local_video');
    remoteVideo = document.getElementById('remote_video');
    Connection.onmessage = handleMessageFromServer;
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
  }

  const handleMessageFromServer = (message) => {

    let msg = JSON.parse(message.data);
    console.log(msg);

    switch(msg.id) {

      case 'response_register':
        registerResponse(msg);
        break;
      
      case 'response_call':
        responseCall();
        break;

      case 'incoming_call':
        incomingCall(msg);
        break;
      
      case 'ice': 
        addIceCandidate(msg);
        break;

      case 'sdp': 
        addSdp(msg);
        break;

      default: 
        break;

    }

  }

  const registerResponse = (message) => {
    if(message.text === 'accepted') {
      setState('ready');
    }
  }

  const responseCall = (message) => {
  }

  function incomingCall(message) {
    peer = message.from;
    startCall(false);
  }

  const addIceCandidate = (message) => {
    console.log('Recebendo ICE de ' + peer);
    peerConnection.addIceCandidate(new RTCIceCandidate(message.ice)).catch(errorHandler);;
  }

  const addSdp = async (message) => {
    console.log('Recebendo SDP de ' + message.sdp.type + ' de ' + peer);
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
      if(message.sdp.type === 'offer') {
        peerConnection.createAnswer().then(createSDP);
      }
    }).catch(errorHandler);;
  }

  const getUserMediaSucess = (stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
    //stream.getTracks().forEach(track => {peerConnection.addTrack(track, stream)});
  }

  function startCall(isCaller) {
    navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSucess).then(() => {
      peerConnection.onicecandidate = gotIceCandidate;
      peerConnection.ontrack = gotRemoteStream;
      peerConnection.addStream(localStream);

      if(isCaller) {
        peerConnection.createOffer().then(createSDP).catch(errorHandler);;
      }
    });
  }

  const gotIceCandidate = (event) => {
    if(event.candidate != null) {
      console.log('Enviando ICE para: ' + peer);
      Connection.send(JSON.stringify({id:'ice', to:peer, 'ice': event.candidate}));
    }
  }

  const gotRemoteStream = (event) => {
    console.log('got remote stream');
    remoteVideo.srcObject = event.streams[0];
  }

  const createSDP = (description) => {
    peerConnection.setLocalDescription(description).then(() => {  
      console.log('Enviando SDP de ' + peerConnection.localDescription.type + ' para ' + peer);
      Connection.send(JSON.stringify({id:'sdp', to:peer, 'sdp': peerConnection.localDescription}));
    }).catch(errorHandler);;
  }

  function errorHandler(error) {
    console.log(error);
  }

  return (
    <div className="App">
      
      <h1>WebRTC Peer to Peer</h1>
      
      <form onSubmit={handleUsernameSubmit}>
        <label>
          Nome:
          <input type="text" name="name" value={username} onChange={handlerUsername}/>
        </label>
        <input type="submit" value="Enviar" />
      </form>

      <form onSubmit={handlePeerSubmit}>
        <label>
          Peer:
          <input type="text" name="name" value={peer} onChange={handlePeer}/>
        </label>
        <input type="submit" value="Ligar" />
      </form>

      <video id='local_video' autoPlay muted />
      <video id='remote_video' autoPlay/>
    </div>
  );
}

export default App;
