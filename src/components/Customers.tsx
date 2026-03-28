import { Customer } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  MessageSquare, 
  History, 
  Star, 
  Edit, 
  Trash2,
  MapPin,
  Calendar,
  Wallet
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export default function Customers({ customers, onAddCustomer, onEditCustomer, onDeleteCustomer }: CustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}`);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      onDeleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your customer relationships and history.</p>
        </div>
        <button 
          onClick={onAddCustomer}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name or phone number..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all dark:text-white"
        />
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer) => (
            <motion.div
              layout
              key={customer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative overflow-hidden"
            >
              {customer.isVip && (
                <div className="absolute top-0 right-0 bg-amber-400 text-white px-3 py-1 rounded-bl-2xl flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-white" />
                  VIP
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-2xl flex items-center justify-center text-xl font-bold border-2 border-primary-light dark:border-primary-shadow">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">{customer.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </p>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenu(activeMenu === customer.id ? null : customer.id)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {activeMenu === customer.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveMenu(null)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-20"
                        >
                          <button 
                            onClick={() => {
                              onEditCustomer(customer);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                            Edit Customer
                          </button>
                          <button 
                            onClick={() => {
                              setCustomerToDelete(customer);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Customer
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{customer.totalOrders}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl">
                  <p className="text-xs text-rose-400 dark:text-rose-500 font-bold uppercase tracking-wider mb-1">Balance</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">PKR {customer.unpaidBalance.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="line-clamp-1">{customer.address}</span>
                  </div>
                )}
                {customer.lastOrderDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>Last: {new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
                <button 
                  onClick={() => handleCall(customer.phone)}
                  className="flex-1 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light p-3 rounded-xl hover:bg-primary-light dark:hover:bg-primary-shadow transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button 
                  onClick={() => handleWhatsApp(customer.whatsapp || customer.phone)}
                  className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Users className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No customers found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Try searching for a different name or add a new customer.</p>
            <button 
              onClick={onAddCustomer}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none inline-flex items-center gap-2 hover:bg-primary-hover transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {customerToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 text-center"
            >
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Delete Customer?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{customerToDelete.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCustomerToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 dark:shadow-none transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
