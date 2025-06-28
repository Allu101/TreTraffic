import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import AppStorage from '../utils/secure-store';
import { getAllIntersectionLocations } from '../utils/http-requests';

export default function Map({ setSelectedIntersection, setSelectedLightGroups, triggerLines }) {
  const [location, setLocation] = useState(null);
  const [intersections, setIntersections] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [polyLines, setPolyLines] = useState([]);
  const mapViewRef = useRef(null);

  const initialRegion = {
    latitude: location != null ? parseFloat(location.latitude) : 61.49,
    longitude: location != null ? parseFloat(location.longitude) : 23.79,
    latitudeDelta: 0.0455,
    longitudeDelta: 0.0211,
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    initMarkers();
    initRouteLines();
  }, [intersections]);

  const fetchLocations = async () => {
    const tempLocation = await AppStorage.getValueFor('location');
    const intersectionLocations = await getAllIntersectionLocations();
    setLocation(tempLocation);
    setIntersections(intersectionLocations);
  }

  function initLocation() {
    mapViewRef.current.animateCamera(
      { center: initialRegion, zoom: 12 }, { duration: 900 });
  }

  function initMarkers() {
    let tempMarkers = [];
    tempMarkers = intersections.map((intersection) => (
      <Marker
        key={intersection.id}
        coordinate={{
          latitude: intersection.location.latitude,
          longitude: intersection.location.longitude,
        }}
        title={intersection.liva_nro}
        description={intersection.paikka}
        pinColor={intersection.data_available ? (intersection.hasLightGroups ?
          (intersection.hasTimeValues ? 'green' : 'yellow') : 'orange') : 'tomato'}
        onPress={(e) => {
          if (intersection.lightGroupsData) {
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
    tempRouteLines = triggerLines.map((routeLine, i) => (
      <Polyline
        key={i}
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
        Initialregion={initialRegion}
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
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 25,
  },
});