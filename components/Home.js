import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState, useMemo } from "react";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Mode } from '../utils/http-requests';
import { useTrafficStream } from './hooks/useTrafficStream';
import { LightTimer } from '../utils/lightTimer';

const iconSize = 60;
const timerInterval = 650;

const getSessionClientId = () => {
  return 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
};

export default function Home({ currentMode, changeMode, selectedIntersection, selectedLightGroups,
    setSelectedIntersection, setSelectedLightGroups, startPositionStream, openBaseUrlDrawer }) {
  
  const clientId = useMemo(() => getSessionClientId(), []);
  
  const [intersectionsData, setIntersectionsData] = useState(null);
  const [lightGroupsData, setLightGroupsData] = useState(null);

  const intersectionTimerRef = useRef(null);
  const lightGroupTimerRef = useRef(null);

  const streamPayload = useTrafficStream(clientId, selectedIntersection, selectedLightGroups, currentMode);

  useEffect(() => {
    if (selectedIntersection == null) return;

    if (!selectedIntersection.length) {
      return;
    }

    setSelectedLightGroups([]);
  }, [selectedIntersection]);

  useEffect(() => {
    if (selectedLightGroups == null) return;

    if (!selectedLightGroups.length) {
      return;
    }

    setSelectedIntersection([]);
  }, [selectedLightGroups]);

  const showSelectedGroups = () => {
    const selectedData = streamPayload?.data || null;

    if (selectedData == null ||Object.keys(selectedData).length == 0) {
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
                  {/*<Text style={styles.secondsText}>{light.currentTime}s/{light.estimatedChangeTime}s</Text>*/}
                  <LightTimer
                    serverTime={streamPayload?.serverTime}
                    currentTime={light.currentTime}
                    estimatedChangeTime={light.estimatedChangeTime}
                    styles={styles}
                  />
                </View>
              )
            })}
          </View>
          {selectedIntersection?.length > 0 && (
            <Text style={styles.streetName} key={key + 'i'}>{group.name}</Text>
          )}
          {selectedLightGroups?.length > 0 && (
            <Text style={styles.streetName} key={key + 'g'}>{group.displayName}</Text>
          )}
        </View>
      );
    }
    return result;
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
          name="menu"
          size={40}
          onPress={() => {
            openBaseUrlDrawer();
          }}
        />
        {currentMode === Mode.Cars && (
          <MaterialCommunityIcons
            color={'black'}
            name="car"
            size={40}
            onPress={() => {
              changeMode(Mode.Pedestrians);
            }}
          />
        )}
        {currentMode === Mode.Pedestrians && (
          <MaterialCommunityIcons
            color={'black'}
            name="walk"
            size={40}
            onPress={() => {
              changeMode(Mode.Cars);
            }}
          />
        )}
      </View>
      <ScrollView style={{height: 280}} >
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
    justifyContent: 'space-between',
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
    marginBottom: 5,
    marginTop: 10,
    flexDirection: 'row',
  },
  secondsText: {
    fontSize: 27,
    textAlign: 'center',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
  },
  streetName: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
});