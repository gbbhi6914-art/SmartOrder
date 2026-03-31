import { Order, UserProfile, Customer } from '../types';
import { 
  FileText, 
  Search, 
  Download, 
  Share2, 
  Printer, 
  MessageSquare, 
  Eye,
  MoreVertical,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import InvoiceModal from './InvoiceModal';

interface InvoicesProps {
  orders: Order[];
  customers: Customer[];
  profile: UserProfile | null;
}

export default function Invoices({ orders, customers, profile }: InvoicesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const selectedCustomer = useMemo(() => {
    if (!selectedOrder) return null;
    return customers.find(c => c.id === selectedOrder.customerId) || null;
  }, [selectedOrder, customers]);

  const filteredInvoices = useMemo(() => {
    return orders.filter(o => 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const handleShareWhatsApp = (order: Order) => {
    const message = `Assalam-o-Alaikum ${order.customerName}, your invoice ${order.orderNumber} is ready. Total: ${profile?.currency} ${order.total}. Balance: ${profile?.currency} ${order.balance}. Thank you for your purchase!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400">View and share professional invoices for your orders.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by customer or invoice number..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all dark:text-white"
        />
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredInvoices.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-2xl flex items-center justify-center shadow-lg shadow-primary-shadow dark:shadow-none">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      order.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}
                  `}>
                    {order.paymentStatus}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2">{order.orderNumber}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{order.customerName}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(order.date).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{profile?.currency} {order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Due Balance</span>
                  <span className={`text-lg font-bold ${order.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {profile?.currency} {order.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleShareWhatsApp(order)}
                  className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
                <button 
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsInvoiceModalOpen(true);
                  }}
                  className="bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light p-3 rounded-xl hover:bg-primary-light dark:hover:bg-primary-shadow transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button className="bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredInvoices.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <FileText className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No invoices found</h3>
            <p className="text-slate-500 dark:text-slate-400">Create an order to generate an invoice.</p>
          </div>
        )}
      </div>

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        order={selectedOrder}
        customer={selectedCustomer}
        profile={profile}
      />
    </div>
  );
}
