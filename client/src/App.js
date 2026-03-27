import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home';
import Signup from './pages/signup';
import Login from './pages/login';
import Message from './pages/message';
import Profile from "./pages/profile";
import ChangePassword from "./pages/changePassword/index.js";
import ForgotPassword from "./pages/forgotPassword/index.js";
import VerifyEmail from "./pages/verifyEmail/index.js";
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/protectedRoute.js';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <ChatProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/forgot_pass' element={<ForgotPassword />} />
          <Route path='/verify-email/:token' element={<VerifyEmail />} />
          <Route path='/reset-password/:token' element={<ForgotPassword />} />
          <Route path='/profile/:id' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path='/change-password' element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          <Route path='/message/:id' element={
            <ProtectedRoute>
              <Message />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
