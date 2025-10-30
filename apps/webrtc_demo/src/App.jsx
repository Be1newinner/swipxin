import React, { useEffect, useRef, useState } from "react";

export default function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef(null);
  const [offerSDP, setOfferSDP] = useState("");
  const [answerSDP, setAnswerSDP] = useState("");

  useEffect(() => {
    console.log(offerSDP);
  }, [offerSDP]);

  // Configuration for STUN server (Google's public STUN)
  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  async function startLocalVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;

    // Prepare RTCPeerConnection and add tracks
    pcRef.current = new RTCPeerConnection(configuration);
    stream
      .getTracks()
      .forEach((track) => pcRef.current.addTrack(track, stream));

    // When remote track arrives, show it in remote video element
    pcRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // ICE candidates are generated here, but since local manual signaling, they are ignored for brevity
  }

  // Caller creates offer and sets local description
  async function createOffer() {
    const pc = pcRef.current;
    if (!pc) return alert("Start local video first");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    setOfferSDP(JSON.stringify(pc.localDescription));
  }

  // Callee sets remote offer, creates answer, and sets local description
  async function handleOfferAndCreateAnswer() {
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Get local stream and add tracks to peer connection
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // When remote track arrives, set it to remote video
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Set remote description from offer SDP
    const offer = JSON.parse(offerSDP);
    await pc.setRemoteDescription(offer);

    // Create answer and set local description
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setAnswerSDP(JSON.stringify(pc.localDescription));
  }

  // Caller sets remote answer SDP
  async function handleAnswer() {
    const pc = pcRef.current;
    if (!pc) return alert("Create offer first");

    const answer = JSON.parse(answerSDP);
    await pc.setRemoteDescription(answer);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Basic WebRTC Video Call (Manual Signaling)</h2>

      <div>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 240, border: "1px solid black" }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: 240, border: "1px solid black", marginLeft: 20 }}
        />
      </div>

      <button onClick={startLocalVideo} style={{ marginTop: 20 }}>
        Start Local Video
      </button>

      <div style={{ marginTop: 20 }}>
        <button onClick={createOffer}>Create Offer (Caller)</button>
      </div>

      <textarea
        style={{ width: "100%", height: 100, marginTop: 10 }}
        value={offerSDP}
        onChange={(e) => setOfferSDP(e.target.value)}
        placeholder="Offer SDP"
      />

      <div>
        <button onClick={handleOfferAndCreateAnswer}>
          Set Offer and Create Answer (Callee)
        </button>
      </div>

      <textarea
        style={{ width: "100%", height: 100, marginTop: 10 }}
        value={answerSDP}
        onChange={(e) => setAnswerSDP(e.target.value)}
        placeholder="Answer SDP"
      />

      <div>
        <button onClick={handleAnswer}>Set Answer (Caller)</button>
      </div>
    </div>
  );
}
