import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CheckAuth({ children, protected: isProtected }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 👉 If route is protected
    if (isProtected) {
      if (!token) {
        // 🔒 No token = redirect to login page
        navigate("/login");
      } else {
        // ✅ Token found, allow access
        setLoading(false);
      }
    } else {
      // 👉 If route is public
      if (token) {
        // 🚫 Already logged in = redirect to home
        navigate("/");
      } else {
        // ✅ No token = stay on public route
        setLoading(false);
      }
    }
  }, [navigate, isProtected]);

  // 🌐 Show loading spinner or text while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Loading...
      </div>
    );
  }

  // ✅ Render the actual page once auth check is done
  return children;
}

export default CheckAuth;
