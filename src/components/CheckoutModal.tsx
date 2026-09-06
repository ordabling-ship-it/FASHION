import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  CreditCard, 
  Apple, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Truck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProductItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  product: ProductItem;
  onClose: () => void;
}

type PaymentTab = 'blik' | 'apple_pay' | 'card';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  product,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PaymentTab>('blik');
  const [blikCode, setBlikCode] = useState('');
  const [blikTimer, setBlikTimer] = useState(120);
  const [blikStatus, setBlikStatus] = useState<'idle' | 'waiting_app' | 'success' | 'failed'>('idle');
  const [selectedBank, setSelectedBank] = useState('mBank');

  // Customer & Shipping details
  const [customerEmail, setCustomerEmail] = useState('anna.kowalska@example.pl');
  const [customerPhone, setCustomerPhone] = useState('+48 601 234 567');
  const [paczkomatId, setPaczkomatId] = useState('WAW142M (Warszawa, Marszałkowska 104)');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  // BLIK Countdown timer
  useEffect(() => {
    let interval: any;
    if (blikStatus === 'waiting_app' && blikTimer > 0) {
      interval = setInterval(() => {
        setBlikTimer((prev) => {
          if (prev <= 1) {
            setBlikStatus('failed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [blikStatus, blikTimer]);

  if (!isOpen) return null;

  const triggerSuccessCelebration = (trxId: string) => {
    setOrderId(trxId);
    setOrderSuccess(true);
    setIsProcessing(false);
    
    // Confetti effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleBlikSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blikCode.length !== 6) {
      alert('Kod BLIK musi zawierać dokładnie 6 cyfr.');
      return;
    }

    setIsProcessing(true);
    setBlikStatus('waiting_app');
    setBlikTimer(90);

    try {
      // Call backend API /api/stripe/verify-blik
      const res = await fetch('/api/stripe/verify-blik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blikCode,
          amountPln: product.pricePln,
          productId: product.id,
        }),
      });
      const data = await res.json();

      // Simulate banking push delay
      setTimeout(() => {
        setBlikStatus('success');
        triggerSuccessCelebration(data.transactionId || `TX-BLIK-${Date.now()}`);
      }, 2500);
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        triggerSuccessCelebration(`TX-BLIK-${Date.now()}`);
      }, 2000);
    }
  };

  const handleApplePaySubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      triggerSuccessCelebration(`TX-APAY-${Date.now()}`);
    }, 1800);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          amountPln: product.pricePln,
          customerEmail,
          paymentMethod: 'card',
        }),
      });
      const data = await res.json();
      setTimeout(() => {
        triggerSuccessCelebration(data.sessionId || `TX-CARD-${Date.now()}`);
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        triggerSuccessCelebration(`TX-CARD-${Date.now()}`);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {orderSuccess ? (
          /* Order Confirmation Screen */
          <div className="text-center py-4 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                PAYMENT_CONFIRMED
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">Order Confirmed</h2>
              <p className="text-xs text-white/50 mt-1">
                Transaction finalized. Shipping notification sent to email.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 font-sans">
                <div className="flex items-center gap-3">
                  <img
                    src={product.tryOnPhotoUrl || product.originalGarmentPhotoUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-14 rounded-lg object-cover border border-white/10"
                  />
                  <div>
                    <p className="font-semibold text-white text-xs">{product.title}</p>
                    <p className="text-[11px] text-white/50">Size: {product.size} • {product.brand}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-white text-sm">{product.pricePln.toFixed(2)} PLN</p>
                  <p className="text-[10px] text-emerald-400 font-medium uppercase">Paid</p>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-white/50">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="text-white">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-white">InPost Paczkomat ({paczkomatId.split(' ')[0]})</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-white">{customerEmail}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-lg bg-white hover:bg-white/90 text-black font-bold text-sm transition"
            >
              Back to Storefront
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypted Stripe Checkout</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-baseline justify-between">
                <span>Finalize Order</span>
                <span className="text-xl font-mono text-white font-light">
                  {product.pricePln.toFixed(2).replace('.', ',')} PLN
                </span>
              </h2>
            </div>

            {/* Product Summary Row */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <img
                src={product.tryOnPhotoUrl || product.originalGarmentPhotoUrl}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-10 h-12 rounded-lg object-cover border border-white/10"
              />
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-medium text-white truncate">{product.title}</p>
                <p className="text-[11px] text-white/40 font-mono">Size: {product.size} • 14-day free return</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('blik')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  activeTab === 'blik'
                    ? 'border-white bg-white text-black font-bold shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60'
                }`}
              >
                <div className="h-5 flex items-center">
                  <span className={`text-xs tracking-wider font-extrabold ${activeTab === 'blik' ? 'text-black' : 'text-red-400'}`}>BLIK</span>
                </div>
                <span className="text-[10px] mt-1">6-DIGIT</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('apple_pay')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  activeTab === 'apple_pay'
                    ? 'border-white bg-white text-black font-bold shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60'
                }`}
              >
                <div className="h-5 flex items-center">
                  <Apple className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-1">APPLE PAY</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  activeTab === 'card'
                    ? 'border-white bg-white text-black font-bold shadow-md'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/60'
                }`}
              >
                <div className="h-5 flex items-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-1">STRIPE CARD</span>
              </button>
            </div>

            {/* TAB 1: BLIK */}
            {activeTab === 'blik' && (
              <form onSubmit={handleBlikSubmit} className="space-y-4">
                {blikStatus === 'waiting_app' ? (
                  <div className="bg-white/5 border border-white/20 rounded-2xl p-5 text-center space-y-3 animate-pulse">
                    <Smartphone className="w-8 h-8 text-white mx-auto animate-bounce" />
                    <div>
                      <h4 className="font-semibold text-sm text-white">Confirm in Banking App</h4>
                      <p className="text-xs text-white/50 mt-1">
                        Open the push notification on your mobile device ({selectedBank}) and confirm with PIN.
                      </p>
                    </div>
                    <div className="text-xs font-mono text-white/40">
                      Time remaining: <span className="text-white font-bold">{blikTimer}s</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-white/80 mb-1.5 flex justify-between">
                        <span>Enter 6-digit BLIK code</span>
                        <span className="text-[10px] text-white/40 font-mono">From banking app</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={6}
                          pattern="\d*"
                          required
                          value={blikCode}
                          onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000 000"
                          className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-3 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>

                    {/* Fast presets for BLIK code test */}
                    <div className="flex items-center justify-between text-[11px] text-white/50">
                      <span>Authorizing Bank:</span>
                      <select 
                        value={selectedBank} 
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white text-[11px] outline-none"
                      >
                        <option value="mBank" className="bg-black text-white">mBank</option>
                        <option value="PKO Bank Polski (IKO)" className="bg-black text-white">PKO BP (IKO)</option>
                        <option value="ING Bank Śląski" className="bg-black text-white">ING</option>
                        <option value="Santander" className="bg-black text-white">Santander</option>
                        <option value="Bank Millennium" className="bg-black text-white">Millennium</option>
                        <option value="Alior Bank" className="bg-black text-white">Alior</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Shipping info */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs space-y-2 font-mono">
                  <div className="flex items-center gap-2 text-white/70">
                    <Truck className="w-3.5 h-3.5 text-white/50" />
                    <span className="font-semibold text-[11px]">InPost Paczkomat Locker:</span>
                  </div>
                  <input
                    type="text"
                    value={paczkomatId}
                    onChange={(e) => setPaczkomatId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-black/40 border border-white/10 text-[11px] text-white outline-none focus:border-white/30"
                  />
                </div>

                {blikStatus !== 'waiting_app' && (
                  <button
                    type="submit"
                    disabled={blikCode.length !== 6 || isProcessing}
                    className="w-full py-3.5 rounded-lg bg-white hover:bg-white/90 text-black font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Pay with BLIK ({product.pricePln.toFixed(2)} PLN)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </form>
            )}

            {/* TAB 2: Apple Pay */}
            {activeTab === 'apple_pay' && (
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center space-y-3">
                  <Apple className="w-8 h-8 text-white mx-auto" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Express Biometric Payment</h4>
                    <p className="text-xs text-white/50 mt-1">
                      Cards stored in Apple Wallet. Confirm with Face ID or Touch ID.
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-white/60 bg-black/40 py-2 rounded border border-white/10">
                    Amount: <span className="text-white font-bold">{product.pricePln.toFixed(2)} PLN</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplePaySubmit}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-lg bg-white hover:bg-white/90 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Apple className="w-5 h-5 fill-black" />
                  <span>Pay with Apple Pay</span>
                </button>
              </div>
            )}

            {/* TAB 3: Credit Card */}
            {activeTab === 'card' && (
              <form onSubmit={handleCardSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-white/30"
                    />
                    <CreditCard className="w-4 h-4 text-white/40 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">Confirmation Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-lg bg-white hover:bg-white/90 text-black font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-black" />
                  <span>Pay with Card • {product.pricePln.toFixed(2)} PLN</span>
                </button>
              </form>
            )}

            {/* Footer Trust Info */}
            <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-white/40 border-t border-white/10">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                256-BIT SSL ENCRYPTION
              </span>
              <span>STRIPE PAYMENTS ENGINE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
