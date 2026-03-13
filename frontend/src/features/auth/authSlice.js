import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authAPI from './authAPI';
import tokenService from '../../services/tokenService';

const persistedUser = tokenService.getUser();
const persistedToken = tokenService.getAccessToken();
const persistedRefreshToken = tokenService.getRefreshToken();
const hasRecoverableSession = Boolean(persistedRefreshToken && (!persistedToken || !persistedUser));

const initialState = {
  user: persistedUser,
  token: persistedToken,
  refreshToken: persistedRefreshToken,
  loading: false,
  error: null,
  initialized: !hasRecoverableSession
};

const mapAuthPayload = (payload) => ({
  user: {
    id: payload.id,
    username: payload.username,
    roles: payload.roles
  },
  token: payload.token,
  refreshToken: payload.refreshToken
});

export const loginAsync = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    return await authAPI.login(payload);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerAsync = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await authAPI.register(payload);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const refreshTokenAsync = createAsyncThunk('auth/refresh', async (refreshToken, { rejectWithValue }) => {
  try {
    return await authAPI.refresh(refreshToken);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
  }
});

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  const token = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();
  const user = tokenService.getUser();

  if (token && user) {
    return {
      id: user.id,
      username: user.username,
      roles: user.roles,
      token,
      refreshToken
    };
  }

  if (!refreshToken) {
    return null;
  }

  try {
    return await authAPI.refresh(refreshToken);
  } catch (error) {
    tokenService.clearTokens();
    return rejectWithValue(error.response?.data?.message || 'Session restore failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.initialized = true;
      tokenService.clearTokens();
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.initialized = true;
      tokenService.setAccessToken(action.payload.token);
      tokenService.setRefreshToken(action.payload.refreshToken);
      tokenService.setUser(action.payload.user);
    }
  },
  extraReducers: (builder) => {
    const fulfilled = (state, action) => {
      const credentials = mapAuthPayload(action.payload);

      state.loading = false;
      state.error = null;
      state.initialized = true;
      state.user = credentials.user;
      state.token = credentials.token;
      state.refreshToken = credentials.refreshToken;
      tokenService.setAccessToken(credentials.token);
      tokenService.setRefreshToken(credentials.refreshToken);
      tokenService.setUser(credentials.user);
    };

    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, fulfilled)
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, fulfilled)
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(refreshTokenAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshTokenAsync.fulfilled, fulfilled)
      .addCase(refreshTokenAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (!action.payload) {
          state.loading = false;
          state.initialized = true;
          return;
        }

        fulfilled(state, action);
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload;
      });
  }
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;