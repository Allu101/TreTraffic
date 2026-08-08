import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

export const LightTimer = ({ serverTime, currentTime, estimatedChangeTime = 0, styles }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!currentTime) return;

    // 1. Varmistetaan että kaikki arvot ovat SEKUNTEINA (muunnetaan ms -> s jos > 1e11)
    const serverSec = serverTime 
      ? (serverTime > 1e11 ? Math.floor(serverTime / 1000) : serverTime) 
      : Math.floor(Date.now() / 1000);
    
    const currentSec = currentTime > 1e11 ? Math.floor(currentTime / 1000) : currentTime;

    const deviceSec = Math.floor(Date.now() / 1000);
    const clockOffsetSec = serverSec - deviceSec;

    // 3. Päivitetään kulunut aika suoraan sekunteina
    const updateTimer = () => {
      const nowDeviceSec = Math.floor(Date.now() / 1000);
      const nowServerSec = nowDeviceSec + clockOffsetSec;
      const elapsedSec = nowServerSec - currentSec;

      setElapsed(elapsedSec > 0 ? elapsedSec : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [serverTime, currentTime]);

  return (
    <Text style={styles.secondsText}>
      {elapsed}s/{estimatedChangeTime || 0}s
    </Text>
  );
};

export default LightTimer;