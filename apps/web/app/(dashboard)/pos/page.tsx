'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface CartItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  stock: number;
}

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  // Search products
  const { data: productsData } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get(`/products?search=${search}&limit=12`).then(r => r.data),
    enabled: search.length > 0 || true,
  });

  const products = productsData?.data || [];

  // Create sale mutation
  const saleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales', saleData).then(r => r.data),
    onSuccess: (data) => {
      setReceipt(data);
      setCart([]);
      setAmountPaid('');
    },
  });

  const addToCart = (product: any) => {
    const totalStock = product.batches?.reduce((s: number, b: any) => s + b.quantity, 0) || product.totalStock || 0;
    if (totalStock === 0) return alert('Out of stock');

    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= totalStock) return alert('Not enough stock') as any || prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        barcode: product.barcode || '',
        quantity: 1,
        unitPrice: Number(product.sellingPrice),
        vatRate: Number(product.vatRate),
        stock: totalStock,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = i.quantity + delta;
      if (newQty < 1) return i;
      if (newQty > i.stock) return i;
      return { ...i, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const vatTotal = cart.reduce((s, i) => s + (i.unitPrice * i.quantity * i.vatRate / 100), 0);
  const total = subtotal + vatTotal;
  const change = Number(amountPaid) - total;

  const checkout = () => {
    if (cart.length === 0) return alert('Cart is empty');
    if (Number(amountPaid) < total) return alert('Insufficient payment amount');

    saleMutation.mutate({
      items: cart.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      paymentMethod,
      amountPaid: Number(amountPaid),
    });
  };

  if (receipt) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Sale Complete!</h2>
        <p className="text-gray-500 text-sm mb-6">Receipt: {receipt.receiptNo}</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold">{formatKES(receipt.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paid</span>
            <span className="font-semibold">{formatKES(receipt.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-500">Change</span>
            <span className="font-bold text-emerald-600">{formatKES(receipt.change)}</span>
          </div>
        </div>
        <button
          onClick={() => setReceipt(null)}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          New Sale
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Products panel */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or scan barcode..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto">
          {products.map((p: any) => {
            const stock = p.totalStock ?? p.batches?.reduce((s: number, b: any) => s + b.quantity, 0) ?? 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={stock === 0}
                className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-emerald-400 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="text-2xl mb-2">💊</div>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-xs text-gray-400 mt-1">{p.genericName || p.unit}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-emerald-600 font-bold text-sm">{formatKES(p.sellingPrice)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${stock > 10 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {stock}
                  </span>
                </div>
              </button>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart panel */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-3">
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Cart</h2>
            <span className="text-sm text-gray-400">{cart.length} items</span>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-8 text-gray-300">
                <ShoppingCart size={32} className="mx-auto mb-2" />
                <p className="text-sm">Add products to cart</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-emerald-600">{formatKES(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatKES(item.unitPrice * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT</span><span>{formatKES(vatTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg border-t pt-2">
              <span>Total</span><span className="text-emerald-600">{formatKES(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { method: 'CASH', icon: Banknote, label: 'Cash' },
              { method: 'MPESA', icon: Smartphone, label: 'M-Pesa' },
              { method: 'CARD', icon: CreditCard, label: 'Card' },
            ].map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method as any)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
                  paymentMethod === method
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Amount paid */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Amount Received (KES)</label>
            <input
              type="number"
              value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Change */}
          {Number(amountPaid) > 0 && (
            <div className={`flex justify-between text-sm font-semibold px-3 py-2 rounded-xl ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <span>Change</span>
              <span>{formatKES(Math.max(0, change))}</span>
            </div>
          )}

          {/* Checkout button */}
          <button
            onClick={checkout}
            disabled={cart.length === 0 || !amountPaid || saleMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            {saleMutation.isPending ? 'Processing...' : `Complete Sale · ${formatKES(total)}`}
          </button>

          {saleMutation.isError && (
            <p className="text-red-500 text-xs text-center">
              {(saleMutation.error as any)?.response?.data?.message || 'Sale failed'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
