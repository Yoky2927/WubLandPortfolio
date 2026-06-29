import React from "react";
import {
  Search,
  Users,
  CheckCircle,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import BrokerCard from "./BrokerCard";

const Step2ChooseBroker = ({
  theme,
  stepCompleted,
  propertyRequest,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filteredBrokers,
  selectedBroker,
  handleBrokerSelect,
  handleConfirmBrokerSelection,
  isLoading,
  setSelectedBrokerForModal,
  setShowBrokerModal,
  setShowChat,
  setActiveStep,
  brokers,
  requestId,
}) => {
  console.log("🔍 Step2ChooseBroker props:", {
  selectedBroker: selectedBroker,
  filteredBrokersCount: filteredBrokers.length,
  hasSetSelectedBrokerForModal: !!setSelectedBrokerForModal,
  hasSetShowBrokerModal: !!setShowBrokerModal,
  // Removed showBrokerModal since it's not passed as a prop
});

  // FIX: Update render function to properly call handleBrokerSelect
  const renderBrokerCardStep2 = (broker, isCompact = false) => (
    <BrokerCard
      key={broker.id}
      broker={broker}
      isCompact={false} // Changed from true to false to show View button
      theme={theme}
      isSelected={selectedBroker?.id === broker.id}
      onSelect={() => {
        console.log("🎯 Step2 BrokerCard: onSelect called for", broker.id);
        if (handleBrokerSelect) {
          handleBrokerSelect(broker);
        }
      }}
      onView={() => {
        console.log("👁️ Step2 BrokerCard: onView called for", broker.id);
        if (setSelectedBrokerForModal && setShowBrokerModal) {
          setSelectedBrokerForModal(broker);
          setShowBrokerModal(true);
        }
      }}
    />
  );

  if (stepCompleted) {
    return (
      <div
        className={`p-6 rounded-xl border text-center ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
        }`}
      >
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            theme === "dark" ? "bg-green-900/30" : "bg-green-100"
          }`}
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>

        <h4
          className={`text-2xl font-bold mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Broker Assigned Successfully
        </h4>

        <div className="max-w-2xl mx-auto mb-6">
          <p
            className={`mb-6 ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Your broker{" "}
            <span
              className={`font-semibold ${
                theme === "dark" ? "text-amber-300" : "text-amber-600"
              }`}
            >
              {propertyRequest.brokerName}
            </span>{" "}
            has been assigned to handle your property listing.
          </p>

          <div
            className={`p-6 rounded-xl border mb-4 ${
              theme === "dark"
                ? "bg-gray-900 border-gray-700"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    {selectedBroker?.profile_picture ? (
                      <img
                        src={selectedBroker.profile_picture}
                        alt={selectedBroker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-left">
                  <h5
                    className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {propertyRequest.brokerName}
                  </h5>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        theme === "dark" ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      Rating:{" "}
                      {selectedBroker?.average_rating?.toFixed(1) || "4.5"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        theme === "dark" ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      Deals: {selectedBroker?.total_completed_deals || "50"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowChat && setShowChat(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  }`}
                >
                  Start Chat
                </button>
                <button
                  onClick={() => {
                    if (setSelectedBrokerForModal && setShowBrokerModal) {
                      setSelectedBrokerForModal(selectedBroker);
                      setShowBrokerModal(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  View Profile
                </button>
              </div>
            </div>

            <div
              className={`mt-4 p-3 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Your broker will contact you within 24 hours to discuss next
                steps.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setActiveStep && setActiveStep(3)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              theme === "dark"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            Schedule Property Inspection
          </button>
          <button
            onClick={() => {
              if (setActiveStep && handleBrokerSelect) {
                setActiveStep(2);
                handleBrokerSelect(null);
              }
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Change Broker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`py-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
    >
      {/* Header */}
      <div className={`p-6 text-center mb-6`}>
        <h3
          className={`text-2xl font-bold mb-3 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Choose Your Broker
        </h3>
        <p
          className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
        >
          Select a real estate broker to guide you through the listing process.
        </p>
      </div>

      <div
        className={`p-6 rounded-xl border ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
        }`}
      >
        {/* Search and Filter */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search brokers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-900 border-gray-600 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-900 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="rating">Sort by Rating</option>
              <option value="experience">Sort by Experience</option>
              <option value="deals">Sort by Deals</option>
              <option value="commission">Sort by Commission</option>
            </select>
          </div>
        </div>

        {/* Brokers Grid */}
        <div className="mb-6">
          <h4
            className={`text-lg font-semibold mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Available Brokers{" "}
            {filteredBrokers.length > 0 && `(${filteredBrokers.length})`}
          </h4>

          {filteredBrokers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBrokers
                .slice(0, 6)
                .map((broker) => renderBrokerCardStep2(broker, false))}
            </div>
          ) : (
            <div
              className={`p-8 rounded-xl border text-center ${
                theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"
              }`}
            >
              <Users
                className={`w-12 h-12 mx-auto mb-4 ${
                  theme === "dark" ? "text-gray-600" : "text-gray-400"
                }`}
              />
              <h5
                className={`text-lg font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                No Brokers Found
              </h5>
              <p
                className={`mb-4 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Try adjusting your search criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSortBy("rating");
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Top Rated Broker */}
        {filteredBrokers.length > 0 &&
          filteredBrokers[0].average_rating >= 4.5 && (
            <div className="mb-6">
              <div
                className="cursor-pointer"
                onClick={() => handleBrokerSelect && handleBrokerSelect(filteredBrokers[0])}
              >
                <BrokerCard
                  broker={filteredBrokers[0]}
                  theme={theme}
                  isSelected={selectedBroker?.id === filteredBrokers[0].id}
                  onSelect={() => handleBrokerSelect && handleBrokerSelect(filteredBrokers[0])}
                  onView={() => {
                    if (setSelectedBrokerForModal && setShowBrokerModal) {
                      setSelectedBrokerForModal(filteredBrokers[0]);
                      setShowBrokerModal(true);
                    }
                  }}
                  showTopRatedBadge={true}
                />
              </div>
            </div>
          )}

        {/* Selection Confirmation */}
        {selectedBroker && propertyRequest?.id && (
          <div
            className={`p-4 rounded-xl border mb-6 ${
              theme === "dark"
                ? "bg-green-900/20 border-green-700"
                : "bg-green-50 border-green-300"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <h6
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Ready to confirm selection?
                  </h6>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Selected:{" "}
                    <span className="font-medium">{selectedBroker.name}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (setSelectedBrokerForModal && setShowBrokerModal) {
                      setSelectedBrokerForModal(selectedBroker);
                      setShowBrokerModal(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  View Details
                </button>
                <button
                  onClick={handleConfirmBrokerSelection}
                  disabled={isLoading || !propertyRequest?.id}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-500 text-white hover:bg-green-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? "Assigning..." : "Confirm Selection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div
          className={`p-4 rounded-xl border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-50 border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <HelpCircle
              className={`w-5 h-5 mt-0.5 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
            <div>
              <h6
                className={`font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                Need help choosing?
              </h6>
              <ul
                className={`text-sm space-y-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <li>• Look for high ratings (4.0+)</li>
                <li>• Check relevant experience</li>
                <li>• Review completed deals</li>
                <li>• Consider specialization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2ChooseBroker;