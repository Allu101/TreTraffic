import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import * as Location from 'expo-location';
import { lineString } from "@turf/helpers";
import { lineIntersect } from "@turf/line-intersect";
import AppStorage from './utils/secure-store';
import Home from './components/Home';
import Map from './components/MapView';
import { getAllTriggerLines } from './utils/http-requests';

export default function App() {
  const [intersectionsData, setIntersectionsData] = useState(null);
  //const [lightGroupsData, setLightGroupsData] = useState(null);
  const [selectedLightGroups, setSelectedLightGroups] = useState([]);
  const [triggerLines, setTriggerLines] = useState([]);
  const [selectedIntersection, setSelectedIntersection] = useState(null);

  const Tab = createBottomTabNavigator();
  let positionStream = null;

  useEffect(() => {
    initTriggerLines();
    fetchGPS();

    return () => {
      if (positionStream) {
        positionStream.remove();
      }
    }
  }, []);

  const initTriggerLines = async () => {
    const data = await getAllTriggerLines();
    setTriggerLines(data);
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
      if (!positionStream) {
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
                  //setSelectedLightGroups([...[], line.triggers['1'].lightGroups]);
                  console.log(new Date().toLocaleTimeString() + line.triggers['1'].lightGroups + ' ' + location.coords.heading);
                }
              }
            });

            await AppStorage.save(
              'location',
              `${location.coords.latitude},
              ${location.coords.longitude},
              ${location.coords.heading}`
            );
          }
        );
      }
    }
  }

  return (
    <NavigationContainer independent={true}>
      <Tab.Navigator
        initialRouteName={'home'}
        screenOptions={{
          tabBarActiveBackgroundColor: '#111',
          tabBarInactiveBackgroundColor: '#111',
          tabBarActiveTintColor: '#FFF',
          tabBarInactiveTintColor: '#777',
          tabBarLabelStyle: {
            fontSize: 25,
            marginBottom: 15,
          },
          tabBarStyle: {
            height: 65,
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
            selectedIntersection={selectedIntersection}
            selectedLightGroups={selectedLightGroups}
            setSelectedIntersection={setSelectedIntersection}
            setSelectedLightGroups={setSelectedLightGroups}
            setIntersectionsData={setIntersectionsData}
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
              setSelectedLightGroups={setSelectedLightGroups}
              setIntersectionsData={setIntersectionsData}
              triggerLines={triggerLines}
              setSelectedIntersection={setSelectedIntersection}
            />}
          options={{
            title: 'Map',
            tabBarIconStyle: { display: "none" }
            
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}