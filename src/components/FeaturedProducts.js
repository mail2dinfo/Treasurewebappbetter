import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaArrowRight, FaMotorcycle, FaCoins } from "react-icons/fa";

const FeaturedProducts = () => {
    const financeApps = [
        {
            id: 1,
            title: "Chit Fund Management",
            description: "Complete chit fund management with group creation, subscriber management, auction handling, and automated payments.",
            icon: (
                <div className="relative">
                    <svg className="w-32 h-32 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134 132" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M46.4031 20.8161C43.1421 23.9695 35.9745 21.9429 31.3061 21.9429C21.8075 21.9429 11.983 22.5677 4.79791 29.7536C2.99605 31.5555 1.78632 34.6683 1.24759 37.0909C0.53514 40.2954 -0.524764 43.7293 0.300853 47.031C3.06141 58.074 18.0197 61.4036 22.7854 70.9356C24.7338 74.8318 15.4393 77.9661 13.5553 79.2197C1.83255 87.016 0.621218 97.082 1.48429 103.124C3.00244 113.75 11.1502 122.662 21.8386 124.189C28.5838 125.152 35.5195 121.996 41.7196 119.928C46.9012 118.201 54.5437 112.021 60.4178 114.958C65.6911 117.595 70.958 124.079 75.0917 128.212C78.8516 131.972 87.7038 131.334 92.3691 130.816C94.7495 130.551 97.8687 129.601 99.9431 128.212C117.864 116.217 99.9279 101.346 100.18 98.8639C100.593 94.7924 109.204 96.6445 115.327 94.6036C127.07 90.6891 135.853 77.4537 132.368 65.2551C130.045 57.1257 121.611 52.9912 114.38 50.5813C111.411 49.5915 102.22 50.7853 100.89 46.7943C100.114 44.4657 101.985 28.0123 101.471 22.7638C99.5286 2.94021 78.8165 -2.6893 65.6298 1.11364C55.5247 4.0272 50.7232 16.6378 46.4031 20.8161Z"
                            fill="#DE1738"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FaUsers className="w-8 h-8 text-white" />
                    </div>
                </div>
            ),
            bgColor: "bg-red-50",
            borderColor: "border-red-200"
        },
        {
            id: 2,
            title: "Daily Collection",
            description: "Streamline your daily collection processes with automated tracking, payment reminders, and comprehensive reporting.",
            icon: (
                <div className="relative">
                    <svg className="w-32 h-32 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134 119" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M29.0752 14.4541C34.1047 9.42459 45.4206 4.2086 47.8569 3.72102C48.9163 3.50922 51.159 3.05092 53.4319 2.58646C55.73 2.11683 58.059 1.6409 59.2266 1.40714C66.3696 -0.0212925 74.9534 -0.607963 82.1306 0.827486C84.0076 1.20295 85.8636 1.50794 87.6972 1.80925C94.1614 2.87151 100.347 3.88804 106.194 7.78552C113.566 12.7007 116.47 18.9336 119.788 26.0558C120.533 27.6537 121.298 29.2964 122.139 30.979C133.554 53.8081 141.529 92.1065 117.5 110.128C110.668 115.251 103.064 115.373 95.3929 115.496C91.7346 115.555 88.0614 115.614 84.45 116.216C71.882 118.31 55.5826 119.13 42.701 117.376C32.2854 115.957 18.1931 105.685 7.91088 93.8922C4.33969 89.7959 2.37758 81.9228 1.09271 76.7672C1.04518 76.5765 0.998573 76.3895 0.952846 76.2065C-4.4691 54.5195 14.3712 29.1573 29.0752 14.4541Z"
                            fill="#2563EB"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FaCoins className="w-8 h-8 text-white" />
                    </div>
                </div>
            ),
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200"
        },
        {
            id: 3,
            title: "Two Wheeler Loan",
            description: "Comprehensive two-wheeler loan management with EMI tracking, payment schedules, and customer management.",
            icon: (
                <div className="relative">
                    <svg className="w-32 h-32 mx-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 133 116" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.50597 1.58869C5.90452 2.17401 3.03696 13.8994 2.48267 19.1791C1.50429 28.51 1.66798 33.8043 1.14392 41.1444C-0.0642702 58.0695 1.39497 75.4446 1.87831 92.469C1.95912 95.3154 1.32721 107.186 3.31309 109.062C7.3712 112.896 31.9019 100.38 37.5 101.018C55.5476 103.075 59.7315 116.138 77.9871 115.62C89.0199 115.306 100.321 116.464 111.24 115.158C115.57 114.64 120.825 113.945 123.89 110.701C125.388 109.115 125.159 103.017 125.302 101.018C126.049 90.5521 126.916 80.019 128.508 69.5894C130.539 56.2808 130.599 42.611 131.702 29.2418C132.172 23.5302 133.651 13.9471 130.88 8.77523C129.881 6.91187 126.505 7.01367 124.796 6.77813C116.52 5.63894 72.9055 19.5406 64.5 19.1791C39.5635 18.1084 49.5749 2.49796 24.8183 0.456199C20.18 0.074057 11.7503 0.0389955 7.50597 1.58869Z"
                            fill="#059669"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <FaMotorcycle className="w-8 h-8 text-white" />
                    </div>
                </div>
            ),
            bgColor: "bg-green-50",
            borderColor: "border-green-200"
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Our Finance Management Solutions
                    </h2>
                    <p className="text-lg text-gray-600 mb-4">
                        Comprehensive tools for all your financial business needs
                    </p>
                    <div className="w-24 h-1 bg-red-600 mx-auto rounded-full"></div>
                </div>

                {/* Finance Apps Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {financeApps.map((app, index) => (
                        <div key={app.id} className="relative">
                            {/* App Card */}
                            <div className={`${app.bgColor} ${app.borderColor} border-2 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2`}>
                                {/* App Number */}
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                        {app.id}
                                    </div>
                                </div>

                                {/* Icon */}
                                <div className="mb-6">
                                    {app.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                    {app.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {app.description}
                                </p>
                            </div>

                            {/* Arrow (except for last app) */}
                            {index < financeApps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center">
                                        <FaArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <div className="text-center">
                    <Link
                        to="/signup"
                        className="inline-flex items-center px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Join Treasure
                        <FaArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
