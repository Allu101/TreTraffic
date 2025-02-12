import { StyleSheet, View, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { lineString } from "@turf/helpers";
import { lineIntersect } from "@turf/line-intersect";
import AppStorage from '../utils/secure-store';
import { getAllIntersectionLocations, getAllRouteLines } from '../utils/http-requests';

export default function Map({ setSelectedLightGroups }) {
  const [location, setLocation] = useState(null);
  const [intersections, setIntersections] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [routeLines, setRouteLines] = useState([]);
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
    const routeLines = await getAllRouteLines();
    setLocation(tempLocation);
    setRouteLines(routeLines);
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
        onPress={(e) => {
          getIntersectionData(intersection.liva_nro)}
        }
      >
      </Marker>
    ));
    setMarkers(tempMarkers);
  }

  function initRouteLines() {
    let tempRouteTriggers = [];
    tempRouteTriggers = routeLines.map((routeLine, i) => (
      <Polyline
        key={i}
        coordinates={[
          {latitude: routeLine.location[0].latitude,
            longitude: routeLine.location[0].longitude},
          {latitude: routeLine.location[1].latitude,
            longitude: routeLine.location[1].longitude},
          
        ]}
        tappable={true}
        strokeColor={'orange'}
        strokeWidth={3}
        onPress={(e) => {
          console.log('Route trigger pressed')}
        }
      />
    ));
    setPolyLines(tempRouteTriggers);
  }

  function getIntersectionData(intersection_nro) {
    setSelectedLightGroups([...[], intersection_nro]);
  }

  //let line1 = lineString([[61.49, 23.79], [61.50, 23.80]]);
  //let line2 = lineString([[61.50, 23.79], [61.49, 23.80]]);

  //let intersects = lineIntersect(line1, line2);
  //console.log(intersects.features.length);
  //console.log(JSON.stringify(intersects));

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