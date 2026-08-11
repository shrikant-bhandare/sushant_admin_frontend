import { useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";

const useUserId = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log({ decodedToken });
        setUserId(decodedToken["id"]);
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  return userId;
};

export default useUserId;