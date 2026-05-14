const REDIRECT_AFTER_LOGIN_KEY = "redirectAfterLogin";
const TARGET_ACTION_ID_KEY = "targetActionId";

export const buildActionDeepLink = (actionId: number | string) => {
  return `/actions/${encodeURIComponent(String(actionId))}`;
};

export const getStoredRedirect = () => {
  return localStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
};

export const storeRedirect = (url: string) => {
  localStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, url);
};

export const clearRedirect = () => {
  localStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
};

export const getStoredTargetActionId = () => {
  return sessionStorage.getItem(TARGET_ACTION_ID_KEY) || localStorage.getItem(TARGET_ACTION_ID_KEY);
};

export const storeTargetActionId = (actionId: number | string) => {
  const normalizedActionId = String(actionId);

  sessionStorage.setItem(TARGET_ACTION_ID_KEY, normalizedActionId);
  localStorage.setItem(TARGET_ACTION_ID_KEY, normalizedActionId);
};

export const clearTargetActionId = () => {
  sessionStorage.removeItem(TARGET_ACTION_ID_KEY);
  localStorage.removeItem(TARGET_ACTION_ID_KEY);
};
