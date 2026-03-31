import { Notification } from '../types';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  ShoppingBag, 
  Wallet, 
  AlertCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, updateDoc, deleteDoc } from '../firebase';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationPanel({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkAsRead, 
  onDelete,
  onClearAll 
}: NotificationPanelProps) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl border-l border-slate-100 dark:border-slate-700 flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light dark:bg-primary-shadow text-primary dark:text-primary-light rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {unreadCount} Unread Messages
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <motion.div
                  layout
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`
                    p-4 rounded-2xl border transition-all relative group
                    ${n.isRead 
                      ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700' 
                      : 'bg-primary-light/30 dark:bg-primary-shadow/10 border-primary-light dark:border-primary-shadow'}
                  `}
                >
                  <div className="flex gap-4">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${n.type === 'order' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                        n.type === 'payment' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}
                    `}>
                      {n.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : 
                       n.type === 'payment' ? <Wallet className="w-5 h-5" /> : 
                       <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate pr-6">{n.title}</h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {new Date(n.date).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button 
                        onClick={() => onMarkAsRead(n.id)}
                        className="p-1.5 bg-white dark:bg-slate-700 text-primary rounded-lg shadow-sm hover:bg-primary hover:text-white transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(n.id)}
                      className="p-1.5 bg-white dark:bg-slate-700 text-rose-500 rounded-lg shadow-sm hover:bg-rose-500 hover:text-white transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No notifications</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">You're all caught up!</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {notifications.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={onClearAll}
              className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Notifications
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
