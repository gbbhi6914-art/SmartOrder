import { X, UserPlus, Phone, MessageSquare, MapPin, FileText, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Customer } from '../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  editCustomer?: Customer | null;
}

export default function AddCustomerModal({ isOpen, onClose, user, editCustomer }: AddCustomerModalProps) {
  const [name, setName] = useState(editCustomer?.name || '');
  const [phone, setPhone] = useState(editCustomer?.phone || '');
  const [whatsapp, setWhatsapp] = useState(editCustomer?.whatsapp || '');
  const [address, setAddress] = useState(editCustomer?.address || '');
  const [notes, setNotes] = useState(editCustomer?.notes || '');
  const [isVip, setIsVip] = useState(editCustomer?.isVip || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name);
      setPhone(editCustomer.phone);
      setWhatsapp(editCustomer.whatsapp || '');
      setAddress(editCustomer.address || '');
      setNotes(editCustomer.notes || '');
      setIsVip(editCustomer.isVip || false);
    } else {
      setName('');
      setPhone('');
      setWhatsapp('');
      setAddress('');
      setNotes('');
      setIsVip(false);
    }
  }, [editCustomer, isOpen]);

  const handleSave = async () => {
    if (!user || !name || !phone) return;
    setSaving(true);
    try {
      if (editCustomer) {
        await updateDoc(doc(db, 'customers', editCustomer.id), {
          name,
          phone,
          whatsapp: whatsapp || phone,
          address,
          notes,
          isVip,
        });
      } else {
        await addDoc(collection(db, 'customers'), {
          ownerUid: user.uid,
          name,
          phone,
          whatsapp: whatsapp || phone,
          address,
          notes,
          isVip,
          totalOrders: 0,
          unpaidBalance: 0,
          favoriteItems: [],
          createdAt: new Date().toISOString()
        });
      }
      onClose();
      // Reset form
      setName('');
      setPhone('');
      setWhatsapp('');
      setAddress('');
      setNotes('');
      setIsVip(false);
    } catch (error) {
      handleFirestoreError(error, editCustomer ? OperationType.UPDATE : OperationType.CREATE, 'customers');
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
        className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-shadow dark:shadow-none">
              <UserPlus className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{editCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Customer Name *</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="e.g. Ali Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="e.g. 03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Same as phone if empty"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-end pb-1">
              <button 
                onClick={() => setIsVip(!isVip)}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all
                  ${isVip ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-900/50 shadow-lg shadow-amber-50 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-2 border-transparent'}
                `}
              >
                <Star className={`w-5 h-5 ${isVip ? 'fill-amber-600 dark:fill-amber-400' : ''}`} />
                Mark as VIP Customer
              </button>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <textarea 
                  rows={2}
                  placeholder="Customer's delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Notes</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <textarea 
                  rows={2}
                  placeholder="Any special preferences or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            <button 
              onClick={handleSave}
              disabled={saving || !name || !phone}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-shadow dark:shadow-none hover:bg-primary-hover transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {editCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
