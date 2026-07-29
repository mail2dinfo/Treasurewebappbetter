import React from 'react'
import { services } from '../utils/constants'
import { FaBrain, FaRocket, FaShieldAlt } from 'react-icons/fa'

const Services = () => {
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-red-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-100 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-100 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-red-100 to-blue-100 text-gray-800 text-sm font-medium mb-6">
            <FaBrain className="w-4 h-4 mr-2 text-red-600" />
            AI-Powered Solutions
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Treasure - Powered by AI
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of chit fund management with our cutting-edge AI technology
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const { id, icon, title, text } = service
            const bgColors = ['bg-red-50', 'bg-blue-50', 'bg-green-50']
            const borderColors = ['border-red-200', 'border-blue-200', 'border-green-200']
            const iconColors = ['text-red-600', 'text-blue-600', 'text-green-600']

            return (
              <div
                key={id}
                className={`${bgColors[index]} ${borderColors[index]} border-2 rounded-2xl p-5 sm:p-8 text-center hover:shadow-xl transition-all duration-300 md:transform md:hover:-translate-y-2 group`}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-16 h-16 ${bgColors[index].replace('50', '100')} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`${iconColors[index]} text-2xl`}>
                      {icon}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                  {title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {text}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <FaShieldAlt className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-sm font-medium">Secure & Reliable</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2 text-gray-600">
              <FaRocket className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-sm font-medium">Fast & Efficient</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2 text-gray-600">
              <FaBrain className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Services
