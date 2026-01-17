import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { SettingsData } from '@/types/settings';

interface IInitialState {
  error: string | null;
  status: 'loading' | 'succeeded' | 'failed';
  settings: SettingsData | null;
}

const initialState: IInitialState = {
  settings: null,
  status: 'loading',
  error: null,
};

/** Thunks */
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<SettingsData>('/settings');
      return response.data;
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
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.settings = null;
        state.error = action.payload as string;
      });
  },
});

export default settingsSlice.reducer;
