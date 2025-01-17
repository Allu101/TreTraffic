import axios from "axios";

const BASE_URL = "http://192.168.0.6:5000/api/";

async function getAllIntersectionLocations() {
  let result = {};
  await axios.get(`${BASE_URL}locations/intersections/`)
    .then(function (response) {
      result = response.data
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

async function getIntersectionData(intersection_nro) {
  let result = {};
  await axios.get(`${BASE_URL}/intersections/intersection/${intersection_nro}`)
    .then(function (response) {
      result = response.data
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

export {
	getAllIntersectionLocations,
  getIntersectionData,
};