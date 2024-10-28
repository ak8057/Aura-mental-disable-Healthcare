import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./Pages/Dashboard";
import Login from "./Auth/Login";
import Register from "./Auth/Register";
import TherapyCards from "./Pages/TherapyCards"; // Import TherapyCards
import { useAuth } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AccessibleMeditation from "./Pages/Meditation";

const App = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />} // Always show the Dashboard first
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/therapycards"
          element={<TherapyCards />} // Remove authentication check for this route
        />
        <Route
          path="/meditate"
          element={<AccessibleMeditation />} // Remove authentication check for this route
        />
      </Routes>
    </Router>
  );
};

export default App;
