import { useTheme } from "../contexts/ThemeContext";

const Footer = () => {
  const { theme } = useTheme();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className={`bg-black/70 w-full text-white p-4 md:p-6 mt-6 z-0`}>
      <div className="max-w-[1030px] mx-auto">
        <div className="relative flex flex-col lg:flex-row flex-wrap gap-6 md:mx-11 md:gap-8 mb-2 justify-center lg:justify-between">
          {/* Logo */}
          <div className="w-full lg:w-1/4 mb-4 lg:mb-0 flex justify-center  lg:justify-start lg:-ml-[6%]">
            <img
              src="/vectors/BigLogo.svg"
              alt="Big Logo"
              className="w-32 md:w-40 lg:w-48 xl:w-56 mx-auto lg:mx-0 "
            />
          </div>

          {/* Company Links */}
          <div className="w-full lg:w-1/5 mb-4 lg:mb-0 text-center lg:text-left lg:-ml-[6%]">
            <h3 className="font-bold text-sm md:text-base mb-3">COMPANY</h3>
            <div className="space-y-2">
              <p className="text-xs md:text-sm">
                <button
                  onClick={() => scrollToSection("home")}
                  className="hover:text-amber-400 transition-colors"
                >
                  Home
                </button>
              </p>
              <p className="text-xs md:text-sm">
                <button
                  onClick={() => scrollToSection("AboutUs")}
                  className="hover:text-amber-400 transition-colors"
                >
                  About
                </button>
              </p>
              <p className="text-xs md:text-sm">
                <a
                  href="/properties"
                  className="hover:text-amber-400 transition-colors"
                >
                  Properties
                </a>
              </p>
              <p className="text-xs md:text-sm">
                <a
                  href="#"
                  className="hover:text-amber-400 transition-colors"
                >
                  Request to be Companies Broker
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-full lg:w-1/5 mb-4 lg:mb-0 text-center lg:text-left lg:-ml-[6%]">
            <h3 className="font-bold text-sm md:text-base mb-3">
              QUICK LINKS
            </h3>
            <div className="space-y-2">
              <p className="text-xs md:text-sm hover:text-amber-400 transition-colors cursor-pointer">
                Agent
              </p>
              <p className="text-xs md:text-sm hover:text-amber-400 transition-colors cursor-pointer">
                FAQs
              </p>
              <p className="text-xs md:text-sm hover:text-amber-400 transition-colors cursor-pointer">
                Help/Support
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="w-full lg:w-[180px] mb-4 lg:mb-0 text-center lg:text-left lg:-ml-[6%]">
            <h3 className="font-bold text-sm md:text-base mb-3">
              LOCATION
            </h3>
            <p className="text-xs md:text-sm leading-relaxed">
              Debark University Main Campus, near Debark Town Center, North
              Gondar, Ethiopia
            </p>
          </div>

          {/* Social Media & Contact */}
          <div className="w-full lg:w-1/4 text-center lg:text-left lg:-ml-[4%] lg:-mr-[10%]">
            <h3 className="font-bold text-sm md:text-base mb-3">
              FOLLOW US ON
            </h3>
            <div className="flex justify-center lg:justify-start space-x-2 md:space-x-3 mb-2">
              {["Instagram", "LinkedIn", "Facebook", "X", "Telegram"].map(
                (platform) => (
                  <a
                    key={platform}
                    href="#"
                    className="group transition-all duration-300 hover:scale-110"
                  >
                    <img
                      src={`/vectors/${platform}.svg`}
                      alt={platform}
                      className="w-4 h-4 md:w-5 md:h-5 transition-all duration-300 group-hover:brightness-0 group-hover:invert group-hover:sepia group-hover:saturate-1000 group-hover:hue-rotate-0 group-hover:brightness-90"
                    />
                  </a>
                )
              )}
            </div>
            <h3 className="font-bold text-sm md:text-base mb-3">
              Contact us
            </h3>
            <div className="space-y-1 text-xs md:text-sm">
              <a
                href="mailto:WubLand@gmail.com"
                className="block hover:text-amber-400 transition-colors"
              >
                Email: WubLand@gmail.com
              </a>
              <a
                href="tel:+251953152001"
                className="block hover:text-amber-400 transition-colors"
              >
                Phone: +251 953 15 2001
              </a>
            </div>
          </div>
        </div>

        {/* Footer Image */}
        <div className="mt-2 md:mt-6 flex justify-center">
          <img
            src="/vectors/FooterSmallTown.svg"
            alt="Small Town image"
            className="w-full max-w-[800px] lg:max-w-[1000px] xl:max-w-[1100px]"
          />
        </div>

        {/* Copyright */}
        <div className="text-center text-xs md:text-sm mt-4 pb-2">
          Made by YOKABD | <br /> © {new Date().getFullYear()} WubLand. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;