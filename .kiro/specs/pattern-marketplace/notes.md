# Pattern Marketplace — Future Feature Notes

## Status: Planning (not started)

## Concept

Users can share/sell their crochet patterns through a built-in marketplace within Wired for Crochet. Similar to Etsy or Ravelry's pattern shop, but integrated directly into the app.

## Revenue Model

- Sellers set their own price (or free)
- Wired for Crochet takes a percentage commission on paid sales (TBD — typical is 10-15%)
- Free patterns have no commission

## Key Features

### For Sellers (Pattern Creators)
- Publish button on existing patterns (private → public/listed)
- Set price (GBP, with currency conversion for international buyers)
- Pattern preview (what buyers see before purchasing)
- Seller dashboard: sales count, earnings, pending payouts
- Payout management (bank details, payout schedule)
- Analytics: views, conversion rate, popular patterns

### For Buyers
- Browse/search marketplace (by category, difficulty, yarn weight, price)
- Preview pattern details (intro, yarn requirements, photos, reviews)
- Purchase flow (card payment)
- "My Library" — purchased and free patterns saved to account
- Download purchased patterns (PDF or in-app view)
- Leave reviews/ratings

### Platform Features
- Public-facing marketplace pages (SEO-friendly, no auth required to browse)
- Payment processing: Stripe Connect (split payments)
- Content moderation (flag/report inappropriate patterns)
- Featured/trending patterns
- Categories and tags
- Search with filters

## Technical Considerations

### Payments
- Stripe Connect for marketplace payments (platform takes commission automatically)
- Each seller onboards via Stripe Connect Express
- Handles payouts, refunds, disputes
- Webhook handling for payment events

### Database
- `published_patterns` table (or `is_published` + `price` columns on patterns)
- `pattern_purchases` table (buyer_id, pattern_id, amount, commission, stripe_payment_id)
- `seller_profiles` table (stripe_account_id, payout_details, bio)
- `pattern_reviews` table (buyer_id, pattern_id, rating, comment)

### Public Pages
- `/marketplace` — browse all published patterns
- `/marketplace/[slug]` — individual pattern listing page
- `/sellers/[username]` — seller profile/shop page
- These need to be public (no auth required to view)

### Security
- Purchased pattern files only accessible to buyers (signed URLs)
- Prevent unauthorized downloads
- Rate limiting on purchases
- Fraud detection

### Tier Gating
- Selling patterns could be a Pro/Pro+ feature
- Buying could be available to all users (even free tier)

## Dependencies
- Stripe account setup
- Terms of service / seller agreement
- Content policy / moderation guidelines
- Tax implications (VAT for UK sellers)

## Open Questions
- What commission percentage? (10%? 15%?)
- Minimum price for paid patterns?
- Refund policy?
- Do free-tier users get to sell, or only Pro+?
- Should there be a review/approval process before patterns go live?
- Support for pattern bundles/collections?
- Subscription model (monthly access to all patterns) vs individual purchases?

## Priority
This is a major feature that should be built after:
1. ✅ Core project tracking
2. ✅ Business suite
3. ✅ Invoicing system
4. Current: Polish and testing phase
5. **Next major feature: Pattern Marketplace**
