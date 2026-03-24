import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sujet : null,
    actionsList : [],
    success: false,
    error: null
}

const actionSlice = createSlice({
    name : 'action',
    initialState,
    reducers: {
        getActionsBySujetRequest(state) {
            state.success = false;
            state.error = null;
        },
        getActionsBySujetSuccess(state, action) {
            state.actionsList = action.payload;
            state.success = true;
        },
        getActionsBySujetFailure(state, action) {
            state.error = action.payload;
            state.success = false;
        }
    }
})

export const {
    getActionsBySujetRequest,
    getActionsBySujetSuccess,
    getActionsBySujetFailure
} = actionSlice.actions;

export default actionSlice.reducer;