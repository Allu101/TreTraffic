import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { lineString } from "@turf/helpers";
import { lineIntersect } from "@turf/line-intersect";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getDistance } from 'geolib';
import AppStorage from './utils/secure-store';
import Home from './components/Home';
import Map from './components/MapView';
import { getAllTriggerLines, getAllIntersectionLocations,
  setBaseUrlOverride } from './utils/http-requests';
import { SafeAreaView } from 'react-native-safe-area-context';

const BASE_URL_KEY = 'base_url';
let positionStream = null;

export default function App() {
  const [intersectionLocations, setIntersectionLocations] = useState([]);
  const [intersectionsData, setIntersectionsData] = useState(null);
  const [lightGroupsData, setLightGroupsData] = useState(null);
  const [selectedIntersection, setSelectedIntersection] = useState([]);
  const [selectedLightGroups, setSelectedLightGroups] = useState([]);

  const [triggerLines, setTriggerLines] = useState([]);
  const [isBaseUrlDrawerVisible, setIsBaseUrlDrawerVisible] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState('');

  const Tab = createBottomTabNavigator();  

  useEffect(() => {
    initBaseUrl();
    initTriggerLines();
    fetchGPS();

    return () => {
      if (positionStream) {
        positionStream.remove();
      }
    }
  }, []);

  const initBaseUrl = async () => {
    const storedBaseUrl = await AppStorage.getValueFor(BASE_URL_KEY);
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

    await initTriggerLines();
  }

  const openBaseUrlDrawer = async () => {
    const storedBaseUrl = await AppStorage.getValueFor(BASE_URL_KEY);
    setBaseUrlInput((storedBaseUrl || '').trim());
    setIsBaseUrlDrawerVisible(true);
    //setSelectedLightGroups((prev) => prev.slice(1));
    //setSelectedIntersection([]);
  }

  const initTriggerLines = async () => {
    const data = await getAllTriggerLines();
    const intersectionLocations = await getAllIntersectionLocations();
    setTriggerLines(data);
    setIntersectionLocations(intersectionLocations);
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
        accuracy: Location.Accuracy.BestForNavigation,
        type: Location.LocationActivityType.AutomotiveNavigation,
      },
      async (location) => {
        const prevLocation = await AppStorage.getValueFor('location');
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

        if (intersectionLocations) {
          intersectionLocations.forEach((intersection) => {
            const distance = getDistance(
              { latitude: locLat, longitude: locLon },
              { latitude: intersection.location.latitude, longitude: intersection.location.longitude }
            );

            if (intersection.liva_nro === selectedIntersection && distance < 30) {
              setSelectedIntersection([]);
            }
            const nextLightGroupLivaNro = selectedLightGroups?.[0].split(':')[0];
            if (intersection.liva_nro === nextLightGroupLivaNro && distance < 30) {
              setSelectedLightGroups((prev) => prev.slice(1));
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
              intersectionsData={intersectionsData}
              lightGroupsData={lightGroupsData}
              selectedIntersection={selectedIntersection}
              selectedLightGroups={selectedLightGroups}
              setIntersectionsData={setIntersectionsData}
              setLightGroupsData={setLightGroupsData}
              setSelectedIntersection={setSelectedIntersection}
              setSelectedLightGroups={setSelectedLightGroups}
              startPositionStream={startPositionStream}
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

      <Pressable style={styles.drawerButton} onPress={openBaseUrlDrawer}>
        <Text style={styles.drawerButtonText}>⚙</Text>
      </Pressable>

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
  drawerButton: {
    position: 'absolute',
    top: 38,
    right: 16,
    width: 34,
    height: 34,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerButtonText: {
    fontSize: 24,
    color: '#fff',
    marginTop: -2,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: '#DDD',
    borderWidth: 1,
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
  saveButton: {
    backgroundColor: '#222',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});