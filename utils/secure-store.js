import * as SecureStore from 'expo-secure-store'

const mode = Object.freeze({
  Cars: 'Cars',
  Pedestrians: 'Pedestrians',
});

const getValue = async (key) => {
  const value = await SecureStore.getItemAsync(key);
  if (key === 'location') {
    if (value != null && value != "") {
      const [lat, lon, hea] = value.split(',');
      return {
        latitude: lat,
        longitude: lon,
        heading: hea,
      }
    }
    return {
      latitude: null,
      longitude: null,
      heading: null
    };
  }
  return value;
}

const save = async (key, value) => {
  await SecureStore.setItemAsync(key, value);
}

export default {
  Mode: mode,
  getValue,
  save,
}