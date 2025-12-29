
import { useSelector } from "react-redux";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { useState } from "react";
export const socket = io('https://link-up-server2.onrender.com', {
    transports: ["websocket"], // This is the crucial part
    upgrade: false
});

function Home() {
    const { user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUsers] = useState([]);
    useEffect(() => {
        if (user) {
            socket.emit('join-room', user._id);
            socket.emit('user-login', user._id);
            socket.on('online-users', (onlineUsers) => {
                setOnlineUsers(onlineUsers);
            })
        }
        return () => {
            socket.off('online-users');
        }
    }, [user])
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