import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestNotificationPermission } from "../../firebase"; // adjust import path if needed

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else {
      try {
        const deviceToken = await requestNotificationPermission();
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, deviceToken }),
        });
        const data = await response.json();
        if (response.status === 200) {
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("Login successful");
          console.log("User data from backend:", data.user);
          console.log("User ID extracted:", data.user._id);
          setErrors({});
          
          // Get device token and update backend
          const userId = data.user._id; // or data.user.id, depending on your API
          console.log("Requesting notification permission for user:", userId);
          requestNotificationPermission(userId).then((token) => {
            console.log("Device token registration completed for user:", userId);
          }).catch(err => {
            console.error("Failed to register device token:", err);
          });

          navigate(`/${data.user.role}/dashboard`);
        } else {
          setErrors({ general: data.error });
        }
      } catch (err) {
        console.log(err);
        setErrors({ general: "An error occurred. Please try again." });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full transform transition-all duration-500 hover:scale-105">
        <div className="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-16 w-auto animate-spin-slow"
          />
        </div>
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
          Welcome Back!
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>
          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-md shadow-md hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <Link to="/forgot-password" className="hover:underline">
            Forgot Password?
          </Link>
          {/* <Link to="/signup" className="hover:underline">
            Create an Account
          </Link> */}
        </div>

      </div>
    </div>
  );
};

export default Login;
