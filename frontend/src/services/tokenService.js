const accessTokenKey = process.env.REACT_APP_TOKEN_KEY || 'chm_access_token';
const refreshTokenKey = process.env.REACT_APP_REFRESH_KEY || 'chm_refresh_token';
const userStorageKey = `${accessTokenKey}_user`;

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const tokenService = {
  getAccessToken() {
    return getStorage()?.getItem(accessTokenKey) ?? null;
  },
  setAccessToken(token) {
    getStorage()?.setItem(accessTokenKey, token);
  },
  getRefreshToken() {
    return getStorage()?.getItem(refreshTokenKey) ?? null;
  },
  setRefreshToken(token) {
    getStorage()?.setItem(refreshTokenKey, token);
  },
  getUser() {
    const storedUser = getStorage()?.getItem(userStorageKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      getStorage()?.removeItem(userStorageKey);
      return null;
    }
  },
  setUser(user) {
    getStorage()?.setItem(userStorageKey, JSON.stringify(user));
  },
  clearTokens() {
    getStorage()?.removeItem(accessTokenKey);
    getStorage()?.removeItem(refreshTokenKey);
    getStorage()?.removeItem(userStorageKey);
  }
};

export default tokenService;