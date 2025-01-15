import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import React, { useEffect } from "react";
import * as Location from 'expo-location';
//import * as SplashScreen from 'expo-splash-screen';
import AppStorage from './utils/secure-store.service';
import Home from './components/Home';
import Map from './components/MapView';

export default function App() {
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
            `${location.coords.latitude},${location.coords.longitude}`
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
          children={() => <Home />}
          options={{
            title: 'Home',
            tabBarIconStyle: { display: "none" }
          }}
        />
        <Tab.Screen
          name={'map'}
          children={() => <Map />}
          options={{
            title: 'Map',
            tabBarIconStyle: { display: "none" }
            
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
