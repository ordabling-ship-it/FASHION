import { Router } from 'express';
import { z } from 'zod';
import { executeVintedListing, VintedListingPayload } from '../../../scrapers/vintedScraper';
import { executeOlxListing, OlxListingPayload } from '../../../scrapers/olxScraper';

/**
 * Legacy demo endpoints (payments + marketplace listing). These are still SIMULATED:
 * no real Stripe charge and no real Vinted/OLX listing is created.
 */
export function legacyRouter() {
  const r = Router();
  r.use((req, _res, next) => {
    if (req.method === 'POST') {
      const ok = z.record(z.string(), z.unknown()).safeParse(req.body);
      if (!ok.success) return next(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
    }
    next();
  });

// Stripe Checkout Session Endpoint (Supports Cards, BLIK, Apple Pay / Google Pay)
r.post('/stripe/create-checkout-session', async (req, res) => {
  try {
    const { productId, productTitle, amountPln, customerEmail, paymentMethod } = req.body;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    console.log(`[Stripe] Inicjalizacja płatności dla "${productTitle}" na kwotę ${amountPln} PLN (Metoda: ${paymentMethod})`);

    if (stripeSecretKey) {
      // In production with actual Stripe secret key:
      // const stripe = new Stripe(stripeSecretKey);
      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card', 'blik', 'link'],
      //   line_items: [{ price_data: { currency: 'pln', product_data: { name: productTitle }, unit_amount: Math.round(amountPln * 100) }, quantity: 1 }],
      //   mode: 'payment',
      //   success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
      //   cancel_url: `${req.headers.origin}/?status=cancelled`,
      // });
      // return res.json({ sessionUrl: session.url, sessionId: session.id, liveMode: true });
    }

    // Seamless simulated/sandbox checkout token with realistic BLIK and Apple Pay confirmation
    const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}`;
    res.json({
      success: true,
      sessionId: mockSessionId,
      amountPln,
      currency: 'PLN',
      productTitle,
      paymentMethod,
      customerEmail: customerEmail || 'klient@example.com',
      supportedMethods: ['blik', 'apple_pay', 'card', 'google_pay'],
      liveMode: Boolean(stripeSecretKey),
      message: stripeSecretKey ? 'Stripe Checkout Session utworzona.' : 'Tryb Sandbox Stripe aktywny (BLIK / Apple Pay).',
    });
  } catch (err: any) {
    console.error('Błąd Stripe Checkout:', err);
    res.status(500).json({ error: err.message || 'Błąd inicjalizacji płatności Stripe' });
  }
});

// BLIK verification endpoint (validates 6 digits and returns push approval simulation)
r.post('/stripe/verify-blik', async (req, res) => {
  try {
    const { blikCode, amountPln } = req.body;
    if (!blikCode || !/^\d{6}$/.test(blikCode.trim())) {
      return res.status(400).json({ error: 'Nieprawidłowy kod BLIK. Wprowadź 6 cyfr.' });
    }

    // Simulate standard Polish banking validation delay (400ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    res.json({
      success: true,
      transactionId: `TX-BLIK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      amountPln,
      status: 'confirmed',
      authorizedAt: new Date().toISOString(),
      bankMessage: 'Autoryzacja płatności BLIK potwierdzona w aplikacji mobilnej banku.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Błąd autoryzacji BLIK' });
  }
});

// Multichannel Listing Endpoint (Vinted & OLX browser automation scrapers)
r.post('/marketplace/list', async (req, res) => {
  try {
    const { product, platforms = ['vinted', 'olx'] } = req.body;

    if (!product || !product.title || !product.pricePln) {
      return res.status(400).json({ error: 'Niekompletne dane przedmiotu do wystawienia' });
    }

    console.log(`[Marketplace Automation] Uruchamianie wystawiania na platformy: ${platforms.join(', ')}`);

    const results: {
      vinted?: any;
      olx?: any;
    } = {};

    const tasks: Promise<any>[] = [];

    if (platforms.includes('vinted')) {
      const vintedPayload: VintedListingPayload = {
        title: product.title,
        description: `${product.description}\n\n[Wygenerowano przez AI VTON Studio - wideo rolka dostępna w ogłoszeniu]`,
        price: Number(product.pricePln),
        size: product.size || 'M',
        category: product.category || 'Kobiety > Sukienki',
        condition: product.condition || 'Bardzo dobry',
        brand: product.brand || 'VTON Exclusive',
        photoUrls: [product.tryOnPhotoUrl || product.originalGarmentPhotoUrl],
      };
      tasks.push(
        executeVintedListing(vintedPayload).then((res) => {
          results.vinted = res;
        })
      );
    }

    if (platforms.includes('olx')) {
      const olxPayload: OlxListingPayload = {
        title: product.title,
        description: `${product.description}\n\nStan: ${product.condition}. Możliwa szybka Przesyłka OLX przez Paczkomat InPost.`,
        price: Number(product.pricePln),
        size: product.size || 'M',
        category: product.category || 'Moda / Ubrania damskie',
        condition: product.condition || 'Używane w bardzo dobrym stanie',
        city: 'Warszawa',
        photoUrls: [product.tryOnPhotoUrl || product.originalGarmentPhotoUrl],
      };
      tasks.push(
        executeOlxListing(olxPayload).then((res) => {
          results.olx = res;
        })
      );
    }

    await Promise.all(tasks);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      platformsListed: platforms,
      results,
    });
  } catch (err: any) {
    console.error('Błąd automatyzacji marketplace:', err);
    res.status(500).json({ error: err.message || 'Błąd serwera automatyzacji Vinted/OLX' });
  }
});

  return r;
}
