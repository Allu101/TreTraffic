import { StyleSheet, Text, View, Dimensions } from 'react-native';
import React, { useContext, useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Callout, Marker } from 'react-native-maps';


export default function Map() {
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapViewRef = useRef(null);

  function initLocation() {
    const region = {
      latitude: location != null ? parseFloat(location.latitude) : 61.49,
      longitude: location != null ? parseFloat(location.longitude) : 23.79,
      latitudeDelta: 0.0455,
      longitudeDelta: 0.0211,
    };
    mapViewRef.current?.animateToRegion(region, 1200);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        showsUserLocation={true}
        mapPadding={{top: 0}}
        rotateEnabled={false}
        showsMyLocationButton={false}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        onMapLoaded={() => initLocation()}
        Initialregion={{
          latitude: 61.49,
          longitude: 23.79,
          latitudeDelta: 0.0455,
          longitudeDelta: 0.0211,
        }}
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