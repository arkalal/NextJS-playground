"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./VoiceChat.module.scss";
import CustomWave from "../CustomWave/CustomWave";
import { IoMdCall } from "react-icons/io";
import { ImPhoneHangUp } from "react-icons/im";

const VoiceChat = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);
  const audioRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Handle incoming messages over the DataChannel.
  const handleServerMessage = async (e) => {
    const event = JSON.parse(e.data);
    console.log("Server event:", event);

    // --- Speech detection events ---
    if (event.type === "input_audio_buffer.speech_started") {
      setIsUserSpeaking(true);
    } else if (event.type === "input_audio_buffer.speech_stopped") {
      setIsUserSpeaking(false);
    }

    // --- AI speaking (audio delta means the AI is actively speaking) ---
    if (event.type === "response.audio.delta") {
      setIsAISpeaking(true);
    } else if (event.type === "response.done") {
      setIsAISpeaking(false);
    }

    // --- AI text tokens ---
    if (event.type === "response.text.delta") {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + event.delta },
          ];
        }
        // Start a new assistant message
        return [...prev, { role: "assistant", content: event.delta }];
      });
    }

    // --- User transcript from microphone ---
    if (event.type === "input_audio_buffer.transcript") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: event.transcript },
      ]);
    }

    // --- Handle function calls when the response is done ---
    if (
      event.type === "response.done" &&
      event.response.output?.[0]?.type === "function_call"
    ) {
      const functionCall = event.response.output[0];

      switch (functionCall.name) {
        case "get_training_data":
          try {
            const response = await fetch("/api/train");
            const data = await response.json();

            // Send back function call result with the correct structure
            dataChannel.current.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "function_call_output",
                  call_id: functionCall.call_id,
                  // Wrap your result in JSON string
                  output: JSON.stringify({
                    training_status: data.message,
                  }),
                },
              })
            );

            // Tell the AI to produce a final response (text and audio if you want voice)
            dataChannel.current.send(
              JSON.stringify({
                type: "response.create",
                response: {
                  modalities: ["audio", "text"],
                },
              })
            );
          } catch (error) {
            console.error("Error fetching training data:", error);
          }
          break;

        case "get_project_stats":
          try {
            const stats = {
              projects: {
                total: 50,
                completed: 45,
                ongoing: 5,
              },
              clients: {
                total: 40,
                active: 35,
              },
            };

            // Return the stats to the AI
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

            // Let the AI produce its final response
            dataChannel.current.send(
              JSON.stringify({
                type: "response.create",
                response: {
                  modalities: ["audio", "text"],
                },
              })
            );
          } catch (error) {
            console.error("Error with project stats:", error);
          }
          break;

        default:
          console.warn("Unknown function call:", functionCall.name);
      }
    }

    // --- (IMPORTANT) Handle function_call_output events so they appear in your UI ---
    if (
      event.type === "conversation.item" &&
      event.item?.type === "function_call_output"
    ) {
      try {
        const output = JSON.parse(event.item.output);
        // For example, if it's training data:
        if (output.training_status) {
          // Append it as an AI message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Here is your training data: ${output.training_status}`,
            },
          ]);
        } else {
          // Generic fallback if there's other data
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: JSON.stringify(output),
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing function_call_output:", err);
      }
    }
  };

  const agencyKnowledge = `You are a smart and professional AI assistant for arkalalchakravarty.com. You were developed by Arka Lal Chakravarty, not by OpenAI or ChatGPT. You help potential clients understand our services and capabilities.\n\nCore Services:\n- Website/MVP Planning, Design & Development with excellent speed and SEO optimization\n- Full Deployment and Maintenance with relentless optimization\n- Custom AI Automations & Integrations\n- React/Next.js Development\n- SEO and Performance Optimization\n\nTechnical Stack:\n- NextJS\n- MongoDB\n- React\n- Node.js\n- Vercel\n- Custom AI solutions\n\nKey Features:\n- AI-Powered Website Development\n- High-Performance & SEO Optimized Websites\n- Custom AI Automations & Chatbots\n- Full Maintenance & Support\n\nHow It Works:\n1. Initial Consultation\n   - Book a call with us\n   - We explore and research your idea\n   - Understand your vision in detail\n\n2. MVP Planning & Development\n   - Get a detailed development plan\n   - Development begins after proposal signing\n\n3. On-time Project Delivery\n   - Receive fully functional MVP\n   - All planned features implemented\n   - Ready for official launch\n\n4. Continuous Maintenance & Support\n   - Unlimited maintenance support\n   - Critical bug fixes\n   - Access to our workspace for support\n\nPricing:\n- Development Bundle (One Time): $2,000\n- Retainer Bundle (Monthly Recurring): $3,000/month\n\nDevelopment Bundle includes:\n- Full access to all features\n- React/Next.js code\n- One Custom AI automation\n- One AI Agent & Chatbot\n- One MVP, Website, AI App and Sass development\n- Unlimited Custom React Components\n- Unlimited Revisions\n- Search Engine Optimization\n- 24-hour support response time\n- Full Access to private Google workspace\n- Full Access to Email marketing automations\n\nRetainer Bundle includes:\n- 80 hours of development time per month\n- React/Next.js code\n- Unlimited Custom AI automations\n- Unlimited AI Agents & Chatbots\n- Unlimited MVPs, Website, AI Apps and Sass development\n- Unlimited Custom React Components\n- Unlimited Revisions\n- Search Engine Optimization\n- 24-hour support response time\n- Full Access to private Google workspace\n- Full Access to Email marketing automations\n\nUse professional emojis appropriately and keep responses brief, precise, and focused on our services. Format responses properly using markdown. Never make up information not provided above. If asked about something outside this scope, politely state you can only provide information about our services and technology offerings. If the user asks for contacting us, ask them to click the 'Book a Call' button and schedule a meeting with the founder. Make sure you give the training data by using the function get_training_data if the user asks about it.`;

  const playAgent = `Your name is Jordan, and you are an expert in sales. Your job is to sell a hight ticket stock to the client worth $10,000. You have to convince the client to buy the stock by explaining the benefits and the potential return on investment. You have to be persuasive and confident in your approach. You have to make the client feel that they are making the right decision by investing in the stock. You have to use your sales skills to close the deal and make the client feel that they are getting a great deal. You have to be professional and knowledgeable about the stock and the market. You have to be able to answer any questions the client may have and address any concerns they may have. You have to be able to overcome any objections the client may have and close the deal. You have to be able to build rapport with the client and make them feel comfortable and confident in their decision to buy the stock. Always introduce yourself and impress the clients but never say you are a salesman.`;

  // Configure your system instructions and function definitions
  const configureAISettings = (dc) => {
    const systemConfig = {
      type: "session.update",
      session: {
        instructions: `${playAgent}`,
      },
    };

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
          {
            type: "function",
            name: "get_training_data",
            description: "Get the training data is the user asks for it",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        ],
        tool_choice: "auto",
      },
    };

    // Send instructions first
    dc.send(JSON.stringify(systemConfig));
    // Then register your functions
    dc.send(JSON.stringify(functionConfig));
  };

  const initializeWebRTC = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get ephemeral token
      const tokenResponse = await fetch("/api/realtime-token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // Handle remote audio
      audioRef.current.autoplay = true;
      pc.ontrack = (e) => {
        audioRef.current.srcObject = e.streams[0];
      };

      // Add user mic audio track
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      mediaStreamRef.current = mediaStream;
      pc.addTrack(mediaStream.getTracks()[0]);

      // Create data channel
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      dc.onopen = () => {
        console.log("Data channel opened");
        configureAISettings(dc); // set system & function definitions
      };
      dc.onclose = () => console.log("Data channel closed");
      dc.onerror = (error) => {
        console.error("Data channel error:", error);
        setError("Data channel error: " + error.message);
      };

      // Listen for server messages
      dc.addEventListener("message", handleServerMessage);

      // Create local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI Realtime
      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        }
      );
      const answerSdp = await sdpResponse.text();

      // Accept answer
      const answer = {
        type: "answer",
        sdp: answerSdp,
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
      peerConnection.current = null;
    }
    if (audioRef.current?.srcObject) {
      audioRef.current.srcObject.getTracks().forEach((track) => track.stop());
      audioRef.current.srcObject = null;
    }
    setIsConnected(false);
    setMessages([]);
    setIsUserSpeaking(false);
    setIsAISpeaking(false);
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new window.Audio();
    }
  }, []);

  return (
    <div className={styles.VoiceChat}>
      <h4>Voice AI Agent @ arkalalchakravarty.com</h4>

      <div className={styles.voiceChatContainer}>
        <div className={styles.phoneNumber}>
          {" "}
          <span>+1 312 270 8339</span> <br /> <span>AI Voice Agent</span>
        </div>

        {isConnected && (
          <div className={styles.chatContent}>
            <div className={styles.visualizers}>
              <CustomWave
                isActive={isUserSpeaking}
                isUser={true}
                stream={mediaStreamRef.current}
              />
              <CustomWave isActive={isAISpeaking} isUser={false} />
            </div>
          </div>
        )}

        <div className={styles.controls}>
          {!isConnected ? (
            <button
              onClick={initializeWebRTC}
              disabled={isConnecting}
              className={styles.startButton}
            >
              {isConnecting ? (
                "Connecting..."
              ) : (
                <>
                  <IoMdCall /> Call Now
                </>
              )}
            </button>
          ) : (
            <button onClick={cleanup} className={styles.endButton}>
              <ImPhoneHangUp />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
