import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import articlesAPI from './articlesAPI';

const initialState = {
  items: [],
  total: 0,
  page: 0,
  loading: false,
  error: null,
  selected: null
};

export const fetchArticles = createAsyncThunk('articles/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await articlesAPI.list(params);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch articles');
  }
});

export const fetchArticleById = createAsyncThunk('articles/fetchById', async (id, { rejectWithValue }) => {
  try {
    return await articlesAPI.get(id);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to fetch article');
  }
});

export const saveArticle = createAsyncThunk('articles/save', async ({ id, values }, { rejectWithValue }) => {
  try {
    return id ? await articlesAPI.update(id, values) : await articlesAPI.create(values);
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to save article');
  }
});

export const deleteArticle = createAsyncThunk('articles/delete', async (id, { rejectWithValue }) => {
  try {
    await articlesAPI.remove(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Unable to delete article');
  }
});

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    setSelectedArticle(state, action) {
      state.selected = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 0;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchArticleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchArticleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveArticle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveArticle.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(saveArticle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteArticle.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteArticle.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteArticle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setSelectedArticle } = articlesSlice.actions;
export default articlesSlice.reducer;