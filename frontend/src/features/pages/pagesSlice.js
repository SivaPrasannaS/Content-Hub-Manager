import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import pagesAPI from './pagesAPI';

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null
};

export const fetchPages = createAsyncThunk('pages/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await pagesAPI.list();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch pages');
  }
});

export const savePage = createAsyncThunk('pages/save', async ({ id, values }, { rejectWithValue }) => {
  try {
    return id ? await pagesAPI.update(id, values) : await pagesAPI.create(values);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to save page');
  }
});

const pagesSlice = createSlice({
  name: 'pages',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.total = action.payload?.length || 0;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(savePage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePage.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [...state.items.filter((item) => item.id !== action.payload.id), action.payload];
        state.total = state.items.length;
      })
      .addCase(savePage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default pagesSlice.reducer;