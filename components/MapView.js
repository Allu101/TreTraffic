import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import AppStorage from '../utils/secure-store.service';
import { getAllIntersectionLocations } from '../utils/http-requests';

export default function Map({ setSelectedLightGroups }) {
  const [location, setLocation] = useState(null);
  const [intersections, setIntersections] = useState([]);
  const [markers, setMarkers] = useState([]);
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
  }, [intersections]);

  const fetchLocations = async () => {
    //const tempLocation = await AppStorage.getValueFor('location');
    //setLocation(tempLocation)
    const intersectionLocations = await getAllIntersectionLocations();
    setIntersections(intersectionLocations);
  }

  function initLocation() {
    mapViewRef.current?.animateCamera(
      { center: initialRegion, zoom: 13 }, { duration: 1000 });
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
        onPress={(e) => {
          getIntersectionData(intersection.liva_nro)}
        }
      >
      </Marker>
    ));
    setMarkers(tempMarkers);
  }

  function getIntersectionData(intersection_nro) {
    setSelectedLightGroups([...[],
      intersection_nro]);
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