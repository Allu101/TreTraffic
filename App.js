import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from "react";
import * as Location from 'expo-location';
import AppStorage from './utils/secure-store';
import Home from './components/Home';
import Map from './components/MapView';

export default function App() {
  const [selectedLightGroups, setSelectedLightGroups] = useState([]);

  const Tab = createBottomTabNavigator();

  useEffect(() => {
    fetchGPS();
  }, []);

  const fetchGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted' && await Location.hasServicesEnabledAsync()) {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          type: Location.LocationActivityType.AutomotiveNavigation,
        },
        async (location) => {
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
            selectedLightGroups={selectedLightGroups}
            setSelectedLightGroups={setSelectedLightGroups}
          />}
          options={{
            title: 'Home',
            tabBarIconStyle: { display: "none" }
          }}
        />
        <Tab.Screen
          name={'map'}
          children={() => <Map setSelectedLightGroups={setSelectedLightGroups} />}
          options={{
            title: 'Map',
            tabBarIconStyle: { display: "none" }
            
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}