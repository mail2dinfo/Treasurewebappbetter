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
]

export const services = [
  {
    id: 1,
    icon: <GiCompass />,
    title: 'Our promise',
    text:
      'We help small finance businesses run smoothly — chit funds, collections, and loans — without complicated software. Simple screens, clear reports, and less paperwork every day.',
  },
  {
    id: 2,
    icon: <GiDiamondHard />,
    title: 'Who it is for',
    text:
      'Built for chit fund organisers, daily collectors, and loan agents who want to know exactly who paid, who is pending, and how much cash is in hand — anytime, anywhere.',
  },
  {
    id: 3,
    icon: <GiStabbedNote />,
    title: 'Since 2019',
    text:
      'We started with one goal: make finance business management easy for everyone. Today MyTreasure supports many businesses with one login and apps that grow with you.',
  },
]

export const products_url = 'https://course-api.com/react-store-products'

export const single_product_url = `https://course-api.com/react-store-single-product?id=`

export const TRACKING_ID ='G-2S6943EHTN'