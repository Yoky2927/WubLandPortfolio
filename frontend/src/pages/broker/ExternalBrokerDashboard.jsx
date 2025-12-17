// pages/brokers/ExternalBrokerDashboard.jsx
import React from "react";
import BrokerDashboard from "./BrokerDashboard";

const ExternalBrokerDashboard = () => {
  return <BrokerDashboard isInternal={false} />;
};

export default ExternalBrokerDashboard;