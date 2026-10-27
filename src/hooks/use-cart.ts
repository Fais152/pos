import { useReducer, useEffect } from 'react';
import { Product, OrderType } from '../lib/types';

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  qty: number;
  note?: string;
}

export interface CartState {
  items: CartItem[];
  orderType: OrderType;
  tableLabel: string;
  discountType: 'nominal' | 'percent';
  discountValue: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'SET_QTY'; productId: string; qty: number }
  | { type: 'SET_NOTE'; productId: string; note: string }
  | { type: 'SET_ORDER_TYPE'; orderType: OrderType }
  | { type: 'SET_TABLE_LABEL'; label: string }
  | { type: 'SET_DISCOUNT'; discountType: 'nominal' | 'percent'; discountValue: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: CartState };

const STORAGE_KEY = 'pos_kafe_cart';

const initialState: CartState = {
  items: [],
  orderType: 'dine_in',
  tableLabel: '',
  discountType: 'nominal',
  discountValue: 0,
};

function parseStoredCart(saved: string): CartState {
  const parsed = JSON.parse(saved) as Partial<CartState> | null;
  if (!parsed || typeof parsed !== 'object') return initialState;

  const items = Array.isArray(parsed.items)
    ? parsed.items
        .filter(
          (item): item is CartItem =>
            !!item &&
            typeof item.productId === 'string' &&
            typeof item.productName === 'string'
        )
        .map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: Math.max(0, Number(item.unitPrice) || 0),
          qty: Math.min(99, Math.floor(Number(item.qty) || 0)),
          note: typeof item.note === 'string' ? item.note.slice(0, 200) : undefined,
        }))
        .filter((item) => item.qty > 0)
    : [];

  const discountType = parsed.discountType === 'percent' ? 'percent' : 'nominal';
  const discountValue = Math.max(0, Number(parsed.discountValue) || 0);

  return {
    items,
    orderType: parsed.orderType === 'takeaway' ? 'takeaway' : 'dine_in',
    tableLabel: typeof parsed.tableLabel === 'string' ? parsed.tableLabel.slice(0, 60) : '',
    discountType,
    discountValue: discountType === 'percent' ? Math.min(100, discountValue) : discountValue,
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.product.id);
      if (existing) {
        if (existing.qty >= 99) return state;
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            productId: action.product.id,
            productName: action.product.name,
            unitPrice: action.product.price,
            qty: 1,
          },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case 'SET_QTY': {
      if (!Number.isFinite(action.qty)) return state;
      const qty = Math.min(99, Math.floor(action.qty));
      if (qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty } : i
        ),
      };
    }
    case 'SET_NOTE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, note: action.note } : i
        ),
      };
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.orderType };
    case 'SET_TABLE_LABEL':
      return { ...state, tableLabel: action.label };
    case 'SET_DISCOUNT':
      return { ...state, discountType: action.discountType, discountValue: action.discountValue };
    case 'CLEAR':
      return initialState;
    case 'HYDRATE':
      return action.state;
    default:
      return state;
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState, (initial) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return parseStoredCart(saved);
        } catch {
          return initial;
        }
      }
    }
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const actions = {
    addItem: (product: Product) => dispatch({ type: 'ADD_ITEM', product }),
    removeItem: (productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }),
    setQty: (productId: string, qty: number) => dispatch({ type: 'SET_QTY', productId, qty }),
    setNote: (productId: string, note: string) => dispatch({ type: 'SET_NOTE', productId, note }),
    setOrderType: (orderType: OrderType) => dispatch({ type: 'SET_ORDER_TYPE', orderType }),
    setTableLabel: (label: string) => dispatch({ type: 'SET_TABLE_LABEL', label }),
    setDiscount: (discountType: 'nominal' | 'percent', discountValue: number) =>
      dispatch({ type: 'SET_DISCOUNT', discountType, discountValue }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };

  return { state, ...actions };
}