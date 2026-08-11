import { useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';

const useRole = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userRole = decodedToken['role']; // Get the role from the decoded token
        setRole(userRole);
      } catch (error) {
        console.error("Failed to decode token", error);
      }
    }
  }, []);

  return role;
};

export default useRole;