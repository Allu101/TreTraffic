import axios from "axios";
import { API_KEY } from '@env';

const DEFAULT_BASE_URL = "http://192.168.0.3:5000/api/";
//const DEFAULT_BASE_URL = "https://2f07-2001-99a-19d-2900-f9a1-14ff-d2b3-ae64.ngrok-free.app/api/";

const Mode = Object.freeze({
  Cars: 'Cars',
  Pedestrians: 'Pedestrians',
});

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

function setBaseUrlOverride(baseUrl) {
  api.defaults.baseURL = baseUrl || DEFAULT_BASE_URL;
}

function handleApiError(error, name) {
  const errorRes = {
    error: true,
    message: error.response?.data?.message || error.message || "Unknown error",
    status: error.response?.status || null,
    name: name,
  };
  console.log("API Error:", errorRes);
  return errorRes;
}

async function getAllIntersectionLocations(currentMode) {
  try {
    const response = await api.get(`locations/intersections?mode=${currentMode}`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error);
  }
}

async function getAllTriggerLines(currentMode) {
  try {
    const response = await api.get(`triggerlines?mode=${currentMode}`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error, "triggerlines");
  }
}

async function getIntersectionData(intersection_nro, currentMode) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`intersections/intersection/${intersection_nro}?mode=${currentMode}`);
    console.log(new Date().getTime() - time + ' ms');
    return response.data || {};
  } catch (error) {
    return handleApiError(error, "intersection data");
  }
}

async function getLightGroupsData(lightGroups, currentMode) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`intersections/lightgroups/${lightGroups}?mode=${currentMode}`);
    console.log(new Date().getTime() - time + ' ms');
    return response.data || {};
  } catch (error) {
    return handleApiError(error, "lightgroups data");
  }
}

export {
  Mode,
	getAllIntersectionLocations,
  getAllTriggerLines,
  getIntersectionData,
  getLightGroupsData,
  setBaseUrlOverride,
};