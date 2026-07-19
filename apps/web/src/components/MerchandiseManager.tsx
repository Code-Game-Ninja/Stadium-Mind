import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ShoppingBag, Plus, X, Star, BellRing } from 'lucide-react';
import { api } from '@/lib/api';
import type { MerchandiseItem } from '@stadiummind/shared';


const AVAILABLE_SHOPS = [
  'Main Entrance Store',
  'North Stand Kiosk',
  'South Stand Kiosk',
  'VIP Lounge Level 2',
  'Club Member Store'
];

export function MerchandiseManager({ matchId }: { matchId: string }) {
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [restockNotification, setRestockNotification] = useState<{ itemName: string } | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    stock: '',
    imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80',
    isExclusive: false,
    exclusiveShops: [] as string[]
  });

  const refreshMerchandise = useCallback(async () => {
    try {
      const res = await api.getMerchandise(matchId);
      setMerchandise(res.merchandise);
    } catch (e) {
      console.error(e);
    }
  }, [matchId]);

  useEffect(() => {
    refreshMerchandise();
  }, [refreshMerchandise]);

  const handleUpdateStock = async (id: string, newStock: number) => {
    const item = merchandise.find(m => m.id === id);
    // Optimistic update
    if (item) {
      setMerchandise(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
    }
    
    if (item && item.stock === 0 && newStock > 0) {
      setRestockNotification({ itemName: item.name });
      setTimeout(() => setRestockNotification(null), 5000);
    }
    
    try {
      await api.updateMerchandiseStock(matchId, id, newStock);
      // Refresh to ensure exact sync
      refreshMerchandise();
    } catch (err) {
      console.error(err);
      refreshMerchandise(); // Revert on failure
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.stock) return;

    try {
      await api.addMerchandiseItem(matchId, {
        name: newItem.name,
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock, 10),
        imageUrl: newItem.imageUrl,
        isExclusive: newItem.isExclusive,
        exclusiveShops: newItem.isExclusive ? newItem.exclusiveShops : undefined
      });
      refreshMerchandise();
    } catch (err) {
      console.error(err);
    }

    setShowAddForm(false);
    setNewItem({
      name: '',
      price: '',
      stock: '',
      imageUrl: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80',
      isExclusive: false,
      exclusiveShops: []
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-fast relative">
      {restockNotification && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 absolute top-0 left-1/2 -translate-x-1/2 -mt-16 z-10 w-full max-w-md">
          <div className="bg-signal-green text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <BellRing className="h-5 w-5 animate-bounce" />
            <div>
              <div className="text-sm font-bold">Back-in-Stock Notification Sent!</div>
              <div className="text-xs font-medium text-green-100">Broadcasted to fans watching "{restockNotification.itemName}"</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-signal-amber/10 to-signal-amber/5 text-signal-amber border border-signal-amber/20 shadow-sm flex items-center justify-center">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Merchandise Inventory</h2>
            <p className="text-sm font-medium text-slate-500">Manage stock levels and add new products.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary py-2 flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto pt-24 pb-12">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-800">Add New Merchandise</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input w-full" placeholder="e.g. Away Jersey" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Price ($)</label>
                  <input required type="number" min="0" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="input w-full" placeholder="90.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Initial Stock</label>
                  <input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className="input w-full" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Image URL</label>
                <input required type="url" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="input w-full" placeholder="https://..." />
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={newItem.isExclusive} onChange={e => setNewItem({...newItem, isExclusive: e.target.checked})} className="rounded border-slate-300 text-pitch-500 focus:ring-pitch-500 h-5 w-5 transition-colors" />
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-signal-amber fill-signal-amber" />
                    Make this an Exclusive Item
                  </span>
                </label>
                <p className="text-xs text-slate-500 mt-1.5 ml-8">Exclusive items are only sold at specific locations.</p>
              </div>

              {newItem.isExclusive && (
                <div className="ml-8 animate-fade-in-fast bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Exclusive Shops</label>
                  <div className="space-y-2">
                    {AVAILABLE_SHOPS.map(shop => (
                      <label key={shop} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={newItem.exclusiveShops.includes(shop)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewItem({...newItem, exclusiveShops: [...newItem.exclusiveShops, shop]});
                            } else {
                              setNewItem({...newItem, exclusiveShops: newItem.exclusiveShops.filter(s => s !== shop)});
                            }
                          }}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4 transition-colors" 
                        />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{shop}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary py-2">Cancel</button>
                <button type="submit" className="btn-primary py-2">Add Merchandise</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {merchandise.map(item => (
          <div key={item.id} className="group relative p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${item.isExclusive ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-slate-200 to-slate-300 group-hover:from-signal-amber group-hover:to-amber-500'} transition-colors`} />
            
            <div className="flex items-start gap-4 mb-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 ring-1 ring-slate-900/5 relative">
                <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-sm truncate" title={item.name}>{item.name}</h3>
                <div className="text-sm font-black text-slate-900 mt-1">${item.price}</div>
              </div>
            </div>

            {item.isExclusive && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/50 mb-1.5">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Exclusive</span>
                </div>
                {item.exclusiveShops && item.exclusiveShops.length > 0 && (
                  <div className="text-[11px] font-medium text-slate-500 leading-tight">
                    Only at: <span className="text-slate-700">{item.exclusiveShops.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Stock Level</label>
                <div className={`text-sm font-bold ${item.stock === 0 ? 'text-signal-red' : item.stock < 50 ? 'text-signal-amber' : 'text-signal-green'}`}>
                  {item.stock === 0 ? 'Out of Stock' : `${item.stock} units`}
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                <button 
                  onClick={() => handleUpdateStock(item.id, item.stock - 1)}
                  disabled={item.stock === 0}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors font-mono font-bold"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="0"
                  value={item.stock}
                  onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                  className="w-12 h-7 text-center text-sm font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-700"
                />
                <button 
                  onClick={() => handleUpdateStock(item.id, item.stock + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors font-mono font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
