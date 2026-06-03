import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getIntersectionData, getLightGroupsData } from '../utils/http-requests';

const iconSize = 55;
const timerInterval = 700;

export default function Home({ currentMode, selectedIntersection, selectedLightGroups,
    setSelectedIntersection, setSelectedLightGroups, startPositionStream, openBaseUrlDrawer }) {
  
  const [intersectionsData, setIntersectionsData] = useState(null);
  const [lightGroupsData, setLightGroupsData] = useState(null);

  const intersectionTimerRef = useRef(null);
  const lightGroupTimerRef = useRef(null);


  const stopTimer = (ref) => {
    clearInterval(ref.current);
    ref.current = null;
  };

  const startTimer = (ref, fn) => {
    stopTimer(ref);
    ref.current = setInterval(fn, timerInterval);
  };
 
  useEffect(() => {
    if (selectedIntersection?.length > 0) {
		  fetchIntersectionData();
      startTimer(intersectionTimerRef, fetchIntersectionData);
    }
    if (selectedLightGroups?.length > 0) {
      fetchLightGroupsData();
      startTimer(lightGroupTimerRef, fetchLightGroupsData);
    }
		return () => {
			stopTimer(intersectionTimerRef);
      stopTimer(lightGroupTimerRef);
		}
	}, [currentMode]);

  useEffect(() => {
    if (selectedIntersection == null) return;

    if (!selectedIntersection.length) {
      stopTimer(intersectionTimerRef); return;
    }

    setSelectedLightGroups([]);
    fetchIntersectionData();
    startTimer(intersectionTimerRef, fetchIntersectionData);
    startPositionStream();
  }, [selectedIntersection]);

  useEffect(() => {
    if (selectedLightGroups == null) return;

    if (!selectedLightGroups.length) {
      stopTimer(lightGroupTimerRef); return;
    }

    setSelectedIntersection([]);
    fetchLightGroupsData();
    startTimer(lightGroupTimerRef, fetchLightGroupsData);
    startPositionStream();
  }, [selectedLightGroups]);

  const applyFetchResult = (data, statusCode, setData, clearSelection) => {
    if (data?.error || statusCode === 304) return;
    if (!data?.length) { clearSelection([]); return; }
    setData(data);
  };

  const fetchIntersectionData = async () => {
    let [data, statusCode] = await getIntersectionData(selectedIntersection, currentMode);
    applyFetchResult(data, statusCode, setIntersectionsData, setSelectedIntersection);
  }

  const fetchLightGroupsData = async () => {
    let [data, statusCode] = await getLightGroupsData(selectedLightGroups, currentMode);
    applyFetchResult(data, statusCode, setLightGroupsData, setSelectedLightGroups);
  }

  const showSelectedGroups = () => {
    const selectedData = getSelectedData();

    if (selectedData == null || selectedData.length == 0) {
      return <Text style={[styles.containerRow, styles.text]}>-</Text>;
    }

    const result = [];

    for (const [key, group] of Object.entries(selectedData)) {
      result.push(
        <View key={'cr' + key} style={styles.containerRow}>
          <View key={'lights' + key} style={styles.lights}>
            {group.lights.map((light, index) => {
              return (
                <View key={'light' + light.id} style={styles.light}>
                  {getColoredDirectionIcon(light.type, light.state)}
                  <Text style={styles.text}>{light.state}</Text>
                  <Text style={styles.secondsText}>{light.currentTime}s/{light.estimatedChangeTime}s</Text>
                </View>
              )
            })}
          </View>
          <Text key={key}>{group.name}</Text>
        </View>
      );
    }
    return result;
  }

  const getSelectedData = () => {
    if (selectedIntersection?.length > 0) {
      return intersectionsData;
    } else if (selectedLightGroups?.length > 0) {
      return lightGroupsData;
    }
    return null;
  }

  const TYPE_ICON = { '0': 'walk', '1': 'arrow-left-circle', '2': 'arrow-up-circle', '3': 'arrow-right-circle' };

  const getColoredDirectionIcon = (type, state) => (
    <MaterialCommunityIcons
      color={getStateColor(state)}
      name={TYPE_ICON[type]}
      size={iconSize}
    />
  );

  const getStateColor = (state) => {
    if ('ABDEFGH9'.includes(state)) return 'red';
    if ('C'.includes(state)) return 'darkred';
    if (':<>0'.includes(state)) return 'orange';
    if ('135678'.includes(state)) return 'green';
    if ('4'.includes(state)) return 'limegreen';
    return 'grey';
  }

  return (
    <>
    <View style={styles.header}>
      <MaterialCommunityIcons
        color={'black'}
        name="car"
        size={40}
        onPress={() => {
          console.log("car icon pressed");
          openBaseUrlDrawer();
        }}
      />
    </View>
    <ScrollView style={{height: 350}} >
      {showSelectedGroups()}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  containerRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingVertical: 5,
    borderTopColor: '#111',
    borderTopWidth: 0,
  },
  light: {
    marginHorizontal: 5,
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.33,
  },
  lights: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  secondsText: {
    fontSize: 24,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
  }
});