import { useSelector } from "react-redux";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { useState } from "react";

function Home() {
    const { user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const newSocket = io(socketUrl, {
                transports: ["websocket", "polling"]
            });

            newSocket.emit('join-room', user._id);
            newSocket.emit('user-login', user._id);
            newSocket.on('online-users', (onlineUsers) => {
                setOnlineUsers(onlineUsers);
            })

            setSocket(newSocket);

            return () => {
                newSocket.off('online-users');
                newSocket.close();
            };
        }
    }, [user]);

    if (!user || !socket) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="home-page">
            <Header></Header>
            <div className="main-content">
                <Sidebar socket={socket} onlineUser={onlineUser}></Sidebar>
            </div>
        </div>
    );
}
export default Home;