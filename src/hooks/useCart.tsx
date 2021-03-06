import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');    

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try { 

      const stocks = ( await api.get<Stock>(`stock/${productId}`)).data;
      const existProduct = cart.find(product => product.id === productId );   
      
      if(!existProduct){
        const products = await api.get<Product>(`products/${productId}`);
        const resultProduct = products.data;

        const newCart = [...cart, 
          {
          id: resultProduct.id,
          title: resultProduct.title,
          price: resultProduct.price,
          image: resultProduct.image,
          amount: 1,
        }
      ]
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else{
        if(existProduct.amount < stocks.amount){
          const newCart = cart.map(item => item.id === existProduct.id && item.amount <= stocks.amount ?
             {...item, amount: item.amount + 1}: item);

             setCart(newCart);
             localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(item => item.id === productId);

      if(!productExist){
        toast.error('Erro na remo????o do produto');
      }else{
        const newCart = cart.filter(item => item.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return

    try {
      const stocks = (await api.get<Stock>(`/stock/${productId}`)).data;

      if (!stocks) {
        toast.error('Erro na altera????o de quantidade do produto');
      } else if (amount > stocks.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        const updatedProductAmount = cart.map(item => {
          return (
            item.id === productId ?
              { ...item, amount: amount } :
              item
          );
        })
        setCart(updatedProductAmount);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProductAmount));
      }
    } catch {
      toast.error('Erro na altera????o de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
