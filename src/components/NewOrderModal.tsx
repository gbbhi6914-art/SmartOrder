import { Customer, OrderItem, UserProfile } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Wallet,
  ShoppingBag,
  MessageSquare,
  FileText,
  Loader2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { db, collection, addDoc, doc, updateDoc, increment, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: () => void;
  customers: Customer[];
  user: any;
  profile: UserProfile | null;
  repeatOrder?: any;
  editOrder?: any;
}

export default function NewOrderModal({ isOpen, onClose, onAddCustomer, customers, user, profile, repeatOrder, editOrder }: NewOrderModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ name: '', quantity: 1, price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa' | 'Card'>('Cash');
  const [deliveryStatus, setDeliveryStatus] = useState<'Pending' | 'Ready' | 'Delivered' | 'Cancelled'>('Pending');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any>(null);

  useEffect(() => {
    if (editOrder && isOpen) {
      setSelectedCustomerId(editOrder.customerId);
      setItems(editOrder.items.map((i: any) => ({ ...i })));
      setDiscount(editOrder.discount || 0);
      setDeliveryCharges(editOrder.deliveryCharges || 0);
      setAdvancePaid(0); // Reset to 0 for edit to let user enter total paid amount
      setPaymentMethod(editOrder.paymentMethod || 'Cash');
      setDeliveryStatus(editOrder.deliveryStatus || 'Pending');
      setNotes(editOrder.notes || '');
      setIsSuccess(false);
      setSavedOrder(null);
    } else if (repeatOrder && isOpen) {
      setSelectedCustomerId(repeatOrder.customerId);
      setItems(repeatOrder.items.map((i: any) => ({ ...i })));
      setDiscount(repeatOrder.discount || 0);
      setDeliveryCharges(repeatOrder.deliveryCharges || 0);
      setAdvancePaid(0); // Reset advance for new order
      setPaymentMethod(repeatOrder.paymentMethod || 'Cash');
      setDeliveryStatus('Pending');
      setNotes(`Repeat of order ${repeatOrder.orderNumber}`);
      setIsSuccess(false);
      setSavedOrder(null);
    } else if (isOpen && !repeatOrder && !editOrder) {
      // Reset form for fresh order
      setSelectedCustomerId('');
      setItems([{ name: '', quantity: 1, price: 0 }]);
      setDiscount(0);
      setDeliveryCharges(0);
      setAdvancePaid(0);
      setNotes('');
      setDeliveryStatus('Pending');
      setPaymentMethod('Cash');
      setIsSuccess(false);
      setSavedOrder(null);
    }
  }, [repeatOrder, editOrder, isOpen]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
  const total = useMemo(() => subtotal - discount + deliveryCharges, [subtotal, discount, deliveryCharges]);
  const balance = useMemo(() => total - advancePaid, [total, advancePaid]);

  const handleAddItem = () => setItems([...items, { name: '', quantity: 1, price: 0 }]);
  const handleRemoveItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const handleItemChange = (idx: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!user || !selectedCustomerId || items.some(i => !i.name)) return;
    setSaving(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      
      const orderData = {
        ownerUid: user.uid,
        customerId: selectedCustomerId,
        customerName: customer?.name || 'Unknown',
        items,
        subtotal,
        discount,
        deliveryCharges,
        tax: 0,
        total,
        advancePaid,
        balance,
        paymentMethod,
        paymentStatus: balance <= 0 ? 'Paid' : advancePaid > 0 ? 'Partial' : 'Unpaid',
        deliveryStatus,
        notes
      };

      if (editOrder) {
        // Update existing order
        const orderRef = doc(db, 'orders', editOrder.id);
        const totalAdvance = (editOrder.advancePaid || 0) + advancePaid;
        const finalBalance = total - totalAdvance;
        
        const updatedOrderData = {
          ...orderData,
          advancePaid: totalAdvance,
          balance: finalBalance,
          paymentStatus: finalBalance <= 0 ? 'Paid' : totalAdvance > 0 ? 'Partial' : 'Unpaid',
        };

        await updateDoc(orderRef, updatedOrderData);
        
        // Update customer balance (adjust for difference)
        const balanceDiff = finalBalance - editOrder.balance;
        if (balanceDiff !== 0) {
          await updateDoc(doc(db, 'customers', selectedCustomerId), {
            unpaidBalance: increment(balanceDiff)
          });
        }
        
        setSavedOrder({ id: editOrder.id, orderNumber: editOrder.orderNumber, ...updatedOrderData });
      } else {
        // Create new order
        const orderNumber = `${profile?.invoicePrefix || 'INV-'}${Math.floor(100000 + Math.random() * 900000)}`;
        const newOrderData = {
          ...orderData,
          orderNumber,
          date: new Date().toISOString(),
        };
        
        const docRef = await addDoc(collection(db, 'orders'), newOrderData);
        setSavedOrder({ id: docRef.id, ...newOrderData });
        
        // Update customer stats
        await updateDoc(doc(db, 'customers', selectedCustomerId), {
          totalOrders: increment(1),
          unpaidBalance: increment(balance),
          lastOrderDate: new Date().toISOString()
        });
      }

      setIsSuccess(true);
    } catch (error) {
      handleFirestoreError(error, editOrder ? OperationType.UPDATE : OperationType.CREATE, 'orders');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary-shadow dark:shadow-none">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Order {editOrder ? 'Updated' : 'Saved'} Successfully!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Invoice {savedOrder?.orderNumber} has been {editOrder ? 'updated' : 'generated'}.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-left max-w-md mx-auto space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">Invoice No</span>
                  <span className="font-mono font-bold text-primary dark:text-primary-light">{savedOrder?.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">Customer</span>
                  <span className="font-bold text-slate-900 dark:text-white">{savedOrder?.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">Total Amount</span>
                  <span className="font-bold text-slate-900 dark:text-white">{profile?.currency} {savedOrder?.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-xs">Status</span>
                  <span className="px-3 py-1 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-full text-xs font-bold">{savedOrder?.paymentStatus}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    const message = `Assalam-o-Alaikum ${savedOrder?.customerName}, your invoice ${savedOrder?.orderNumber} is ready. Total: ${profile?.currency} ${savedOrder?.total}. Thank you!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
                  }}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center justify-center gap-2 hover:bg-primary-hover transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  Share on WhatsApp
                </button>
                <button 
                  onClick={onClose}
                  className="bg-slate-900 dark:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 dark:shadow-none flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <div key="form">
              <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-shadow dark:shadow-none">
                    <ShoppingBag className="text-white w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editOrder ? 'Edit Order' : 'Create New Order'}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Customer Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Select Customer</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      disabled={!!editOrder}
                      className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-semibold dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                    {!editOrder && (
                      <button 
                        onClick={onAddCustomer}
                        className="flex items-center justify-center gap-2 px-4 py-4 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-2xl font-bold hover:bg-primary-light dark:hover:bg-primary-shadow transition-all"
                      >
                        <UserPlus className="w-5 h-5" />
                        Add New Customer
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Order Items</label>
                    <button 
                      onClick={handleAddItem}
                      className="text-primary dark:text-primary-light text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="col-span-12 md:col-span-7 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Item Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Chocolate Cake"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          />
                        </div>
                        <div className="col-span-5 md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Qty</label>
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price (Unit)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-primary dark:text-primary-light"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-1 pb-1">
                          <button 
                            onClick={() => handleRemoveItem(idx)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment & Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payment Details</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Method</label>
                          <select 
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          >
                            <option>Cash</option>
                            <option>Bank Transfer</option>
                            <option>JazzCash</option>
                            <option>EasyPaisa</option>
                            <option>Card</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {editOrder ? 'New Payment' : 'Advance Paid'}
                          </label>
                          <input 
                            type="number" 
                            value={advancePaid}
                            onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          />
                          {editOrder && editOrder.advancePaid > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Previous Payment: {profile?.currency} {editOrder.advancePaid.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Delivery Details</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
                          <select 
                            value={deliveryStatus}
                            onChange={(e) => setDeliveryStatus(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          >
                            <option>Pending</option>
                            <option>Ready</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Delivery Charges</label>
                          <input 
                            type="number" 
                            value={deliveryCharges}
                            onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Order Notes</label>
                      <textarea 
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Special instructions, delivery time, etc."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-primary p-8 rounded-3xl text-white shadow-xl shadow-primary-shadow dark:shadow-none space-y-6 h-fit sticky top-24">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Order Summary
                    </h3>
                    <div className="space-y-3 border-b border-white/10 pb-6">
                      <div className="flex justify-between text-white/80">
                        <span>Price</span>
                        <span className="font-bold">{profile?.currency} {subtotal.toLocaleString()}</span>
                      </div>
                      {deliveryCharges > 0 && (
                        <div className="flex justify-between text-white/80">
                          <span>Delivery Charges</span>
                          <span className="font-bold">+ {profile?.currency} {deliveryCharges.toLocaleString()}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-rose-200">
                          <span>Discount</span>
                          <span className="font-bold">- {profile?.currency} {discount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-2xl font-bold">
                        <span>Total</span>
                        <span>{profile?.currency} {total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-primary-light text-sm font-semibold bg-white/10 p-4 rounded-2xl">
                        <span>Remaining Balance</span>
                        <span className="text-white text-lg font-bold">{profile?.currency} {balance.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                          (!selectedCustomerId || items.some(i => !i.name)) 
                          ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                          : 'bg-white text-primary hover:bg-primary-light active:scale-[0.98]'
                        }`}
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        {editOrder ? 'Update Order' : 'Save Order & Generate Invoice'}
                      </button>
                      {(!selectedCustomerId || items.some(i => !i.name)) && (
                        <p className="text-center text-[10px] text-primary-light font-bold uppercase tracking-wider">
                          {!selectedCustomerId ? 'Please select a customer' : 'Please enter item names'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
