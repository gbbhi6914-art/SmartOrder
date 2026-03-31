import { Order, Customer, UserProfile, Tab } from '../types';
import { 
  ShoppingBag, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Wallet,
  Plus,
  UserPlus,
  FileText,
  MessageSquare,
  Search,
  Repeat,
  Gift,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  orders: Order[];
  customers: Customer[];
  profile: UserProfile | null;
  onNewOrder: () => void;
  onAddCustomer: () => void;
  setActiveTab: (tab: Tab) => void;
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function Dashboard({ orders, customers, profile, onNewOrder, onAddCustomer, setActiveTab, toggleTheme, onLogout }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.date.startsWith(today));
  
  const pendingOrders = orders.filter(o => o.deliveryStatus === 'Pending');
  const deliveredOrders = orders.filter(o => o.deliveryStatus === 'Delivered');
  
  const totalUnpaid = orders.reduce((sum, o) => sum + o.balance, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.advancePaid + (o.paymentStatus === 'Paid' ? o.balance : 0), 0);
  
  const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
  
  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: "Pending Orders", value: pendingOrders.length, icon: Clock, color: 'bg-amber-500' },
    { label: "Delivered", value: deliveredOrders.length, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: "Unpaid Amount", value: `${profile?.currency || 'PKR'} ${totalUnpaid.toLocaleString()}`, icon: AlertCircle, color: 'bg-rose-500' },
    { label: "Total Paid", value: `${profile?.currency || 'PKR'} ${totalPaid.toLocaleString()}`, icon: Wallet, color: 'bg-primary' },
    { label: "Total Customers", value: customers.length, icon: Users, color: 'bg-violet-500' },
    { label: "Repeat Customers", value: repeatCustomers, icon: Repeat, color: 'bg-fuchsia-500' },
    { label: "Profit Summary", value: `${profile?.currency || 'PKR'} ${(totalPaid * 0.2).toLocaleString()}`, icon: TrendingUp, color: 'bg-cyan-500' },
  ];

  const quickActions = [
    { label: 'New Order', icon: Plus, onClick: onNewOrder, color: 'bg-primary' },
    { label: 'Add Customer', icon: UserPlus, onClick: onAddCustomer, color: 'bg-primary' },
    { label: 'Create Invoice', icon: FileText, onClick: () => setActiveTab('invoices'), color: 'bg-blue-600' },
    { label: 'Send WhatsApp', icon: MessageSquare, onClick: () => setActiveTab('customers'), color: 'bg-green-600' },
    { label: 'Add Offer', icon: Gift, onClick: () => setActiveTab('offers'), color: 'bg-rose-600' },
    { label: 'Logout', icon: LogOut, onClick: onLogout, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {profile?.businessName}!</h1>
          <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            title="Toggle Theme"
          >
            {profile?.theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button 
            onClick={onNewOrder}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl shadow-lg shadow-slate-100 dark:shadow-none`}>
                <stat.icon className="text-white w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary-light dark:hover:border-primary-shadow hover:bg-primary-light dark:hover:bg-primary-shadow transition-all group flex flex-col items-center gap-3"
            >
              <div className={`${action.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-primary-light">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Orders</h2>
          <button className="text-primary dark:text-primary-light font-semibold text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-sm text-slate-500 dark:text-slate-400">{order.orderNumber}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{order.customerName}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{profile?.currency} {order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold
                      ${order.deliveryStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        order.deliveryStatus === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}
                    `}>
                      {order.deliveryStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold
                      ${order.paymentStatus === 'Paid' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 
                        order.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}
                    `}>
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">
                    No orders yet. Start by creating your first order!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
