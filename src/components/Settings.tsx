import { UserProfile, Order, Customer } from '../types';
import { 
  Settings, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Save,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Lock,
  Fingerprint,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Palette,
  LogOut
} from 'lucide-react';
import { useState, useEffect, ChangeEvent } from 'react';
import { db, doc, updateDoc, handleFirestoreError, OperationType, collection, query, where, getDocs } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface SettingsProps {
  profile: UserProfile | null;
  user: any;
  onLogout: () => void;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function SettingsView({ profile, user, onLogout }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'notifications' | 'security' | 'backup'>('profile');
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [currency, setCurrency] = useState(profile?.currency || 'PKR');
  const [orderNotifications, setOrderNotifications] = useState(profile?.orderNotifications ?? true);
  const [paymentAlerts, setPaymentAlerts] = useState(profile?.paymentAlerts ?? true);
  const [pin, setPin] = useState(profile?.pin || '');
  const [biometricLock, setBiometricLock] = useState(profile?.biometricLock ?? false);
  const [colorTheme, setColorTheme] = useState<UserProfile['colorTheme']>(profile?.colorTheme || 'indigo');
  const [saving, setSaving] = useState(false);
  
  // PIN Change Modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  // Image Generation
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState(profile?.logoUrl || '');

  const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
      setAddress(profile.address || '');
      setCurrency(profile.currency || 'PKR');
      setGeneratedLogo(profile.logoUrl || '');
      setOrderNotifications(profile.orderNotifications ?? true);
      setPaymentAlerts(profile.paymentAlerts ?? true);
      setPin(profile.pin || '');
      setBiometricLock(profile.biometricLock ?? false);
      setColorTheme(profile.colorTheme || 'indigo');
    }
  }, [profile]);

  const handleToggleOrderNotifications = async () => {
    const newValue = !orderNotifications;
    setOrderNotifications(newValue);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { orderNotifications: newValue });
      } catch (error) {
        console.error("Error updating notifications:", error);
      }
    }
  };

  const handleTogglePaymentAlerts = async () => {
    const newValue = !paymentAlerts;
    setPaymentAlerts(newValue);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { paymentAlerts: newValue });
      } catch (error) {
        console.error("Error updating payment alerts:", error);
      }
    }
  };

  const handleToggleBiometric = async () => {
    const newValue = !biometricLock;
    setBiometricLock(newValue);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { biometricLock: newValue });
      } catch (error) {
        console.error("Error updating biometric lock:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        businessName,
        phone,
        whatsapp,
        address,
        currency,
        logoUrl: generatedLogo,
        orderNotifications,
        paymentAlerts,
        biometricLock,
        colorTheme
      });
      alert("Settings saved successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePin = async () => {
    if (!user || newPin.length !== 4) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        pin: newPin
      });
      setPin(newPin);
      setIsPinModalOpen(false);
      setNewPin('');
      setShowPin(false);
      alert("PIN updated successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = async () => {
    if (!user) return;
    try {
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('ownerUid', '==', user.uid)));
      const customersSnap = await getDocs(query(collection(db, 'customers'), where('ownerUid', '==', user.uid)));
      
      const orders = ordersSnap.docs.map(doc => doc.data() as Order);
      const customers = customersSnap.docs.map(doc => doc.data() as Customer);

      // Create CSV for Orders
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Order Number,Date,Customer,Total,Status,Delivery\n";
      orders.forEach(o => {
        csvContent += `${o.orderNumber},${o.date},${o.customerName},${o.total},${o.paymentStatus},${o.deliveryStatus}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `smartorder_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data.");
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setGeneratedLogo(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLogo = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      // Check for API key if using a model that requires it
      // For gemini-2.5-flash-image, it might be free, but let's be safe
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // After opening, we assume they selected one or we retry
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Create a professional, modern, minimal business logo for a company named "${businessName}". Style: ${prompt}. Clean background, vector style, premium look.`,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const compressed = await compressImage(`data:image/png;base64,${base64EncodeString}`);
          setGeneratedLogo(compressed);
          break;
        }
      }
    } catch (error) {
      console.error("Logo generation error:", error);
      // If it fails with "Requested entity was not found", it might be the API key
      if (error instanceof Error && error.message.includes("not found")) {
        await window.aistudio.openSelectKey();
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your business profile and app preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeSection === 'profile' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Building2 className="w-5 h-5" />
            Business Profile
          </button>
          <button 
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === 'appearance' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Palette className="w-5 h-5" />
            Appearance
          </button>
          <button 
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === 'notifications' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Bell className="w-5 h-5" />
            Notifications
          </button>
          <button 
            onClick={() => setActiveSection('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === 'security' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Shield className="w-5 h-5" />
            Security
          </button>
          <button 
            onClick={() => setActiveSection('backup')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === 'backup' ? 'bg-primary-light text-primary dark:bg-primary-shadow dark:text-primary-light' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Database className="w-5 h-5" />
            Backup & Sync
          </button>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout Account
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-8">
          {activeSection === 'profile' && (
            <>
              {/* Business Logo */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Business Logo
                  </h2>
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Generate a professional logo using AI or upload your own from gallery.</p>
                    
                    {/* Logo Preview */}
                    {generatedLogo && (
                      <div className="flex justify-center">
                        <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                          <img src={generatedLogo} className="w-full h-full object-cover" alt="Logo" />
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                            <span className="text-white text-xs font-bold uppercase tracking-wider">Change</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <ImageIcon className="w-5 h-5" />
                        Gallery
                      </label>
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Minimalist, Elegant, Modern, Blue theme..." 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                        />
                        <button 
                          onClick={generateLogo}
                          disabled={generating || !prompt}
                          className="bg-primary text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover transition-all whitespace-nowrap"
                        >
                          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                          AI Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Business Info */}
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Business Details
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Business Name</label>
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    >
                      <option value="PKR">PKR - Pakistani Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="AED">AED - UAE Dirham</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
                    <input 
                      type="text" 
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Business Address</label>
                    <textarea 
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 text-rose-500 font-bold hover:underline"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout Account
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </>
          )}
          
          {activeSection === 'appearance' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                App Appearance
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-4">Color Theme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'indigo', name: 'Midnight Indigo', color: '#4f46e5' },
                      { id: 'emerald', name: 'Forest Emerald', color: '#059669' },
                      { id: 'rose', name: 'Crimson Rose', color: '#e11d48' },
                      { id: 'amber', name: 'Golden Amber', color: '#d97706' },
                      { id: 'violet', name: 'Royal Violet', color: '#7c3aed' },
                      { id: 'cyan', name: 'Ocean Cyan', color: '#0891b2' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setColorTheme(theme.id as any)}
                        className={`
                          relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3
                          ${colorTheme === theme.id 
                            ? 'border-primary bg-primary-light dark:bg-primary-shadow' 
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}
                        `}
                      >
                        <div 
                          className="w-10 h-10 rounded-full shadow-inner"
                          style={{ backgroundColor: theme.color }}
                        />
                        <span className={`text-xs font-bold ${colorTheme === theme.id ? 'text-primary dark:text-primary-light' : 'text-slate-600 dark:text-slate-400'}`}>
                          {theme.name}
                        </span>
                        {colorTheme === theme.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Theme
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <button 
                  onClick={handleToggleOrderNotifications}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white">Order Notifications</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when a new order is placed</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${orderNotifications ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${orderNotifications ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>
                <button 
                  onClick={handleTogglePaymentAlerts}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white">Payment Alerts</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when a payment is received</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${paymentAlerts ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paymentAlerts ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Settings
              </h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Change PIN</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{pin ? 'Update your 4-digit security PIN' : 'Set a 4-digit security PIN'}</p>
                  </div>
                  <Lock className="w-5 h-5 text-slate-400 dark:text-slate-600" />
                </button>
                <button 
                  onClick={handleToggleBiometric}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Biometric Lock</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Use Fingerprint or Face ID to unlock</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${biometricLock ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${biometricLock ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'backup' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Backup & Sync
              </h2>
              <div className="space-y-4">
                <div className="p-6 bg-primary-light dark:bg-primary-shadow rounded-3xl border border-primary-light dark:border-primary-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-primary dark:text-primary-light">Cloud Sync Active</p>
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase">Live</span>
                  </div>
                  <p className="text-sm text-primary dark:text-primary-light mb-6">Your data is automatically backed up to our secure cloud servers.</p>
                  <button 
                    onClick={exportToCSV}
                    className="bg-white dark:bg-slate-800 text-primary dark:text-primary-light px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-primary-light dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data (CSV)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6 border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Set Security PIN</h3>
                <button onClick={() => setIsPinModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-500 dark:text-slate-400">Enter a 4-digit PIN to secure your application.</p>
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"} 
                  maxLength={4}
                  placeholder="****"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-4xl tracking-widest py-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold dark:text-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPin ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              <button 
                onClick={handleSavePin}
                disabled={newPin.length !== 4 || saving}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-shadow dark:shadow-none disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Save PIN'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
