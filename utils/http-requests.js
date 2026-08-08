import axios from "axios";

const DEFAULT_BASE_URL = "http://192.168.0.3:5000/api/";
//const DEFAULT_BASE_URL = "https://aba9-2001-99a-19d-2900-a48f-19d1-82f3-2249.ngrok-free.app/api/";
let baseUrlOverride = null;

const etagCache = new Map();
const dataCache = new Map();

const Mode = Object.freeze({
  Cars: 'Cars',
  Pedestrians: 'Pedestrians',
});

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

function setBaseUrlOverride(baseUrl) {
  baseUrlOverride = baseUrl || DEFAULT_BASE_URL;
  api.defaults.baseURL = baseUrl || DEFAULT_BASE_URL;
}

function getBaseUrl() {
  return baseUrlOverride || DEFAULT_BASE_URL;
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

async function getSubscriptionStatus(googleId) {
  try {
    const response = await api.post(`subscription/status`, { userId: googleId });
    return response.data;
  } catch (error) {
    return handleApiError(error, "subscription status");
  }
}

async function handleGoogleLogin(GoogleSignin) {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      throw new Error('No idToken');
    }

    const response = await api.post('auth/google', { idToken });

    return response.data;
  } catch (error) {
    //console.log(e);
    return handleApiError(error, "google login");
  }
}

async function verifySubscription(user, purchase) {
  try {
    const body = {
      userId: user?.user?.id,
      purchaseToken: purchase.purchaseToken,
    }
    const response = await api.post(`subscription/verify`, body);
    return response.data;
  } catch (error) {
    console.log(error)
    return handleApiError(error, "verify subscription");
  }
}

async function updateStream(clientId, type, params, currentMode) {
  try {
    const body = {
      clientId,
      mode: currentMode,
      type,
      params
    }
    const response = await api.post(`intersections/updatestream`, body);
    return response.data;
  } catch (error) {
    return handleApiError(error, "update stream");
  }
}

export {
  Mode,
  getBaseUrl,
	getAllIntersectionLocations,
  getAllTriggerLines,
  getSubscriptionStatus,
  handleGoogleLogin,
  setBaseUrlOverride,
  verifySubscription,
  updateStream
};