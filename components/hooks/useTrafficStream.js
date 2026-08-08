import { useEffect, useState } from 'react';
import EventSource from 'react-native-sse';
import { getBaseUrl } from '../../utils/http-requests';
import { updateStream } from '../../utils/http-requests';

export const useTrafficStream = (clientId, selectedIntersection, selectedLightGroups, currentMode) => {
  const [streamData, setStreamData] = useState(null);

  // 1. Avataan SSE-yhteys kerran clientId:n perusteella
  useEffect(() => {
    if (!clientId) return;
    const es = new EventSource(`${getBaseUrl()}intersections/stream?clientId=${clientId}`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
        Accept: 'text/event-stream',
      },
    });

    es.addEventListener('message', (event) => {
      if (event.data) {
        const update = JSON.parse(event.data);
        setStreamData(update); //{ data, serverTime }
      }
    });

    return () => es.close();
  }, []);

  // 2. Päivitetään tilaus aina kun aktiiviset valinnat muuttuvat
  useEffect(() => {
    let type = null;
    let params = null;

    if (selectedIntersection && selectedIntersection.length > 0) {
      type = 'intersection';
      params = selectedIntersection;
    } else if (selectedLightGroups && selectedLightGroups.length > 0) {
      type = 'lightGroups';
      params = selectedLightGroups;
    }

    if (!type) {
      setStreamData(null);
      return;
    }

    updateStream(clientId, type, params, currentMode);

  }, [clientId, selectedIntersection, selectedLightGroups, currentMode]);

  return streamData;
};