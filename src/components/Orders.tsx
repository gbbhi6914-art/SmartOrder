import { Order, Customer } from '../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  MessageSquare,
  FileText,
  Repeat,
  Calendar,
  Wallet
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OrdersProps {
  orders: Order[];
  customers: Customer[];
  onNewOrder: () => void;
  onRepeatOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function Orders({ orders, customers, onNewOrder, onRepeatOrder, onEditOrder, onDeleteOrder }: OrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.deliveryStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const confirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-600',
    'Ready': 'bg-blue-100 text-blue-600',
    'Delivered': 'bg-emerald-100 text-emerald-600',
    'Cancelled': 'bg-rose-100 text-rose-600',
  };

  const statusIcons = {
    'Pending': Clock,
    'Ready': AlertCircle,
    'Delivered': CheckCircle2,
    'Cancelled': XCircle,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Orders</h1>
          <p className="text-slate-500 dark:text-slate-400">Track and manage all your customer orders.</p>
        </div>
        <button 
          onClick={onNewOrder}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all"
        >
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by customer or order number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {['All', 'Pending', 'Ready', 'Delivered', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-6 py-3.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all
                ${statusFilter === status 
                  ? 'bg-primary text-white shadow-lg shadow-primary-shadow dark:shadow-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-primary-light dark:hover:border-primary-shadow'}
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => {
            const StatusIcon = statusIcons[order.deliveryStatus as keyof typeof statusIcons] || Clock;
            return (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`${statusColors[order.deliveryStatus as keyof typeof statusColors]} p-4 rounded-2xl shadow-lg shadow-slate-50 dark:shadow-none`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{order.orderNumber}</span>
                        <span className="text-slate-200 dark:text-slate-700">•</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">{order.customerName}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-1">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                    <div className="text-right">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">PKR {order.total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Balance</p>
                      <p className={`text-xl font-bold ${order.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        PKR {order.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 transition-colors">
                        <FileText className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onRepeatOrder(order)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 transition-colors"
                        title="Repeat Order"
                      >
                        <Repeat className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {activeMenu === order.id && (
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
                                    onEditOrder(order);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-primary" />
                                  Edit Order
                                </button>
                                <button 
                                  onClick={() => {
                                    setOrderToDelete(order);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-semibold transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Delete Order
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <ShoppingBag className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Try searching for a different customer or order number.</p>
            <button 
              onClick={onNewOrder}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none inline-flex items-center gap-2 hover:bg-primary-hover transition-all"
            >
              <Plus className="w-5 h-5" />
              New Order
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 text-center"
            >
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Delete Order?</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Are you sure you want to delete order <span className="font-bold text-slate-900 dark:text-white">{orderToDelete.orderNumber}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setOrderToDelete(null)}
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
