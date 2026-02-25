import axios from "axios";
import { API_KEY } from '@env';

const BASE_URL = "http://192.168.0.6:5000/api/";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

async function getAllIntersectionLocations() {
  let result = {};
  await api.get(`${BASE_URL}locations/intersections/`)
    .then(function (response) {
      result = response.data;
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

async function getAllTriggerLines() {
  let result = {};
  await api.get(`${BASE_URL}triggerlines/`)
    .then(function (response) {
      result = response.data;
    })
    .catch(function (error) {
      result.error = error;
    });
  return result;
}

async function getIntersectionData(intersection_nro) {
  let time = new Date().getTime();
  let result = {};
  await api.get(`${BASE_URL}intersections/intersection/${intersection_nro}`)
    .then(function (response) {
      result = response.data;
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
  await api.get(`${BASE_URL}intersections/lightgroups/${lightGroups}`)
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