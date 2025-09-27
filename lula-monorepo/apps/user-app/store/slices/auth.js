import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            const newState = {
                ...state,
                user: action.payload,
            };
            return newState;
        },
        updateUser: (state, action) => {
            const newState = {
                ...state,
                user: action.payload,
            };
            return newState;
        },
        clearAuth: (state) => {
            const newState = {
                ...state,
                user: null,
            };
            return newState;
        },
    },
});

export const { clearAuth, setUser, updateUser } = authSlice.actions;
export default authSlice.reducer;