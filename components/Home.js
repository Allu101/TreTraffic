import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React, { useEffect } from "react";
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getIntersectionData, getLightGroupsData } from '../utils/http-requests';

const iconSize = 70;
const timerInterval = 1000;

let intersectionTimerId = null;
let lightGroupTimerId = null;

export default function Home({ intersectionsData, lightGroupsData,
    selectedIntersection, selectedLightGroups, setIntersectionsData,
    setLightGroupsData, setSelectedIntersection, setSelectedLightGroups, startPositionStream }) {

  const isFocused = useIsFocused();
 
  useEffect(() => {
    if (selectedIntersection.length > 0) {
		  restartIntersectionTimer(isFocused);
    }
    if (selectedLightGroups.length > 0) {
      restartLightGroupTimer(isFocused);
    }
		return () => {
			clearInterval(intersectionTimerId);
      clearInterval(lightGroupTimerId);
		}
	}, [isFocused]);

  useEffect(() => {
    if (selectedIntersection == null) return;

    if (selectedIntersection.length == 0) {
      clearInterval(intersectionTimerId);
      return;
    }
    if (selectedLightGroups.length > 0) {
      setSelectedLightGroups([]);
      return;
    }

    if (isFocused) {
      restartIntersectionTimer(true);
    }
    startPositionStream();
    fetchIntersectionData();
  }, [selectedIntersection]);

  useEffect(() => {
    if (selectedLightGroups == null) return;

    if (selectedLightGroups.length == 0) {
      clearInterval(lightGroupTimerId);
      return;
    }
    if (selectedIntersection.length > 0) {
      setSelectedIntersection([]);
      return;
    }

    if (isFocused) {
      restartLightGroupTimer(true);
    }
    startPositionStream();
    fetchLightGroupsData();
  }, [selectedLightGroups]);

  const fetchIntersectionData = async () => {
    let data = await getIntersectionData(selectedIntersection);
    if (data.error) {
      return;
    }
    if (data == undefined || data.length == 0) {
      setSelectedIntersection([]);
      return;
    }
    setIntersectionsData(data);
  }

  const fetchLightGroupsData = async () => {
    let data = await getLightGroupsData(selectedLightGroups);
    if (data.error) {
      return;
    }
    if (data == undefined || data.length == 0) {
      setSelectedLightGroups([]);
      return;
    }
    setLightGroupsData(data);
  }

  const restartIntersectionTimer = (isFocused) => {
		if (isFocused) {
      fetchIntersectionData();
      if (intersectionTimerId) {
        clearInterval(intersectionTimerId);
      }
			intersectionTimerId = setInterval(() => {
				fetchIntersectionData();
			}, timerInterval);
		} else {
			clearInterval(intersectionTimerId);
		}
	}

  const restartLightGroupTimer = (isFocused) => {
		if (isFocused) {
      fetchLightGroupsData();
      if (lightGroupTimerId) {
        clearInterval(lightGroupTimerId);
      }
			lightGroupTimerId = setInterval(() => {
				fetchLightGroupsData();
			}, timerInterval);
		} else {
			clearInterval(lightGroupTimerId);
		}
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
                <View key={'light' + index} style={styles.light}>
                  {getColoredDirectionIcon(light.type, light.state)}
                  <Text style={styles.text}>{light.state}</Text>
                  <Text style={styles.secondsText}>
                    {light.currentTime}s/{light.estimatedChangeTime}s</Text>
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

  const getColoredDirectionIcon = (type, state) => {
    switch (type) {
      case '0':
        return (
          <MaterialCommunityIcons
            color={getStateColor(state)}
            name="walk"
            size={iconSize} 
          />
        );
      case '1':
        return (
          <MaterialCommunityIcons
            color={getStateColor(state)}
            name="arrow-left-circle"
            size={iconSize} 
          />
        );
      case '2':
        return (
          <MaterialCommunityIcons
            color={getStateColor(state)}
            name="arrow-up-circle"
            size={iconSize} 
          />
        );
      case '3':
        return (
          <MaterialCommunityIcons
            color={getStateColor(state)}
            name="arrow-right-circle"
            size={iconSize} 
          />
        );
    }
  }

  const getStateColor = (state) => {
    if ("ABDEFGH9".includes(state)) return 'red';
    if ("C".includes(state)) return 'darkred';
    if (":<>0".includes(state)) return 'orange';
    if ("135678".includes(state)) return 'green';
    if ("4".includes(state)) return 'limegreen';
    return 'grey';
  }

  return (
    <>
    <View style={styles.container}>
      <MaterialCommunityIcons
        color={'black'}
        name="car"
        size={40}
        onPress={() => {
          console.log("car icon pressed");
        }}
      />
    </View>
    <ScrollView >
      {showSelectedGroups()}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    padding: 5,
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
    marginHorizontal: '2%',
    alignItems: 'center',
  },
  lights: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  secondsText: {
    fontSize: 28,
    textAlign: 'center',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  }
});