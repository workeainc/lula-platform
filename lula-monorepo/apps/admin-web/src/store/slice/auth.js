import { createSlice } from "@reduxjs/toolkit";

const loadAuthState = () => {
  try {
    const serializedState = localStorage.getItem("auth");
    return serializedState ? JSON.parse(serializedState) : null;
  } catch (error) {
    console.error("Error loading authentication state from localStorage:", error);
    return null;
  }
};

const saveAuthState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("auth", serializedState);
  } catch (error) {
    console.error("Error saving authentication state to localStorage:", error);
  }
};

const initialState = loadAuthState() || {
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const newState = {
        ...state,
        user: action.payload.user,
      };
      saveAuthState(newState);
      return newState;
    },
    setUser: (state, action) => {
      const newState = {
        ...state,
        user: action.payload.user,
      };
      saveAuthState(newState);
      return newState;
    },
    setToken: (state, action) => {
      const newState = {
        ...state,
        token: action.payload,
      };
      saveAuthState(newState);
      return newState;
    },
    clearAuth: (state) => {
      const newState = {
        ...state,
        token: null,
        userType: null,
        user: null,
      };
      saveAuthState(newState);
      return newState;
    },
  },
});

export const { setAuth, clearAuth, setUser, setToken } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
