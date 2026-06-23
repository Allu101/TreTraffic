import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import AppStorage from '../utils/secure-store';

export default function Map({ currentMode, intersectionLocations, location,
    setSelectedIntersection, setSelectedLightGroups, triggerLines }) {
  const [markers, setMarkers] = useState([]);
  const [polyLines, setPolyLines] = useState([]);
  const [followsUser, setFollowsUser] = useState(true);
  const mapViewRef = useRef(null);

  const initialRegion = {
    latitude: 61.49, //location != null ? parseFloat(location.latitude) : 61.49,
    longitude: 23.79, //location != null ? parseFloat(location.longitude) : 23.79,
    latitudeDelta: 0.0455,
    longitudeDelta: 0.0211,
  };

  useEffect(() => {
    initMarkers();
    initRouteLines();
  }, [intersectionLocations, currentMode]);

  useEffect(() => {
    if (followsUser) {
      animateCameraToUserLocation();
    }
  }, [followsUser, location]);

  function animateCameraToUserLocation() {
    if (location != null && mapViewRef.current) {
      mapViewRef.current.animateCamera(
        { center: { latitude: parseFloat(location?.coords?.latitude), longitude: parseFloat(location?.coords?.longitude) }, zoom: 15 },
        { duration: 800 }
      );
    }
  }

  function initMarkers() {
    let tempMarkers = [];
    if (intersectionLocations.error) return;
    tempMarkers = intersectionLocations.map((intersection) => (
      <Marker
        key={intersection.id + '-' + currentMode}
        coordinate={{
          latitude: intersection.location.latitude,
          longitude: intersection.location.longitude,
        }}
        title={intersection.liva_nro}
        description={intersection.paikka}
        pinColor={getMarkerColor(intersection, currentMode)}
        onPress={(e) => {
          if (intersection.supportLevel >= 3 && intersection.supportedGroups.includes(currentMode)) {
            setSelectedIntersection(intersection.liva_nro);
          }
        }}
      >
      </Marker>
    ));
    setMarkers(tempMarkers);
  }

  function initRouteLines() {
    let tempRouteLines = [];
    if (triggerLines.error) return;

    const filtered = triggerLines;
    
    tempRouteLines = filtered.map((routeLine, i) => (
      <Polyline
        key={i + '-' + currentMode}
        coordinates={[
          {latitude: routeLine.location[0].latitude,
            longitude: routeLine.location[0].longitude},
          {latitude: routeLine.location[1].latitude,
            longitude: routeLine.location[1].longitude},
          
        ]}
        tappable={true}
        strokeColor={'limegreen'}
        strokeWidth={3}
        onPress={(e) => {
          setSelectedLightGroups(routeLine.triggers['1'].lightGroups);
          console.log(new Date().toLocaleTimeString() + ' Route pressed ' + routeLine.triggers['1'].lightGroups);
        }
        }
      />
    ));
    setPolyLines(tempRouteLines);
  }

  function getMarkerColor(intersection, currentMode) {
    if (intersection.supportLevel >= 10) {
      return 'gold';
    }

    if (intersection.supportLevel >= 5) {
      return 'green';
    }

    if (intersection.supportLevel >= 3 && intersection.supportedGroups.includes(currentMode)) {
      return 'yellow';
    }

    if (intersection.supportLevel >= 1) {
      return 'orange';
    }

    return 'tomato';
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        showsUserLocation={true}
        rotateEnabled={false}
        showsMyLocationButton={false}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        onPanDrag={() => setFollowsUser(false)} 
        initialCamera={{
          center: {
            latitude: 61.49,
            longitude: 23.79,
          },
          pitch: 0,
          heading: 0,
          zoom: 12,
          altitude: 35000,
        }}
      >
        {markers}
        {polyLines}
      </MapView>
      {!followsUser && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={() => setFollowsUser(true)}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="black" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});