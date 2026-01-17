import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { User } from '@/types/user';
import { isAxiosError } from 'axios';

interface IInitialState {
  error: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
}

const initialState: IInitialState = {
  user: null,
  status: 'loading',
  error: null,
};

/** Thunks */
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ user: User }>('/auth/verify');
      return response.data.user;
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        console.error(err);
        return rejectWithValue(err.response.data.message);
      }
      console.error(err);
      return rejectWithValue((err as Error).message);
    }
  },
);

export const logout = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        console.error(err);
        return rejectWithValue(err.response.data.message);
      }
      console.error(err);
      return rejectWithValue((err as Error).message);
    }
  },
);

/** Slice */
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.error = action.payload as string;
      });

    builder
      .addCase(logout.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.error = null;
      })
      .addCase(logout.pending, (state) => {
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
