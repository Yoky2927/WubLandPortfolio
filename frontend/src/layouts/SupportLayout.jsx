import React from "react";
import { Outlet } from "react-router-dom";

const SupportLayout = () => {
  return (
    <div className="support-layout">
      <Outlet />
    </div>
  );
};

export default SupportLayout;