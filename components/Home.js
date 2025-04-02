import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getIntersectionData } from '../utils/http-requests';

const iconSize = 70;

export default function Home({ intersectionsData, selectedIntersection, selectedLightGroups, setIntersectionsData, setSelectedIntersection }) {

  const isFocused = useIsFocused();
  let intervalId = null;

  useEffect(() => {
    if (selectedIntersection == null) return;

		startTimer(isFocused);
		return () => {
			clearInterval(intervalId);
		}
	}, [isFocused]);

  useEffect(() => {
    if (selectedIntersection == null) return;
    
    fetchIntersectionData();
  }, [selectedIntersection]);

  const startTimer = (isFocused) => {
		if (isFocused) {
      fetchIntersectionData();
      if (intervalId) {
        clearInterval(intervalId);
      }
			intervalId = setInterval(() => {
				fetchIntersectionData();
			}, 600);
		} else {
			clearInterval(intervalId);
		}
	}

  const fetchIntersectionData = async () => {
    let data = await getIntersectionData(selectedIntersection);
    if (data.error || data.length == 0) {
      setSelectedIntersection(null);
      return;
    }
    setIntersectionsData(data);
  }

  const showSelectedGroups = () => {
    if (intersectionsData == null || intersectionsData.length == 0) {
      return <Text style={[styles.containerRow, styles.text]}>-</Text>;
    }

    const result = [];

    for (const [key, group] of Object.entries(intersectionsData)) {
      result.push(
        <View key={'cr' + key} style={styles.containerRow}>
          <View key={'lights' + key} style={styles.lights}>
            {group.lights.map((light, index) => {
              return (
                <View key={'light' + index} style={styles.light}>
                  {getColoredDirectionIcon(light.type, light.state)}
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
    marginHorizontal: '7%',
    alignItems: 'center',
  },
  lights: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
  }
});