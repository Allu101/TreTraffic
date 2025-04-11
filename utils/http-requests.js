import axios from "axios";

const BASE_URL = "http://192.168.0.3:5000/api/";

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

async function getAllTriggerLines() {
  let result = {};
  await axios.get(`${BASE_URL}triggerlines/`)
    .then(function (response) {
      result = response.data
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

async function getIntersectionData(intersection_nro) {
  let time = new Date().getTime();
  let result = {};
  await axios.get(`${BASE_URL}intersections/intersection/${intersection_nro}`)
    .then(function (response) {
      result = response.data
      console.log(new Date().getTime() - time + ' ms i');
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

async function getLightGroupsData(lightGroups) {
  let time = new Date().getTime();
  let result = {};
  await axios.get(`${BASE_URL}intersections/lightgroups/${lightGroups}`)
    .then(function (response) {
      result = response.data
      console.log(new Date().getTime() - time + ' ms l');
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

export {
	getAllIntersectionLocations,
  getAllTriggerLines,
  getIntersectionData,
  getLightGroupsData,
};