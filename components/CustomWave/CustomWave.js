"use client";

import React, { useEffect, useRef } from "react";
import styles from "./CustomWave.module.scss";

const CustomWave = ({ isActive, isUser = true, stream = null }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    // Initialize audio context and analyser
    const initAudio = () => {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      if (stream) {
        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
      }
    };

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    if (!audioContextRef.current) {
      initAudio();
    }

    const drawWave = () => {
      animationFrameRef.current = requestAnimationFrame(drawWave);

      const analyser = analyserRef.current;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Style for wave
      ctx.lineWidth = 2;
      ctx.strokeStyle = isUser ? "#000000" : "#2563eb";
      ctx.beginPath();

      const sliceWidth = WIDTH / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * HEIGHT) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Add gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "rgba(255,255,255,0.2)");
      gradient.addColorStop(1, "rgba(255,255,255,0.4)");
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // If no stream, create oscillator for demo effect
    if (!stream) {
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        440,
        audioContextRef.current.currentTime
      );

      sourceRef.current = oscillator;
      sourceRef.current.connect(analyserRef.current);
      oscillator.start();
    }

    drawWave();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current && !stream) {
        sourceRef.current.stop?.();
        sourceRef.current.disconnect();
      }
    };
  }, [isActive, isUser, stream]);

  return (
    <div className={`${styles.waveContainer} ${isActive ? styles.active : ""}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className={styles.waveCanvas}
      />
    </div>
  );
};

export default CustomWave;
