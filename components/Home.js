import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from "react";
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getIntersectionData, getLightGroupsData } from '../utils/http-requests';

const iconSize = 70;
const timerInterval = 1000;

export default function Home({ intersectionsData, lightGroupsData,
    selectedIntersection, selectedLightGroups, setIntersectionsData,
    setLightGroupsData, setSelectedIntersection, setSelectedLightGroups}) {

  const isFocused = useIsFocused();
  let intersectionTimerId = null;
  let lightGroupTimerId = null;

  useEffect(() => {
    if (selectedIntersection != null) {
		  startIntersectionTimer(isFocused);
    }
    if (selectedLightGroups != null) {
      startLightGroupTimer(isFocused);
    }
		return () => {
			clearInterval(intersectionTimerId);
      clearInterval(lightGroupTimerId);
		}
	}, [isFocused]);

  useEffect(() => {
    if (selectedIntersection == null) return;
    
    if (selectedLightGroups != null) {
      setSelectedLightGroups(null);
    }
    fetchIntersectionData();
  }, [selectedIntersection]);

  useEffect(() => {
    if (selectedLightGroups == null) return;

    if (selectedIntersection != null) {
      setSelectedIntersection(null);
    }
    fetchLightGroupsData();
  }, [selectedLightGroups]);

  const fetchIntersectionData = async () => {
    let data = await getIntersectionData(selectedIntersection);
    if (data == null || data.length == 0) {
      setSelectedIntersection(null);
      return;
    }
    setIntersectionsData(data);
  }

  const fetchLightGroupsData = async () => {
    let data = await getLightGroupsData(selectedLightGroups);
    if (data == null || data.length == 0) {
      setSelectedLightGroups(null);
      return;
    }
    setLightGroupsData(data);
  }

  const startIntersectionTimer = (isFocused) => {
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

  const startLightGroupTimer = (isFocused) => {
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
    if (selectedIntersection != null && selectedIntersection.length > 0) {
      return intersectionsData;
    } else if (lightGroupsData != null && lightGroupsData.length > 0) {
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
    if (":<0".includes(state)) return 'orange';
    if ("1345678".includes(state)) return 'green';
    return 'grey';
  }

  return (
    <View style={styles.container}>
      {showSelectedGroups()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 60,
  },
  containerRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingVertical: 10,
    borderTopColor: '#111',
    borderTopWidth: 1,
  },
  light: {
    marginHorizontal: '5%',
    alignItems: 'center',
  },
  lights: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  secondsText: {
    fontSize: 26,
    textAlign: 'center',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  }
});