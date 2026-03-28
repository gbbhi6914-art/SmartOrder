import { Offer } from '../types';
import { 
  Gift, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  Share2, 
  Trash2, 
  Sparkles, 
  Loader2,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { useState, useEffect, ChangeEvent } from 'react';
import { db, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

interface OffersProps {
  user: any;
}

export default function Offers({ user }: OffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', discountCode: '', expiryDate: '' });
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [prompt, setPrompt] = useState('');

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'offers'), where('ownerUid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'offers'));
    return unsub;
  }, [user]);

  const handleAddOffer = async () => {
    if (!user || !newOffer.title) return;
    try {
      await addDoc(collection(db, 'offers'), {
        ...newOffer,
        ownerUid: user.uid,
        imageUrl: generatedImage,
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewOffer({ title: '', description: '', discountCode: '', expiryDate: '' });
      setGeneratedImage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'offers');
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setGeneratedImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateOfferImage = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      // Check for API key
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Create a professional, high-quality promotional offer banner for a business. Title: "${newOffer.title}". Style: ${prompt}. Vibrant colors, premium look, commercial photography style.`,
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const compressed = await compressImage(`data:image/png;base64,${base64EncodeString}`);
          setGeneratedImage(compressed);
          break;
        }
      }
    } catch (error: any) {
      console.error("Offer image generation error:", error);
      if (error.message?.includes("not found")) {
        await window.aistudio.openSelectKey();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'offers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `offers/${id}`);
    }
  };

  const handleShare = (offer: Offer) => {
    const message = `Special Offer: ${offer.title}! ${offer.description}. Use code: ${offer.discountCode}. Valid until: ${offer.expiryDate}. Order now!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Offers & Promotions</h1>
          <p className="text-slate-500 dark:text-slate-400">Create special deals to boost your repeat sales.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none flex items-center gap-2 hover:bg-primary-hover transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Promotional Offer</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
              <Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Offer Title</label>
                <input 
                  type="text" 
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                  placeholder="e.g. Weekend Special 20% Off"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3}
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                  placeholder="Tell your customers about this deal..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Promo Code</label>
                  <input 
                    type="text" 
                    value={newOffer.discountCode}
                    onChange={(e) => setNewOffer({...newOffer, discountCode: e.target.value})}
                    placeholder="SAVE20"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newOffer.expiryDate}
                    onChange={(e) => setNewOffer({...newOffer, expiryDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Offer Banner (AI Generated)</label>
              <div className="aspect-video bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group">
                {generatedImage ? (
                  <img src={generatedImage} className="w-full h-full object-cover" alt="Offer" />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">No image generated yet</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Upload from Gallery</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Describe the banner style (e.g. Summer vibes, bright colors)..." 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:text-white"
                />
                <button 
                  onClick={generateOfferImage}
                  disabled={generating || !prompt || !newOffer.title}
                  className="bg-primary text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-primary-hover transition-all"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
            <button 
              onClick={handleAddOffer}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-shadow dark:shadow-none hover:bg-primary-hover transition-all"
            >
              Save & Publish Offer
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden group"
          >
            <div className="aspect-video bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
              {offer.imageUrl ? (
                <img src={offer.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={offer.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary dark:text-primary-light shadow-sm">
                {offer.discountCode}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{offer.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">{offer.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  Expires: {offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShare(offer)}
                    className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(offer.id)}
                    className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {offers.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Gift className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No active offers</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first promotional offer to attract more customers.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-primary-shadow dark:shadow-none inline-flex items-center gap-2 hover:bg-primary-hover transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Offer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
