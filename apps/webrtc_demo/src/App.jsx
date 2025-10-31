import React, { useRef, useState, useEffect } from "react";

export default function App() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef(null);
  const wsRef = useRef(null);

  const [clientId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [targetId, setTargetId] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Connect to signaling server
  useEffect(() => {
    wsRef.current = new WebSocket("ws://192.168.0.128:3001");

    wsRef.current.onopen = () => {
      console.log("Connected to signaling server");
      wsRef.current.send(
        JSON.stringify({
          type: "register",
          clientId,
        })
      );
    };

    wsRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "offer":
          await handleOffer(message.data, message.from);
          break;
        case "answer":
          await handleAnswer(message.data);
          break;
        case "ice-candidate":
          await handleIceCandidate(message.data);
          break;
      }
    };

    return () => wsRef.current?.close();
  }, [clientId]);

  async function startCall() {
    if (!targetId) return alert("Enter target peer ID");

    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;

    // Setup peer connection
    pcRef.current = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, stream);
    });

    pcRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            target: targetId,
            data: event.candidate,
          })
        );
      }
    };

    // Create and send offer
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);

    wsRef.current.send(
      JSON.stringify({
        type: "offer",
        target: targetId,
        data: offer,
      })
    );
  }

  async function handleOffer(offer, from) {
    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;

    // Setup peer connection
    pcRef.current = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, stream);
    });

    pcRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
      setIsConnected(true);
    };

    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            target: from,
            data: event.candidate,
          })
        );
      }
    };

    // Set remote offer and create answer
    await pcRef.current.setRemoteDescription(offer);
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);

    wsRef.current.send(
      JSON.stringify({
        type: "answer",
        target: from,
        data: answer,
      })
    );

    setTargetId(from);
    setIsConnected(true);
  }

  async function handleAnswer(answer) {
    await pcRef.current.setRemoteDescription(answer);
    setIsConnected(true);
  }

  async function handleIceCandidate(candidate) {
    await pcRef.current?.addIceCandidate(candidate);
  }

  function endCall() {
    pcRef.current?.close();
    pcRef.current = null;
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setIsConnected(false);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>WebRTC Video Call with Auto Signaling</h2>

      <div
        style={{
          marginBottom: 20,
          padding: 10,
          background: "#50bb55",
          borderRadius: 5,
        }}
      >
        <strong>Your ID:</strong> {clientId}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter peer ID to call"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <button
          onClick={startCall}
          disabled={isConnected}
          style={{ padding: 8 }}
        >
          Start Call
        </button>
        <button
          onClick={endCall}
          disabled={!isConnected}
          style={{ padding: 8, marginLeft: 10 }}
        >
          End Call
        </button>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <h4>Local Video</h4>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 320, border: "2px solid #333", borderRadius: 8 }}
          />
        </div>
        <div>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: 320, border: "2px solid #333", borderRadius: 8 }}
          />
        </div>
      </div>

      {isConnected && (
        <div style={{ marginTop: 20, color: "green", fontWeight: "bold" }}>
          ✓ Connected
        </div>
      )}
    </div>
  );
}
