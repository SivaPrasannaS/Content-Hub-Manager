import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import usersAPI from './usersAPI';

const initialState = {
  items: [],
  loading: false,
  error: null
};

export const fetchUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await usersAPI.list();
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch users');
  }
});

export const updateUserRole = createAsyncThunk('users/updateRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    return await usersAPI.updateRole(id, role);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to update role');
  }
});

export const deactivateUser = createAsyncThunk('users/deactivate', async (id, { rejectWithValue }) => {
  try {
    await usersAPI.deactivate(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to deactivate user');
  }
});

export const activateUser = createAsyncThunk('users/activate', async (id, { rejectWithValue }) => {
  try {
    await usersAPI.activate(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to reactivate user');
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUserRole.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deactivateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deactivateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((item) => (item.id === action.payload ? { ...item, active: false } : item));
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(activateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(activateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((item) => (item.id === action.payload ? { ...item, active: true } : item));
      })
      .addCase(activateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default usersSlice.reducer;