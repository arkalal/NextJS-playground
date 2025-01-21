"use client";

import React, { useState } from "react";
import styles from "./GradientSwitch.module.scss";
import { Monitor, Sun, Moon } from "lucide-react";

const GradientSwitch = () => {
  const [selected, setSelected] = useState("system");
  const [prevSelected, setPrevSelected] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSelect = (mode) => {
    setIsTransitioning(true);
    setPrevSelected(selected);
    setSelected(mode);
    setTimeout(() => setIsTransitioning(false), 300); // Match transition duration
  };

  console.log("selected", selected);

  return (
    <div className={`${styles.GradientSwitch} ${styles[`theme${selected}`]}`}>
      <div className={styles.cardWrapper}>
        <div
          className={`${styles.switchContainer} ${
            styles[
              `gradient${selected.charAt(0).toUpperCase() + selected.slice(1)}`
            ]
          } ${
            prevSelected
              ? styles[
                  `from${
                    prevSelected.charAt(0).toUpperCase() + prevSelected.slice(1)
                  }`
                ]
              : ""
          } ${isTransitioning ? styles.transitioning : ""}`}
        >
          <div
            className={`${styles.option} ${
              selected === "system" ? styles.selected : ""
            }`}
            onClick={() => handleSelect("system")}
          >
            <Monitor size={13} strokeWidth={1.5} />
            <span>System</span>
          </div>
          <div
            className={`${styles.option} ${
              selected === "light" ? styles.selected : ""
            }`}
            onClick={() => handleSelect("light")}
          >
            <Sun size={13} strokeWidth={1.5} />
            <span>Light</span>
          </div>
          <div
            className={`${styles.option} ${
              selected === "dark" ? styles.selected : ""
            }`}
            onClick={() => handleSelect("dark")}
          >
            <Moon size={13} strokeWidth={1.5} />
            <span>Dark</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradientSwitch;
