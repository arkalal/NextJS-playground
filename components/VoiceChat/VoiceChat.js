"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./VoiceChat.module.scss";

const VoiceChat = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const audioRef = useRef(new window.Audio());

  const handleServerMessage = async (e) => {
    const event = JSON.parse(e.data);
    console.log("Server event:", event);

    if (
      event.type === "response.done" &&
      event.response.output?.[0]?.type === "function_call"
    ) {
      const functionCall = event.response.output[0];

      if (functionCall.name === "get_project_stats") {
        try {
          const response = await fetch("/api/project-stats");
          const stats = await response.json();

          dataChannel.current.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: functionCall.call_id,
                output: JSON.stringify(stats),
              },
            })
          );

          dataChannel.current.send(
            JSON.stringify({
              type: "response.create",
            })
          );
        } catch (error) {
          console.error("Error fetching stats:", error);
        }
      }
    }
  };

  const configureAISettings = (dc) => {
    // System instructions
    const systemConfig = {
      type: "session.update",
      session: {
        instructions:
          "You are a smart and professional AI assistant for arkalalchakravarty.com. You were developed by Arka Lal Chakravarty, not by OpenAI or ChatGPT. You help potential clients understand our services and capabilities.\n\nCore Services:\n- Website/MVP Planning, Design & Development with excellent speed and SEO optimization\n- Full Deployment and Maintenance with relentless optimization\n- Custom AI Automations & Integrations\n- React/Next.js Development\n- SEO and Performance Optimization\n\nTechnical Stack:\n- NextJS\n- MongoDB\n- React\n- Node.js\n- Vercel\n- Custom AI solutions\n\nKey Features:\n- AI-Powered Website Development\n- High-Performance & SEO Optimized Websites\n- Custom AI Automations & Chatbots\n- Full Maintenance & Support\n\nHow It Works:\n1. Initial Consultation\n   - Book a call with us\n   - We explore and research your idea\n   - Understand your vision in detail\n\n2. MVP Planning & Development\n   - Get a detailed development plan\n   - Development begins after proposal signing\n\n3. On-time Project Delivery\n   - Receive fully functional MVP\n   - All planned features implemented\n   - Ready for official launch\n\n4. Continuous Maintenance & Support\n   - Unlimited maintenance support\n   - Critical bug fixes\n   - Access to our workspace for support\n\nPricing:\n- Development Bundle (One Time): $2,000\n- Retainer Bundle (Monthly Recurring): $3,000/month\n\nDevelopment Bundle includes:\n- Full access to all features\n- React/Next.js code\n- One Custom AI automation\n- One AI Agent & Chatbot\n- One MVP, Website, AI App and Sass development\n- Unlimited Custom React Components\n- Unlimited Revisions\n- Search Engine Optimization\n- 24-hour support response time\n- Full Access to private Google workspace\n- Full Access to Email marketing automations\n\nRetainer Bundle includes:\n- 80 hours of development time per month\n- React/Next.js code\n- Unlimited Custom AI automations\n- Unlimited AI Agents & Chatbots\n- Unlimited MVPs, Website, AI Apps and Sass development\n- Unlimited Custom React Components\n- Unlimited Revisions\n- Search Engine Optimization\n- 24-hour support response time\n- Full Access to private Google workspace\n- Full Access to Email marketing automations\n\nUse professional emojis appropriately and keep responses brief, precise, and focused on our services. Format responses properly using markdown. Never make up information not provided above. If asked about something outside this scope, politely state you can only provide information about our services and technology offerings. If the user asks for contacting us, ask them to click the 'Book a Call' button and schedule a meeting with the founder.",
      },
    };

    // Function configuration
    const functionConfig = {
      type: "session.update",
      session: {
        tools: [
          {
            type: "function",
            name: "get_project_stats",
            description:
              "Get statistics about our completed projects and clients",
            parameters: {
              type: "object",
              properties: {
                metric: {
                  type: "string",
                  enum: ["projects", "clients", "technologies"],
                  description: "The type of statistics to retrieve",
                },
              },
              required: ["metric"],
            },
          },
        ],
        tool_choice: "auto",
      },
    };

    // Send configurations
    dc.send(JSON.stringify(systemConfig));
    console.log("System message sent");

    dc.send(JSON.stringify(functionConfig));
    console.log("Function configuration sent");
  };

  const initializeWebRTC = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get ephemeral token
      const tokenResponse = await fetch("/api/realtime-token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // Setup audio output
      audioRef.current.autoplay = true;
      pc.ontrack = (e) => {
        audioRef.current.srcObject = e.streams[0];
      };

      // Add local audio track
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(mediaStream.getTracks()[0]);

      // Setup data channel
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // Configure event handlers
      dc.onopen = () => {
        console.log("Data channel opened");
        configureAISettings(dc);
      };

      dc.onclose = () => {
        console.log("Data channel closed");
      };

      dc.onerror = (error) => {
        console.error("Data channel error:", error);
        setError("Data channel error: " + error.message);
      };

      dc.addEventListener("message", handleServerMessage);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsConnected(true);
    } catch (err) {
      console.error("WebRTC initialization error:", err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const cleanup = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (audioRef.current.srcObject) {
      audioRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsConnected(false);
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className={styles.VoiceChat}>
      <div className={styles.voiceChatContainer}>
        {!isConnected ? (
          <button
            onClick={initializeWebRTC}
            disabled={isConnecting}
            className={styles.startButton}
          >
            {isConnecting ? "Connecting..." : "Start Voice Chat"}
          </button>
        ) : (
          <button onClick={cleanup} className={styles.endButton}>
            End Call
          </button>
        )}

        {error && <div className={styles.error}>Error: {error}</div>}

        {isConnected && (
          <div className={styles.success}>
            Connected! You can start speaking.
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceChat;
