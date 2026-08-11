import './App.css'
import AppRoutes from './AppRoutes'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FirebasePopup from './FirebasePopup';

function App() {
    console.log(import.meta.env.VITE_APIURL);

  return (
    <>
        <ToastContainer />
        <AppRoutes />
        <FirebasePopup />
    </>
  )
}

export default App
