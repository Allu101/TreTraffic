import * as SecureStore from 'expo-secure-store'

const getValueFor = async (key) => {
  const value = await SecureStore.getItemAsync(key);
  if (key === 'location') {
    if (value != null && value != "") {
      const [lat, lon] = value.split(',');
      return {
        latitude: lat,
        longitude: lon
      }
    }
    return {
      latitude: null,
      longitude: null
    };
  }
  return value;
}

const save = async (key, value) => {
  await SecureStore.setItemAsync(key, value);
}

export default {
  getValueFor: getValueFor,
  save: save,
}