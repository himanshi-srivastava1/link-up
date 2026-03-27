import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
    loading: false
};

// Action types
const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    CLEAR_LOADING: 'CLEAR_LOADING'
};

// Reducer function
const loaderReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return { ...state, loading: true };
        case actionTypes.CLEAR_LOADING:
            return { ...state, loading: false };
        default:
            return state;
    }
};

// Create context
const LoaderContext = createContext();

// Context provider component
export const LoaderProvider = ({ children }) => {
    const [state, dispatch] = useReducer(loaderReducer, initialState);

    const actions = {
        setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
        clearLoading: () => dispatch({ type: actionTypes.CLEAR_LOADING })
    };

    const value = {
        ...state,
        ...actions,
        dispatch
    };

    return (
        <LoaderContext.Provider value={value}>
            {children}
        </LoaderContext.Provider>
    );
};

// Custom hook to use the context
export const useLoaderContext = () => {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoaderContext must be used within a LoaderProvider');
    }
    return context;
};

export default LoaderContext;
