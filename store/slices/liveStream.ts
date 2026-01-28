import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LiveStreamState {
  isLive: boolean;
  liveStreamId: string | null;
  roomId: string | null;
  streamType: string | null;
}

const initialState: LiveStreamState = {
  isLive: false,
  liveStreamId: null,
  roomId: null,
  streamType: null,
};

const liveStreamSlice = createSlice({
  name: "liveStream",
  initialState,
  reducers: {
    setLiveStreamStarted: (
      state,
      action: PayloadAction<{ liveStreamId: string; roomId: string; streamType?: string | null }>
    ) => {
      state.isLive = true;
      state.liveStreamId = action.payload.liveStreamId;
      state.roomId = action.payload.roomId;
      state.streamType = action.payload.streamType ?? null;
    },
    setLiveStreamEnded: (state) => {
      state.isLive = false;
      state.liveStreamId = null;
      state.roomId = null;
      state.streamType = null;
    },
  },
});

export const { setLiveStreamStarted, setLiveStreamEnded } = liveStreamSlice.actions;

export default liveStreamSlice.reducer;

