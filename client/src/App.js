import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home';
import Signup from './pages/signup';
import Login from './pages/login';
import Message from './pages/message';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/protectedRoute.js';
import Loader from "./components/loader.js";
import { useSelector } from "react-redux";
function App() {
  const {loader}=useSelector(state=>state.loaderReducer)
  return (
    <div>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      { loader && <Loader/>}
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>}>
          </Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/signup' element={<Signup />}></Route>
          <Route path='/message/:id'  element={
            <ProtectedRoute>
              <Message/>
            </ProtectedRoute>
          }></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
