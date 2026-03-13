import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import categoriesAPI from './categoriesAPI';

const initialState = {
  items: [],
  loading: false,
  error: null
};

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await categoriesAPI.list();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch categories');
  }
});

export const saveCategory = createAsyncThunk('categories/save', async ({ id, values }, { rejectWithValue }) => {
  try {
    return id ? await categoriesAPI.update(id, values) : await categoriesAPI.create(values);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to save category');
  }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try {
    await categoriesAPI.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to delete category');
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [...state.items.filter((item) => item.id !== action.payload.id), action.payload];
      })
      .addCase(saveCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default categoriesSlice.reducer;