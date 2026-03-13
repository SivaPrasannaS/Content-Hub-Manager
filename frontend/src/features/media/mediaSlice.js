import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import mediaAPI from './mediaAPI';

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null
};

export const fetchMedia = createAsyncThunk('media/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await mediaAPI.list();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch media');
  }
});

export const createMedia = createAsyncThunk('media/create', async (payload, { rejectWithValue }) => {
  try {
    return await mediaAPI.create(payload);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to upload media');
  }
});

export const deleteMedia = createAsyncThunk('media/delete', async (id, { rejectWithValue }) => {
  try {
    await mediaAPI.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to delete media');
  }
});

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.total = state.items.length;
      })
      .addCase(fetchMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMedia.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
        state.total = state.items.length;
      })
      .addCase(createMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMedia.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMedia.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.total = state.items.length;
      })
      .addCase(deleteMedia.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default mediaSlice.reducer;