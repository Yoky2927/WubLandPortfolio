// frontend/src/data/sampleBrokers.js

// Real brokers from your database
export const sampleBrokers = [
  {
    id: 3,
    name: "Beza Hilemariam",
    profile_picture: "/uploads/profiles/beza.jpg",
    rating: "4.8",
    completed_deals: 47,
    broker_type: "internal",
    years_experience: 5,
    specialization: ["residential", "luxury", "commercial"],
    commission_rate: "2.5%",
    service_fee: 0,
    languages: ["english", "amharic"],
    service_areas: ["Addis Ababa", "Bole", "Cazanchise", "Kirkos"],
    is_available: true,
    is_verified: true,
    bio: "Premium internal real estate broker with extensive experience in luxury residential and commercial properties across Addis Ababa.",
    total_reviews: 23,
    phone: "+251933445566",
    email: "beza@wubland.com",
    company: "WubLand Premium Properties",
    license_number: "ET-BRK-2020-003",
    max_clients: 10,
    current_active_clients: 3
  },
  {
    id: 13,
    name: "Elias Kebede",
    profile_picture: null,
    rating: "4.6",
    completed_deals: 28,
    broker_type: "external",
    years_experience: 4,
    specialization: ["residential", "apartments", "rental"],
    commission_rate: "2%",
    service_fee: 500,
    languages: ["english", "amharic", "tigrigna"],
    service_areas: ["Mekele", "Adigrat", "Axum", "Adwa"],
    is_available: true,
    is_verified: true,
    bio: "Independent real estate broker specializing in residential properties and rental markets across Northern Ethiopia.",
    total_reviews: 15,
    phone: "+251999001122",
    email: "elias@wubland.com",
    company: "Elias Realty Services",
    license_number: "ET-BRK-2021-013",
    max_clients: 8,
    current_active_clients: 2
  }
];

export default sampleBrokers;