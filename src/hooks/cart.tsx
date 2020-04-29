import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('productsInCart');
      setProducts(JSON.parse(storageProducts || '[]'));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async item => {
      if (products.findIndex(product => item.id === product.id) === -1) {
        setProducts([...products, { ...item, quantity: 1 }]);
        await AsyncStorage.setItem('productsInCart', JSON.stringify(products));
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product => {
          if (product.id === id) {
            const quantity = product.quantity + 1;
            return { ...product, quantity };
          }
          return product;
        }),
      );
      await AsyncStorage.setItem('productsInCart', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products
          .map(product => {
            if (product.id === id) {
              const quantity = product.quantity - 1;
              return { ...product, quantity };
            }
            return product;
          })
          .filter(product => product.quantity > 0),
      );
      await AsyncStorage.setItem('productsInCart', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
