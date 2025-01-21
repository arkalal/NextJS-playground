import React from "react";
import styles from "./ConversationDisplay.module.scss";

const ConversationDisplay = ({ messages }) => {
  return (
    <div className={styles.conversationDisplay}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`${styles.message} ${
            message.role === "user" ? styles.userMessage : styles.aiMessage
          }`}
        >
          <div className={styles.messageHeader}>
            {message.role === "user" ? "👤 You" : "🤖 AI"}
          </div>
          <div className={styles.messageContent}>{message.content}</div>
        </div>
      ))}
    </div>
  );
};

export default ConversationDisplay;
