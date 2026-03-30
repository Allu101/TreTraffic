import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { lineString } from "@turf/helpers";
import { lineIntersect } from "@turf/line-intersect";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDistance } from 'geolib';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AppStorage from './utils/secure-store';
import Home from './components/Home';
import Map from './components/MapView';
import { Mode, getAllTriggerLines, getAllIntersectionLocations,
  setBaseUrlOverride } from './utils/http-requests';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL_KEY = 'base_url';
const INTERSECTION_BYPASS_DISTANCE = 35;

let positionStream = null;
let reachedIntersection = -1;

export default function App() {
  const [intersectionLocations, setIntersectionLocations] = useState([]);
  const [intersectionsData, setIntersectionsData] = useState(null);
  const [lightGroupsData, setLightGroupsData] = useState(null);
  const [selectedIntersection, setSelectedIntersection] = useState([]);
  const [selectedLightGroups, setSelectedLightGroups] = useState([]);
  const [currentMode, setCurrentMode] = useState(Mode.Cars);

  const [triggerLines, setTriggerLines] = useState([]);
  const [isBaseUrlDrawerVisible, setIsBaseUrlDrawerVisible] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState('');

  const Tab = createBottomTabNavigator();

  useEffect(() => {
    const initMode = async () => {
      const storedMode = await AppStorage.getValue('mode') || Mode.Cars;
      setCurrentMode(storedMode);
    }
    initMode();
    initBaseUrl();
    initIntersectionLocations();
    initTriggerLines();

    return () => {
      if (positionStream) {
        positionStream.remove();
      }
    }
  }, []);

  useEffect(() => {
    fetchGPS();
  }, [intersectionLocations])

  const initBaseUrl = async () => {
    const storedBaseUrl = await AppStorage.getValue(BASE_URL_KEY);
    const sanitizedBaseUrl = (storedBaseUrl || '').trim();

    if (sanitizedBaseUrl) {
      setBaseUrlOverride(sanitizedBaseUrl);
      setBaseUrlInput(sanitizedBaseUrl);
    }
  }

  const saveBaseUrl = async () => {
    const sanitizedBaseUrl = baseUrlInput.trim();

    await AppStorage.save(BASE_URL_KEY, sanitizedBaseUrl);
    setBaseUrlOverride(sanitizedBaseUrl || null);
    setIsBaseUrlDrawerVisible(false);

    await initIntersectionLocations();
  }

  const openBaseUrlDrawer = async () => {
    const storedBaseUrl = await AppStorage.getValue(BASE_URL_KEY);
    setBaseUrlInput((storedBaseUrl || '').trim());
    setIsBaseUrlDrawerVisible(true);
  }

  const changeMode = async (newMode) => {
    await AppStorage.save('mode', newMode);
    await initTriggerLines(newMode);
    setCurrentMode(newMode);
  }

  const initIntersectionLocations = async () => {
    const intersectionLocations = await getAllIntersectionLocations();
    setIntersectionLocations(intersectionLocations);
  }

  const initTriggerLines = async (mode = currentMode) => {
    const triggerLines = await getAllTriggerLines(mode);
    setTriggerLines(triggerLines);
  }

  const fetchGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted' && await Location.hasServicesEnabledAsync()) {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await AppStorage.save(
        'location',
        `${loc.coords.latitude},
        ${loc.coords.longitude},
        ${loc.coords.heading}`
      );

      startPositionStream();
    }
  }

  const startPositionStream = async () => {
    if (positionStream) {
      positionStream.remove();
    }
    positionStream = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        type: Location.LocationActivityType.AutomotiveNavigation,
      },
      async (location) => {
        const prevLocation = await AppStorage.getValue('location');
        const prevLocLat = parseFloat(prevLocation.latitude);
        const prevLocLon = parseFloat(prevLocation.longitude);

        const locLat = parseFloat(location.coords.latitude);
        const locLon = parseFloat(location.coords.longitude);

        if (triggerLines) {
          triggerLines.forEach((line) => {
            let triggerLine = lineString([[line.location[0].latitude, line.location[0].longitude],
                [line.location[1].latitude, line.location[1].longitude]]);
            let userLine = lineString([[prevLocLat, prevLocLon], [locLat, locLon]]);
            
            let intersects = lineIntersect(triggerLine, userLine);
            if (intersects.features.length > 0) {
              console.log(intersects.features.length);

              console.log(new Date().toLocaleTimeString() + line.triggers['1'].lightGroups);
              //check heading
              console.log(location.coords.heading);
              if (location.coords.heading > line.triggers['1'].direction - line.triggers['1'].directionRange &&
                  location.coords.heading < line.triggers['1'].direction + line.triggers['1'].directionRange) {
                setSelectedLightGroups(line.triggers['1'].lightGroups);
                console.log(new Date().toLocaleTimeString() + line.triggers['1'].lightGroups + ' ' + location.coords.heading);
              }
            }
          });
        }

        if (intersectionLocations.length > 0) {
          const filteredIntersection = intersectionLocations.filter((i) => i.hasLightGroups?.length > 0);

          filteredIntersection.forEach((intersection) => {
            const distance = getDistance(
              { latitude: locLat, longitude: locLon },
              { latitude: intersection.location.latitude, longitude: intersection.location.longitude }
            );

            const nextLightGroupLivaNro = selectedLightGroups?.[0]?.split(':')[0] || 0;
            if (!reachedIntersection) {
              if (intersection.liva_nro === selectedIntersection && distance < INTERSECTION_BYPASS_DISTANCE) {
                reachedIntersection = intersection.liva_nro;
              }
              if (intersection.liva_nro === nextLightGroupLivaNro && distance < INTERSECTION_BYPASS_DISTANCE) {
                reachedIntersection = nextLightGroupLivaNro;
              }
            } else {
              if (reachedIntersection == intersection.liva_nro && distance > INTERSECTION_BYPASS_DISTANCE) {
                reachedIntersection = -1;
                setSelectedIntersection([]);
              }
              if (reachedIntersection == nextLightGroupLivaNro && distance > INTERSECTION_BYPASS_DISTANCE) {
                reachedIntersection = -1;
                setSelectedLightGroups((prev) => prev.slice(1));
              }
            }
          });
        }

        await AppStorage.save(
          'location',
          `${location.coords.latitude},
          ${location.coords.longitude},
          ${location.coords.heading}`
        );
      }
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'top']} style={{ flex: 1 }}>
      <NavigationContainer independent={true}>
        <StatusBar style="light" />
        <Tab.Navigator
          initialRouteName={'home'}
          screenOptions={{
            tabBarActiveBackgroundColor: '#111',
            tabBarInactiveBackgroundColor: '#222',
            tabBarActiveTintColor: '#FEE',
            tabBarInactiveTintColor: '#777',
            tabBarLabelStyle: {
              fontSize: 25,
              marginBottom: 12,
            },
            tabBarStyle: {
              height: 60,
            },
            headerTitleStyle: {
              color: '#111'
            },
            headerBackgroundContainerStyle: {
              backgroundColor: '#AAA',
              alignItems: 'center',
            },
            headerShown: false,
          }}
        >
          <Tab.Screen
            name={'home'}
            children={() => <Home
              currentMode={currentMode}
              intersectionsData={intersectionsData}
              lightGroupsData={lightGroupsData}
              selectedIntersection={selectedIntersection}
              selectedLightGroups={selectedLightGroups}
              setIntersectionsData={setIntersectionsData}
              setLightGroupsData={setLightGroupsData}
              setSelectedIntersection={setSelectedIntersection}
              setSelectedLightGroups={setSelectedLightGroups}
              startPositionStream={startPositionStream}
              openBaseUrlDrawer={openBaseUrlDrawer}
            />}
            options={{
              title: 'Home',
              tabBarIconStyle: { display: "none" }
            }}
          />
          <Tab.Screen
            name={'map'}
            children={() =>
              <Map
                currentMode={currentMode}
                intersectionLocations={intersectionLocations}
                setSelectedIntersection={setSelectedIntersection}
                setSelectedLightGroups={setSelectedLightGroups}
                triggerLines={triggerLines}
              />}
            options={{
              title: 'Map',
              tabBarIconStyle: { display: "none" }
            }}

          />
        </Tab.Navigator>
      </NavigationContainer>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isBaseUrlDrawerVisible}
        onRequestClose={() => setIsBaseUrlDrawerVisible(false)}
      >
        <Pressable
          style={styles.drawerBackdrop}
          onPress={() => setIsBaseUrlDrawerVisible(false)}
        />
        <View style={styles.drawerContainer}>
          <View style={styles.modeSelector}>
            <MaterialCommunityIcons
              color={'black'}
              name="car"
              size={40}
              onPress={() => {
                console.log("mode car pressed");
                changeMode(Mode.Cars);
              }}
            />
            <MaterialCommunityIcons
              color={'black'}
              name="walk"
              size={40}
              onPress={() => {
                console.log("mode walk pressed");
                changeMode(Mode.Pedestrians);
              }}
            />
          </View>
          <Text style={styles.drawerTitle}>Set API base_url (https://url:port/api/)</Text>
          <TextInput
            style={styles.baseUrlInput}
            value={baseUrlInput}
            onChangeText={setBaseUrlInput}
            placeholder="https://example.com/api/"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.drawerActions}>
            <Pressable
              style={[styles.drawerActionButton, styles.cancelButton]}
              onPress={() => setIsBaseUrlDrawerVisible(false)}
            >
              <Text>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.drawerActionButton, styles.saveButton]}
              onPress={saveBaseUrl}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    borderColor: '#DDD',
    borderWidth: 1,
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -0.5 * 300 }, { translateY: -0.5 * 200 }],
    width: 300,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  baseUrlInput: {
    borderWidth: 1,
    borderColor: '#BBB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  drawerActions: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  drawerActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ECECEC',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#222',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});