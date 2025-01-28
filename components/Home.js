import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';
import MatCommIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getIntersectionData } from '../utils/http-requests';

const iconSize = 70;

export default function Home({ selectedLightGroups }) {
  const [intersectionData, setIntersectionData] = useState(null);

  const isFocused = useIsFocused();
  let intervalId = null;

  useEffect(() => {
    if (selectedLightGroups.length <= 0) return;

		startTimer(isFocused);
		return () => {
			clearInterval(intervalId);
		}
	}, [isFocused]);

  useEffect(() => {
    if (selectedLightGroups.length <= 0) return;
    
    fetchData();
  }, [selectedLightGroups]);

  const startTimer = (isFocused) => {
		if (isFocused) {
      fetchData();
			intervalId = setInterval(() => {
				fetchData();
			}, 600);
		} else {
			clearInterval(intervalId);
		}
	}

  const fetchData = async () => {
    let intersectionData = await getIntersectionData(selectedLightGroups[0]);
    if (intersectionData.error) {
      intersectionData = null;
    }
    setIntersectionData(intersectionData);
  }

  const showSelectedGroups = () => {
    if (intersectionData == null) return <Text style={[styles.containerRow, styles.text]}>-</Text>;

    const result = [];

    for (const [key, group] of Object.entries(intersectionData)) {
      result.push(
        <View key={'cr' + key} style={styles.containerRow}>
          <View key={'lights' + key} style={styles.lights}>
            {group.lights.map((light, index) => {
              return (
                <View key={'light' + index} style={styles.light}>
                  {getDirectionIcon(light.type, light.state)}
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

  const getDirectionIcon = (type, state) => {
    switch (type) {
      case '0': return <MatCommIcons name="walk" size={iconSize} color={getStateColor(state)} />;
      case '1': return <MatCommIcons name="arrow-left-circle" size={iconSize} color={getStateColor(state)} />;
      case '2': return <MatCommIcons name="arrow-up-circle" size={iconSize} color={getStateColor(state)} />;
      case '3': return <MatCommIcons name="arrow-right-circle" size={iconSize} color={getStateColor(state)} />;
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