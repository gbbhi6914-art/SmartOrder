import { Order, UserProfile, Customer } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Calendar,
  User,
  Hash,
  Globe,
  Mail,
  ShieldCheck,
  CreditCard,
  Truck,
  FileText,
  Gift,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  customer: Customer | null;
  profile: UserProfile | null;
}

export default function InvoiceModal({ isOpen, onClose, order, customer, profile }: InvoiceModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const message = `Assalam-o-Alaikum ${order.customerName}, your invoice ${order.orderNumber} is ready. Total: ${profile?.currency} ${order.total.toLocaleString()}. Balance: ${profile?.currency} ${order.balance.toLocaleString()}. Thank you for your purchase!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:max-h-none print:overflow-visible print:rounded-none"
      >
        {/* Header - Hidden in Print */}
        <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between z-20 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FileText className="text-primary w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Invoice Preview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Professional Document</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="relative p-10 md:p-16 space-y-12 print:p-0">
          {/* Decorative Background Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none print:hidden"></div>
          
          {/* Top Section: Logo & Business Info */}
          <div className="relative flex flex-col md:flex-row justify-between gap-10">
            <div className="space-y-6">
              {profile?.logoUrl ? (
                <div className="p-2 bg-white rounded-2xl shadow-sm inline-block border border-slate-100">
                  <img src={profile.logoUrl} className="h-20 w-auto object-contain" alt="Business Logo" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
                  <Building2 className="text-white w-12 h-12" />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{profile?.businessName}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
                  {profile?.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {profile.address}
                    </p>
                  )}
                  {profile?.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      {profile.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left md:text-right flex flex-col justify-between items-start md:items-end">
              <div className="space-y-1">
                <h2 className="text-6xl font-black text-slate-100 dark:text-slate-700/50 uppercase tracking-tighter leading-none">Invoice</h2>
                <div className="bg-primary/5 px-4 py-2 rounded-xl inline-block">
                  <p className="text-slate-900 dark:text-white font-black flex items-center gap-3">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em]">No:</span>
                    <span className="font-mono text-xl">{order.orderNumber}</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Date of Issue</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <User className="w-24 h-24" />
              </div>
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6">Billed To</h3>
              <div className="space-y-4">
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                  {order.customerName}
                </p>
                <div className="flex flex-wrap gap-4">
                  {customer?.phone && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                      <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Phone className="w-4 h-4" />
                      </div>
                      {customer.phone}
                    </div>
                  )}
                  {customer?.address && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                      <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <MapPin className="w-4 h-4" />
                      </div>
                      {customer.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">Payment Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Status</span>
                    <span className={`
                      px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                      ${order.paymentStatus === 'Paid' ? 'bg-emerald-500 text-white' : 
                        order.paymentStatus === 'Partial' ? 'bg-amber-500 text-white' : 
                        'bg-rose-500 text-white'}
                    `}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Method</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{order.paymentMethod}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">Delivery</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Status</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{order.deliveryStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="relative">
            {/* Paid Stamp */}
            {order.paymentStatus === 'Paid' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none opacity-20 z-0">
                <div className="border-8 border-emerald-500 rounded-3xl px-12 py-6">
                  <span className="text-8xl font-black text-emerald-500 uppercase tracking-widest">PAID</span>
                </div>
              </div>
            )}
            
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 relative z-10">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Description</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">Quantity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Unit Price</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="group">
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Product Code: {idx + 101}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white font-black">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">{profile?.currency} {item.price.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-lg">{profile?.currency} {(item.price * item.quantity).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-8">
              {order.notes && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Notes & Instructions</h4>
                  <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100/50 dark:border-amber-900/20">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">"{order.notes}"</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Terms & Conditions</h4>
                  <ul className="text-[10px] text-slate-500 dark:text-slate-400 font-bold space-y-1 list-disc list-inside">
                    <li>Payment is due within 7 days.</li>
                    <li>Items once sold are not returnable.</li>
                    <li>Please keep this invoice for warranty.</li>
                  </ul>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-600">
                    <Globe className="w-12 h-12 text-slate-300 dark:text-slate-500" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-widest">Scan for digital copy</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono">{profile?.currency} {order.subtotal.toLocaleString()}</span>
                </div>
                {order.deliveryCharges > 0 && (
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>Delivery</span>
                    </div>
                    <span className="font-mono">+ {profile?.currency} {order.deliveryCharges.toLocaleString()}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-rose-500 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      <span>Discount</span>
                    </div>
                    <span className="font-mono">- {profile?.currency} {order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="h-[1px] bg-slate-200 dark:bg-slate-700 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-black text-primary dark:text-primary-light font-mono tracking-tighter">
                    {profile?.currency} {order.total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative space-y-4">
                  <div className="flex justify-between items-center text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span>Advance Paid</span>
                    <span className="font-mono text-xs">{profile?.currency} {order.advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mb-1">Balance Due</p>
                      <p className="text-4xl font-black font-mono tracking-tighter">{profile?.currency} {order.balance.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-16 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-left space-y-2">
              <p className="text-slate-900 dark:text-white font-black text-2xl italic tracking-tight">Thank you for your business!</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Authorized Signature</p>
              <div className="w-48 h-12 border-b border-slate-200 dark:border-slate-700 mt-4"></div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Contact Support</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden in Print */}
        <div className="p-10 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 print:hidden">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
          >
            <MessageSquare className="w-5 h-5" />
            Share on WhatsApp
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 bg-primary hover:bg-primary-hover text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-primary/30 dark:shadow-none transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
        </div>
      </motion.div>
    </div>
  );
}
