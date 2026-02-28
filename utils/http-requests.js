import axios from "axios";
import { API_KEY } from '@env';

//const BASE_URL = "http://192.168.0.3/api/";
const BASE_URL = "http://10.203.105.197:5000/api/";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

function handleApiError(error) {
  console.error("API Error:", error);
  return {
    error: true,
    message: error.response?.data?.message || error.message || "Unknown error",
    status: error.response?.status || null,
  };
}

async function getAllIntersectionLocations() {
  try {
    const response = await api.get(`${BASE_URL}locations/intersections/`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error);
  }
}

async function getAllTriggerLines() {
  try {
    const response = await api.get(`${BASE_URL}triggerlines/`);
    return response.data || [];
  } catch (error) {
    return handleApiError(error);
  }
}

async function getIntersectionData(intersection_nro) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`${BASE_URL}intersections/intersection/${intersection_nro}`);
    console.log(new Date().getTime() - time + ' ms i');
    return response.data || {};
  } catch (error) {
    return handleApiError(error);
  }
}

async function getLightGroupsData(lightGroups) {
  try {
    const time = new Date().getTime();
    const response = await api.get(`${BASE_URL}intersections/lightgroups/${lightGroups}`);
    console.log(new Date().getTime() - time + ' ms l');
    return response.data || {};
  } catch (error) {
    return handleApiError(error);
  }
}

export {
	getAllIntersectionLocations,
  getAllTriggerLines,
  getIntersectionData,
  getLightGroupsData,
};