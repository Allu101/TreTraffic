import axios from "axios";
import { API_KEY } from '@env';

const DEFAULT_BASE_URL = "http://192.168.0.3:5000/api/";
//const DEFAULT_BASE_URL = "https://12f4-2001-99a-19d-2900-5d23-645a-259d-2b80.ngrok-free.app/api/";

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

async function getAllIntersectionLocations() {
  try {
    const response = await api.get(`locations/intersections/`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error);
  }
}

async function getAllTriggerLines() {
  try {
    const response = await api.get(`triggerlines/`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error, "triggerlines");
  }
}

async function getIntersectionData(intersection_nro) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`intersections/intersection/${intersection_nro}`);
    console.log(new Date().getTime() - time + ' ms i');
    return response.data || {};
  } catch (error) {
    return handleApiError(error, "intersection data");
  }
}

async function getLightGroupsData(lightGroups) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`intersections/lightgroups/${lightGroups}`);
    console.log(new Date().getTime() - time + ' ms l');
    return response.data || {};
  } catch (error) {
    return handleApiError(error, "lightgroups data");
  }
}

export {
	getAllIntersectionLocations,
  getAllTriggerLines,
  getIntersectionData,
  getLightGroupsData,
  setBaseUrlOverride,
};