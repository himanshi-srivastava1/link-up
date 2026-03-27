import React, { createContext, useContext, useReducer } from 'react';
import { io } from 'socket.io-client';

// Initial state
const initialState = {
    user: null,
    allUsers: [],
    allChats: [],
    selectedChat: null,
    selectedUser: null,
    socket: null,
    onlineUsers: [],
    loading: false,
    allMessages: []
};

// Action types
const actionTypes = {
    SET_USER: 'SET_USER',
    SET_ALL_USERS: 'SET_ALL_USERS',
    SET_ALL_CHATS: 'SET_ALL_CHATS',
    SET_SELECTED_CHAT: 'SET_SELECTED_CHAT',
    SET_SELECTED_USER: 'SET_SELECTED_USER',
    SET_SOCKET: 'SET_SOCKET',
    SET_ONLINE_USERS: 'SET_ONLINE_USERS',
    SET_LOADING: 'SET_LOADING',
    ADD_MESSAGE: 'ADD_MESSAGE',
    UPDATE_MESSAGES: 'UPDATE_MESSAGES',
    DELETE_MESSAGE: 'DELETE_MESSAGE'
};

// Reducer function
const chatReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_USER:
            return { ...state, user: action.payload };
        case actionTypes.SET_ALL_USERS:
            return { ...state, allUsers: action.payload };
        case actionTypes.SET_ALL_CHATS:
            return { ...state, allChats: action.payload };
        case actionTypes.SET_SELECTED_CHAT:
            return { ...state, selectedChat: action.payload };
        case actionTypes.SET_SELECTED_USER:
            return { ...state, selectedUser: action.payload };
        case actionTypes.SET_SOCKET:
            return { ...state, socket: action.payload };
        case actionTypes.SET_ONLINE_USERS:
            return { ...state, onlineUsers: action.payload };
        case actionTypes.SET_LOADING:
            return { ...state, loading: action.payload };
        case actionTypes.ADD_MESSAGE:
            return { 
                ...state, 
                allMessages: state.allMessages ? [action.payload, ...state.allMessages] : [action.payload]
            };
        case actionTypes.UPDATE_MESSAGES:
            return { ...state, allMessages: action.payload };
        case actionTypes.DELETE_MESSAGE:
            return { 
                ...state, 
                allMessages: state.allMessages?.filter(msg => msg._id !== action.payload) 
            };
        default:
            return state;
    }
};

// Create context
const ChatContext = createContext();

// Context provider component
export const ChatProvider = ({ children }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);

    // Initialize socket connection
    React.useEffect(() => {
        if (state.user) {
            const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const newSocket = io(socketUrl, {
                transports: ["websocket", "polling"]
            });

            newSocket.emit('join-room', state.user._id);
            newSocket.emit('user-login', state.user._id);
            newSocket.on('online-users', (onlineUsers) => {
                dispatch({ type: actionTypes.SET_ONLINE_USERS, payload: onlineUsers });
            });

            dispatch({ type: actionTypes.SET_SOCKET, payload: newSocket });

            return () => {
                newSocket.off('online-users');
                newSocket.close();
            };
        }
    }, [state.user]);

    const actions = {
        setUser: (user) => dispatch({ type: actionTypes.SET_USER, payload: user }),
        setAllUsers: (users) => dispatch({ type: actionTypes.SET_ALL_USERS, payload: users }),
        setAllChats: (chats) => dispatch({ type: actionTypes.SET_ALL_CHATS, payload: chats }),
        setSelectedChat: (chat) => dispatch({ type: actionTypes.SET_SELECTED_CHAT, payload: chat }),
        setSelectedUser: (user) => dispatch({ type: actionTypes.SET_SELECTED_USER, payload: user }),
        setSocket: (socket) => dispatch({ type: actionTypes.SET_SOCKET, payload: socket }),
        setOnlineUsers: (users) => dispatch({ type: actionTypes.SET_ONLINE_USERS, payload: users }),
        setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
        addMessage: (message) => dispatch({ type: actionTypes.ADD_MESSAGE, payload: message }),
        updateMessages: (messages) => dispatch({ type: actionTypes.UPDATE_MESSAGES, payload: messages }),
        deleteMessage: (messageId) => dispatch({ type: actionTypes.DELETE_MESSAGE, payload: messageId })
    };

    const value = {
        ...state,
        dispatch,
        ...actions
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

// Custom hook to use the context
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

export default ChatContext;
