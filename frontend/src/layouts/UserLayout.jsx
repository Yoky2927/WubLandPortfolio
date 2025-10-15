import React from "react";
import { Outlet } from "react-router-dom";

const UserLayout = () => {
  return (
    <div className="user-layout">
      <Outlet />
    </div>
  );
};

export default UserLayout;