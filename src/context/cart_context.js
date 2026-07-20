import React, { useContext } from 'react'

const CartContext = React.createContext()

export const CartProvider = ({ children }) => {
  return (
    <CartContext.Provider value='cart context'>{children}</CartContext.Provider>
  )
}
// make sure use
export const useCartContext = () => {
  return useContext(CartContext)
}
