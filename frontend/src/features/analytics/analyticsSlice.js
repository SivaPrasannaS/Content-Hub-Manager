import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import analyticsAPI from './analyticsAPI';

const initialState = {
  summary: null,
  monthly: [],
  byCategory: [],
  loading: false,
  error: null
};

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async (_, { rejectWithValue }) => {
  try {
    const [summary, monthly, byCategory] = await Promise.all([
      analyticsAPI.summary(),
      analyticsAPI.monthly(),
      analyticsAPI.byCategory()
    ]);
    return { summary, monthly, byCategory };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch analytics');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.monthly = action.payload.monthly;
        state.byCategory = action.payload.byCategory;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default analyticsSlice.reducer;