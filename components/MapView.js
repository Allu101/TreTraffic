import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import AppStorage from '../utils/secure-store';

export default function Map({ currentMode, intersectionLocations, setSelectedIntersection, setSelectedLightGroups, triggerLines }) {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [polyLines, setPolyLines] = useState([]);
  const mapViewRef = useRef(null);

  const initialRegion = {
    latitude: 61.49, //location != null ? parseFloat(location.latitude) : 61.49,
    longitude: 23.79, //location != null ? parseFloat(location.longitude) : 23.79,
    latitudeDelta: 0.0455,
    longitudeDelta: 0.0211,
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    initMarkers();
    initRouteLines();
  }, [intersectionLocations, currentMode]);

  const fetchLocations = async () => {
    const tempLocation = await AppStorage.getValue('location');
    setLocation(tempLocation);
  }

  function initLocation() {
    mapViewRef.current.animateCamera(
      { center: initialRegion, zoom: 12 }, { duration: 900 });
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
          if (intersection.data_available && intersection.hasLightGroups.includes(currentMode)) {
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
    if (!intersection.data_available) return 'tomato';
    if (intersection.hasLightGroups.includes(currentMode)) {
      return intersection.hasTimeValues ? 'green' : 'yellow';
    }
    return 'orange';
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
        onMapLoaded={() => initLocation()}
        initialCamera={{
          center: {
            latitude: location != null ? parseFloat(location.latitude) : 61.49,
            longitude: location != null ? parseFloat(location.longitude) : 23.79,
          },
          pitch: 0,
          heading: 0,
          zoom: 11,
          altitude: 35000,
        }}
      >
        {markers}
        {polyLines}
      </MapView>
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
});