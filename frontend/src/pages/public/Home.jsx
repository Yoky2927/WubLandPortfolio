import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import GridOverlay from "../../components/GridOverlay";
import Footer from "../../components/Footer";
import HouseSlider from "../../components/HouseSlider";
import BestChoiceSection from "../../components/BestChoiceSection";
import FloatingElements from "../../components/FloatingElements";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import Loader from "../../components/Loader";
import ProfileAvatar from "../../components/ProfileAvatar";
import ProfilePictureModal from "../../components/ProfilePictureModal.jsx";
import { useTheme } from "../../contexts/ThemeContext";

function Home() {
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Redirect logged-in users to their dashboard
  // In the useEffect for redirecting logged-in users:
  useEffect(() => {
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  
  console.log("🏠 Home.jsx - Auth Check:", {
    hasToken: !!token,
    userRole: userData.role,
    userData: userData,
    currentPath: window.location.pathname
  });

  // If we have EITHER a token OR user data with role, we're logged in
  if (token || userData.role) {
    let userRole = userData.role;
    
    // If we have token but no user role, decode the token to get role
    if (token && !userRole) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role;
        console.log("🏠 Home.jsx - Got role from token:", userRole);
      } catch (error) {
        console.error("❌ Home.jsx - Error decoding token:", error);
      }
    }

    if (userRole) {
      const roleRedirects = {
        super_admin: "/super-admin-dashboard",
        admin: "/admin-dashboard",
        support_agent: "/support-dashboard",
        support_lead: "/support-dashboard", 
        support_admin: "/support-dashboard",
        broker: "/user-dashboard",
        buyer: "/user-dashboard",
        seller: "/user-dashboard",
        renter: "/user-dashboard",
        user: "/user-dashboard",
      };

      const redirectPath = roleRedirects[userRole];
      console.log("🏠 Home.jsx - Redirect Decision:", {
        role: userRole,
        redirectPath: redirectPath,
        currentPath: window.location.pathname
      });

      if (redirectPath && window.location.pathname === '/') {
        console.log(`🔄 Home.jsx - Redirecting ${userRole} to: ${redirectPath}`);
        navigate(redirectPath, { replace: true });
      }
    }
  } else {
    console.log("🏠 Home.jsx - No token or user role found, staying on home page");
  }
}, [navigate]);

  const handleSignInClick = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      navigate("/login-register");
    }, 5000);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("http://localhost:5000/api/auth/check", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    fetchUserData();
  }, []);

  const handleProfilePictureUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/auth/upload-profile",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser((prev) => ({
          ...prev,
          profile_picture: data.profilePictureUrl,
        }));
        setShowProfileModal(false);
        alert("Profile picture updated successfully!");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload profile picture. Please try again.");
      throw error;
    }
  };

  const handleUsernameChange = (newUsername) => {
    setUser((prev) => ({
      ...prev,
      username: newUsername,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {isLoading && <Loader theme={theme} />}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <div className="relative min-h-screen m-0 p-0 flex flex-col items-center justify-center transition-all duration-500">
        {/* Header Section */}
        <header
          id="header"
          className="relative w-full max-w-[1580px] mx-auto px-4 sm:px-6 transition-all duration-500"
        >
          {/* Background Decorations */}
          <img
            className="absolute top-0 -left-[3vw] xs:-left-[15%] h-full w-auto max-w-[100px] sm:max-w-[100px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-[250px]"
            src="/vectors/tiletLeftY.svg"
            alt="Decor Tilet"
          />
          <img
            className="absolute top-0 -right-[3vw] xs:-right-[15%] h-full w-auto max-w-[100px] sm:max-w-[100px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-[250px]"
            src="/vectors/tiletRightY.svg"
            alt="Decor Tilet"
          />

          <div className="w-full">
            {/* Navigation Bar */}
            <div className="NavBar flex flex-col sm:flex-row items-center justify-between py-4 sm:py-6">
              <img
                src="/vectors/LogoY.svg"
                alt="Logo"
                className="logoTop relative top-8 left-5"
              />
              <nav className="w-full sm:w-auto flex-wrap">
                <ul
                  className={`flex flex-wrap justify-center relative space-x-4 sm:space-x-6 md:space-x-16 lg:space-x-28 sm:-left-52 md:-left-80 lg:-left-12 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  <li>
                    <a href="/properties" className="nav-link">
                      Property
                    </a>
                  </li>
                  <li>
                    <a href="#" className="nav-link">
                      Help
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("AboutUs")}
                      className="nav-link"
                    >
                      About Us
                    </button>
                  </li>
                  <li>
                    {user ? (
                      <div className="flex items-center space-x-4">
                        <ProfileAvatar
                          userProfilePicture={user?.profile_picture}
                          firstName={user?.first_name}
                          lastName={user?.last_name}
                          username={user?.username}
                          email={user?.email}
                          role={user?.role}
                          onLogout={handleLogout}
                          onUploadImage={() => setShowProfileModal(true)}
                          onUsernameChange={handleUsernameChange}
                        />
                        <span
                          className={
                            theme === "dark" ? "text-white" : "text-black"
                          }
                        >
                          {user.first_name} {user.last_name}
                        </span>
                      </div>
                    ) : (
                      <Link
                        to="/login-register"
                        onClick={handleSignInClick}
                        className="nav-link active:cursor-wait"
                      >
                        Sign In
                      </Link>
                    )}
                  </li>
                </ul>
              </nav>
            </div>

            {/* Hero Section */}
            <div className="w-full lg:w-[350px] mx-auto lg:mx-[19%] pt-[15vh] lg:pt-32 mb-6 text-center lg:text-left">
              <div className="px-[20vw] lg:px-0">
                <h1 className="text-[clamp(1.5rem,6vw,2.25rem)] lg:text-4xl">
                  <strong>
                    Homes Built on <span className="text-amber-400">Trust</span>
                    , Inspired by <span className="text-amber-400">Truth</span>!
                  </strong>
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <div className="w-full lg:w-[350px] mx-auto lg:mx-[19%] mb-6 text-center lg:text-left min-h-[120px]">
              <div className="px-[20vw] lg:px-0">
                <p className="text-[clamp(0.875rem,3vw,1.125rem)] lg:text-base">
                  Explore verified listings, connect with reliable agents, and
                  experience a new era of real estate built on transparency,
                  beauty, and community values.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4 sm:max-w-[350px] sm:mx-[30%] md:max-w-[400px] md:mx-[30%] lg:w-[460px] lg:mx-[19%] text-center lg:text-left flex flex-wrap items-stretch">
              <input
                type="search"
                className={`w-full shadow-lg py-2 sm:py-3 sm:text-sm md:text-base pl-12 pr-6 text-sm transition-all duration-500 ${
                  theme === "dark"
                    ? "bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-2 focus:ring-amber-400"
                    : "bg-white text-gray-900 placeholder-gray-500 focus:bg-gray-100 focus:ring-2 focus:ring-amber-400"
                }`}
                placeholder="Enter an Address, neighborhood, or city"
                aria-label="Search"
                aria-describedby="button-addon2"
              />
              <img
                src="/vectors/Search.svg"
                className="absolute left-3 sm:left-4 top-[40%] transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5"
                alt="Search"
              />
            </div>

            {/* House Slider */}
            <div
              className="hidden lg:block absolute right-0 top-0 mt-16 sm:mt-20 md:mt-24 lg:mt-32 mx-4 sm:mx-8 md:mx-16 lg:mx-24 xl:mx-48 2xl:mx-72"
              id="home"
            >
              <HouseSlider theme={theme} />
            </div>

            {/* Bottom Navigation */}
            <div className="NavBarBottom">
              <div className="mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20 py-4 sm:py-5 md:py-6 lg:py-7">
                <div className="overflow-x-auto hide-scrollbar">
                  <ul
                    className={`flex whitespace-nowrap justify-center space-x-4 sm:space-x-6 md:space-x-8 lg:space-x-10 ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                  >
                    <li>
                      <a
                        href="#"
                        className="nav-bottom-link text-sm sm:text-base md:text-lg duration-300"
                      >
                        Buy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="nav-bottom-link text-sm sm:text-base md:text-lg duration-300"
                      >
                        Sell
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="nav-bottom-link text-sm sm:text-base md:text-lg duration-300"
                      >
                        Register as Broker
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="nav-bottom-link text-sm sm:text-base md:text-lg duration-300"
                      >
                        Post your Property
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="nav-bottom-link text-sm sm:text-base md:text-lg duration-300"
                      >
                        Find an Agent
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Best Choice Section */}
        <div className="m-0 pb-5 w-full overflow-hidden">
          <BestChoiceSection theme={theme} />
        </div>

        {/* About Us Section */}
        <div
          id="AboutUs"
          className={`relative mb-5 w-full max-w-[1030px] h-auto min-h-[550px] px-4 md:px-6 lg:px-0
          ${
            theme === "dark"
              ? "bg-gradient-to-r from-[#332500] to-[#1a1200] border border-amber-400/30"
              : "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
          } overflow-hidden`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between p-4 md:p-6 lg:p-8">
            <div className="w-full lg:w-9/12 lg:mb-0 flex justify-center lg:justify-start">
              <img
                src="/vectors/AboutUs.svg"
                alt="About Us Image"
                className="w-full max-w-md lg:max-w-full h-auto"
              />
            </div>
            <div className="w-full lg:w-1/2 mt-10 lg:pl-3 xl:pl-5">
              <p className="text-amber-400 lg:text-left text-lg md:text-xl lg:text-2xl pb-2 font-semibold md:text-center">
                ABOUT US
              </p>
              <h1
                className={`lg:text-left mb-4 text-2xl md:text-3xl lg:text-4xl md:text-center font-bold ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                Who We Are?
              </h1>
              <div className="space-y-3 md:space-y-4 md:text-justify">
                <p
                  className={`text-sm md:text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  WubLand is a growing Ethiopian real estate agency that
                  originally offered properties of its own, and now also
                  connects clients with trusted third-party listings.
                </p>
                <p
                  className={`text-sm md:text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Our platform brings together buyers, sellers, renters, and
                  leasers with both the companies and freelancing brokers
                  creating a one-stop hub for real estate needs across the
                  country.
                </p>
                <p
                  className={`text-sm md:text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Whether you're looking for a new home or a place to grow your
                  real estate career as a broker, WubLand is your trusted
                  partner.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div
          className={`relative w-full max-w-[1030px] h-auto my-4 px-4 md:px-6 lg:px-0`}
        >
          <div className="text-center mb-8">
            <p className="text-amber-400 text-lg md:text-xl lg:text-2xl pb-2 font-semibold text-left">
              Discover Your Next Property
            </p>
            <h1
              className={`mb-6 text-2xl md:text-3xl lg:text-4xl font-bold text-left ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              What can you do here?
            </h1>
          </div>

          <div
            className={`flex flex-col md:flex-row flex-wrap justify-center gap-6 lg:gap-8`}
          >
            {/* Buy House Card */}
            <div
              className={`relative Cards ${
                theme === "dark" ? "dark" : "light"
              }`}
            >
              <div className={`w-full flex justify-center pt-6`}>
                <img
                  src="/vectors/BuyHouse.svg"
                  alt="BuyHouse"
                  className="w-4/5 max-w-[250px]"
                />
              </div>
              <div className={`p-5 md:p-6 -mt-3`}>
                <p
                  className={`text-xl md:text-2xl text-center font-semibold mb-3 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Buy a House
                </p>
                <p
                  className={`px-2 text-center text-sm md:text-base mb-14 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Find your place suiting your style and need by the help of
                  trusted professionals recommending you with the best
                  properties.
                </p>
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button className={`Button2 px-6 py-2 text-sm md:text-base`}>
                  Browse House
                </button>
              </div>
            </div>

            {/* Sell House Card */}
            <div
              className={`relative Cards ${
                theme === "dark" ? "dark" : "light"
              }`}
            >
              <div className={`w-full flex justify-center pt-6`}>
                <img
                  src="/vectors/SellHouse.svg"
                  alt="SellHouse"
                  className="w-4/5 max-w-[220px]"
                />
              </div>
              <div className={`p-5 md:p-6 mt-3`}>
                <p
                  className={`text-xl md:text-2xl text-center font-semibold mb-3 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Sell a House
                </p>
                <p
                  className={`px-2 text-center text-sm md:text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Leave the tedious work for us and we'll assist you in selling
                  your property and have a successful sale.
                </p>
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button className={`Button2 px-6 py-2 text-sm md:text-base`}>
                  See Your Options
                </button>
              </div>
            </div>

            {/* Rent House Card */}
            <div
              className={`relative Cards ${
                theme === "dark" ? "dark" : "light"
              }`}
            >
              <div className={`w-full flex justify-center pt-6`}>
                <img
                  src="/vectors/RentHouse.svg"
                  alt="RentHouse"
                  className="w-4/5 max-w-[220px]"
                />
              </div>
              <div className={`p-5 md:p-6`}>
                <p
                  className={`text-xl md:text-2xl text-center font-semibold mb-3 ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Rent a House
                </p>
                <p
                  className={`px-2 text-center text-sm md:text-base ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Enjoy the seamless online experience as you search for renting
                  properties, and apply to pay your rent monthly or yearly with
                  in the platform.
                </p>
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button className={`Button2 px-6 py-2 text-sm md:text-base`}>
                  Find Rentals
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div
          className={`relative w-full max-w-[1030px] h-auto mt-10 mb-10 px-4 md:px-6 lg:px-0`}
        >
          <div className="text-center mb-8 relative z-10">
            <p className="text-amber-400 text-lg md:text-xl lg:text-2xl pb-2 font-semibold">
              Testimonials
            </p>
            <h1
              className={`mb-6 text-2xl md:text-3xl lg:text-4xl font-bold ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              Read What Others Have to Say
            </h1>
          </div>
          <div className="flex flex-col md:flex-row flex-wrap justify-center gap-6 lg:gap-8 relative z-10">
            {/* Testimonial 1 */}
            <div
              className={`TestimonialsCard ${
                theme === "dark"
                  ? "TestimonialsCard-dark"
                  : "TestimonialsCard-light"
              }`}
            >
              <img
                src="/vectors/Profile1.svg"
                alt="Profile Pic"
                className="TestimonialsProfile"
              />
              <div className="flex-1">
                <p className="testimonial-text">
                  <q>
                    The listings were up-to-date and the brokers were
                    professional. I never thought renting a house could be this
                    smooth.
                  </q>
                </p>
                <p className="testimonial-author">Marcus Samuelsson</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div
              className={`TestimonialsCard ${
                theme === "dark"
                  ? "TestimonialsCard-dark"
                  : "TestimonialsCard-light"
              }`}
            >
              <img
                src="/vectors/Profile2.svg"
                alt="Profile Pic"
                className="TestimonialsProfile"
              />
              <div className="flex-1">
                <p className="testimonial-text">
                  <q>
                    I found my dream apartment in less than a week. The platform
                    is super easy to use and very reliable. Highly recommended!
                  </q>
                </p>
                <p className="testimonial-author">Hanan Tarq</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div
              className={`TestimonialsCard ${
                theme === "dark"
                  ? "TestimonialsCard-dark"
                  : "TestimonialsCard-light"
              }`}
            >
              <img
                src="/vectors/Profile3.svg"
                alt="Profile Pic"
                className="TestimonialsProfile"
              />
              <div className="flex-1">
                <p className="testimonial-text">
                  <q>
                    What I love most is how I can compare houses from different
                    cities in one place. It saved me so much time during my
                    relocation.
                  </q>
                </p>
                <p className="testimonial-author">Samuel Nigatu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Elements */}
      <FloatingElements theme={theme} />

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onUpload={handleProfilePictureUpload}
        userProfilePicture={user?.profile_picture}
        theme={theme}
        firstName={user?.first_name}
        lastName={user?.last_name}
        role={user?.role}
      />
    </div>
  );
}

export default Home;
