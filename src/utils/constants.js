import React from 'react'
import { GiCompass, GiDiamondHard, GiStabbedNote } from 'react-icons/gi'

export const links = [
  {
    id: 1,
    text: 'Start group',
    url: '/startagroup',
  },
  {
    id: 2,
    text: 'Help',
    url: '/help',
  },
  {
    id: 3,
    text: 'Faq',
    url: '/Faq',
  },
]

export const services = [
  {
    id: 1,
    icon: <GiCompass />,
    title: 'mission',
    text:
      ' Our mission is to revolutionize the chit fund industry by providing a modern and efficient solution that empowers individuals and businesses to manage their chit funds with ease. We are committed to simplifying the process, making it accessible to everyone, and ensuring the utmost transparency and security in all chit fund operations.',
  },
  {
    id: 2,
    icon: <GiDiamondHard />,
    title: 'vision',
    text:
      'Our vision is to be the leading provider of chit fund management solutions, setting new standards of excellence in the industry. We aspire to create a future where individuals and businesses can achieve their financial goals with the utmost convenience and trust. We are committed to fostering a community where chit fund participants can prosper and save, making their dreams a reality.',
  },
  {
    id: 3,
    icon: <GiStabbedNote />,
    title: 'history',
    text:
      'Founded in 2019, our journey began with a vision to simplify and modernize the chit fund industry. Over the years, we have dedicated ourselves to creating an innovative and user-friendly platform for chit fund management. Our commitment to transparency, security, and customer satisfaction has driven us to become a trusted name in the chit fund sector. We have grown, evolved, and continuously adapted to meet the changing needs of our clients.',
  },
]

export const products_url = 'https://course-api.com/react-store-products'

export const single_product_url = `https://course-api.com/react-store-single-product?id=`

export const TRACKING_ID ='G-2S6943EHTN'