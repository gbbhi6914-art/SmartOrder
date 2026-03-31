/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  updateDoc,
  increment,
  FirebaseUser,
  OperationType,
  handleFirestoreError
} from './firebase';
import { UserProfile, Customer, Order, Tab, Notification } from './types';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileText, 
  Settings, 
  Plus, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Invoices from './components/Invoices';
import SettingsView from './components/Settings';
import Offers from './components/Offers';
import NewOrderModal from './components/NewOrderModal';
import AddCustomerModal from './components/AddCustomerModal';
import NotificationPanel from './components/NotificationPanel';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth State
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [repeatOrderData, setRepeatOrderData] = useState<Order | null>(null);
  const [editOrderData, setEditOrderData] = useState<Order | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Customer | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          businessName: user.displayName || 'My Business',
          currency: 'PKR',
          invoicePrefix: 'INV-',
          language: 'en',
          theme: 'light',
          colorTheme: 'indigo',
          phone: '',
          whatsapp: '',
          address: '',
          orderNotifications: true,
          paymentAlerts: true,
          biometricLock: false
        };
        try {
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const customersQuery = query(
      collection(db, 'customers'),
      where('ownerUid', '==', user.uid),
      orderBy('name')
    );

    const ordersQuery = query(
      collection(db, 'orders'),
      where('ownerUid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('ownerUid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => {
      unsubCustomers();
      unsubOrders();
      unsubNotifications();
    };
  }, [user]);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleTheme = async () => {
    if (!user || !profile) return;
    const newTheme = profile.theme === 'dark' ? 'light' : 'dark';
    try {
      await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'customers');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Update customer balance before deleting order
        await updateDoc(doc(db, 'customers', order.customerId), {
          totalOrders: increment(-1),
          unpaidBalance: increment(-order.balance)
        });
      }
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'orders');
    }
  };

  const handleOpenNotifications = async () => {
    setIsNotificationOpen(true);
    // Mark all unread as read when opening the panel
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > 0) {
      try {
        const promises = unread.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));
        await Promise.all(promises);
      } catch (error) {
        console.error("Error marking all as read:", error);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const promises = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
      await Promise.all(promises);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (profile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply color theme
    if (profile?.colorTheme) {
      document.documentElement.setAttribute('data-theme', profile.colorTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [profile?.theme, profile?.colorTheme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-10 border border-slate-100 dark:border-slate-700 text-center"
        >
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-shadow dark:shadow-none">
            <ShoppingBag className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">SmartOrder</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">The premium order management app for your small business.</p>
          
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 hover:border-primary dark:hover:border-primary-light text-slate-700 dark:text-white font-bold py-5 px-6 rounded-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
              Sign in with Google
            </button>

            {authError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                <p className="text-red-500 dark:text-red-400 text-sm font-bold">{authError}</p>
              </div>
            )}
          </div>
          
          <p className="mt-10 text-xs text-slate-400 dark:text-slate-500">
            By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-300">
      <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="font-bold text-xl text-primary dark:text-primary-light">SmartOrder</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenNotifications}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl relative"
          >
            <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
          <img src={profile?.logoUrl || user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-primary-light dark:border-slate-700 object-cover" alt="Profile" />
        </div>
      </header>

      <div className="flex">
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary-shadow dark:shadow-none overflow-hidden">
                  {profile?.logoUrl ? (
                    <img src={profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                  ) : (
                    <ShoppingBag className="text-white w-6 h-6" />
                  )}
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">SmartOrder</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group
                    ${activeTab === item.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary-shadow dark:shadow-none' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary-light'}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-primary-light'}`} />
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6 px-2">
                <img src={profile?.logoUrl || user.photoURL || ''} className="w-12 h-12 rounded-2xl object-cover" alt="User" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{profile?.businessName}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-semibold"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex items-center justify-between px-10 py-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 sticky top-0 z-30">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenNotifications}
                className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
              >
                <Bell className="w-6 h-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all flex items-center gap-2 font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
              <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-700 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.businessName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{user.email}</p>
                </div>
                <img src={profile?.logoUrl || user.photoURL || ''} className="w-10 h-10 rounded-xl object-cover border-2 border-primary-light dark:border-slate-700" alt="Profile" />
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto p-4 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    orders={orders} 
                    customers={customers} 
                    profile={profile}
                    onNewOrder={() => {
                      setEditOrderData(null);
                      setRepeatOrderData(null);
                      setIsNewOrderOpen(true);
                    }}
                    onAddCustomer={() => {
                      setEditCustomerData(null);
                      setIsAddCustomerOpen(true);
                    }}
                    setActiveTab={setActiveTab}
                    toggleTheme={toggleTheme}
                    onLogout={handleLogout}
                  />
                )}
                {activeTab === 'orders' && (
                  <Orders 
                    orders={orders} 
                    customers={customers}
                    onNewOrder={() => {
                      setEditOrderData(null);
                      setRepeatOrderData(null);
                      setIsNewOrderOpen(true);
                    }}
                    onRepeatOrder={(order) => {
                      setEditOrderData(null);
                      setRepeatOrderData(order);
                      setIsNewOrderOpen(true);
                    }}
                    onEditOrder={(order) => {
                      setRepeatOrderData(null);
                      setEditOrderData(order);
                      setIsNewOrderOpen(true);
                    }}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}
                {activeTab === 'customers' && (
                  <Customers 
                    customers={customers} 
                    onAddCustomer={() => {
                      setEditCustomerData(null);
                      setIsAddCustomerOpen(true);
                    }}
                    onEditCustomer={(customer) => {
                      setEditCustomerData(customer);
                      setIsAddCustomerOpen(true);
                    }}
                    onDeleteCustomer={handleDeleteCustomer}
                  />
                )}
                {activeTab === 'invoices' && (
                  <Invoices orders={orders} customers={customers} profile={profile} />
                )}
                {activeTab === 'offers' && (
                  <Offers user={user} />
                )}
                {activeTab === 'settings' && (
                  <SettingsView profile={profile} user={user} onLogout={handleLogout} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <button 
        onClick={() => {
          setEditOrderData(null);
          setRepeatOrderData(null);
          setIsNewOrderOpen(true);
        }}
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <NewOrderModal 
        isOpen={isNewOrderOpen} 
        onClose={() => {
          setIsNewOrderOpen(false);
          setRepeatOrderData(null);
          setEditOrderData(null);
        }} 
        onAddCustomer={() => {
          setEditCustomerData(null);
          setIsAddCustomerOpen(true);
        }}
        customers={customers}
        user={user}
        profile={profile}
        repeatOrder={repeatOrderData}
        editOrder={editOrderData}
      />
      <AddCustomerModal 
        isOpen={isAddCustomerOpen} 
        onClose={() => {
          setIsAddCustomerOpen(false);
          setEditCustomerData(null);
        }}
        user={user}
        editCustomer={editCustomerData}
      />

      <NotificationPanel 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
      />
    </div>
  );
}
