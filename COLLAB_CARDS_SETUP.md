# Collab Cards Setup Guide

## Overview
Collab Cards is a feature that integrates Stripe Issuing to offer branded cards that give creators instant access to their earnings. Users can either earn a free card after reaching $500 in platform revenue or purchase one for $10.

## Prerequisites

### 1. Stripe Account Setup
- Ensure you have a Stripe account with Issuing enabled
- Request Issuing access from Stripe (this requires approval)
- Set up your Stripe webhook endpoint

### 2. Environment Variables
Add these to your `.env.local` file:
```env
# Existing Stripe variables
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# New variables for Collab Cards
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook secret for card events
```

### 3. Database Setup
Run the migration script to create necessary tables:
```sql
-- Execute the contents of database-migrations/collab-cards-setup.sql
```

## Features Implemented

### 1. Two Access Paths

#### Earn It (Free)
- Users qualify for a free Collab Card after earning $500
- Automatic eligibility checking
- Progress tracking toward the $500 threshold

#### Buy It Now ($10)
- Users can purchase a Collab Card for $10 anytime
- Stripe Checkout integration
- Virtual card available immediately

### 2. API Endpoints

#### `/api/stripe/issuing/create-card`
- Creates Stripe Issuing cards
- Validates eligibility for free cards
- Saves card information to database

#### `/api/stripe/issuing/buy-card`
- Creates payment intent for $10 card purchase
- Handles payment processing

#### `/api/stripe/issuing/card-status`
- Checks user's card eligibility and status
- Returns current earnings and card information

#### `/api/stripe/webhooks`
- Processes Stripe webhook events
- Automatically creates cards after successful payment
- Updates card status in database

### 3. React Components

#### `CollabCards` Component
- Main component for the Collab Cards feature
- Displays both "Earn It" and "Buy It Now" options
- Shows progress toward $500 threshold
- Handles card creation flow

#### `CollabCardPaymentForm` Component
- Payment form for $10 card purchases
- Integrates with Stripe Elements
- Handles payment confirmation

### 4. Utility Functions

#### `utils/cardEligibility.ts`
- `checkCardEligibility()` - Check if user qualifies for free card
- `updateUserEarnings()` - Update earnings and check eligibility
- `canCreateCard()` - Determine if user can create a card

## Setup Steps

### 1. Database Migration
```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f database-migrations/collab-cards-setup.sql
```

### 2. Stripe Webhook Configuration
1. Go to your Stripe Dashboard
2. Navigate to Developers > Webhooks
3. Add endpoint: `https://your-domain.com/api/stripe/webhooks`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `issuing.card.created`
   - `issuing.card.updated`
5. Copy the webhook secret to your environment variables

### 3. Stripe Issuing Setup
1. Request Issuing access from Stripe
2. Configure your Issuing program settings
3. Set up card design and branding
4. Configure spending controls and limits

### 4. Integration Points

#### Update User Earnings
When users earn money, call the utility function:
```typescript
import { updateUserEarnings } from '@/utils/cardEligibility';

// After a successful transaction
await updateUserEarnings(userId, newTotalEarnings);
```

#### Add to Navigation
Add a link to the Collab Cards page in your navigation:
```typescript
// In your navigation component
<Link href="/collab-cards">Collab Cards</Link>
```

## Usage

### For Users
1. Navigate to `/collab-cards`
2. Choose between "Earn It" or "Buy It Now"
3. For "Earn It": Wait until earnings reach $500
4. For "Buy It Now": Complete $10 payment
5. Receive virtual card immediately

### For Developers
```typescript
// Check card eligibility
import { getCardStatus } from '@/utils/cardEligibility';

const status = await getCardStatus(userId);
if (status?.isEligibleForFreeCard) {
    // User can get free card
}

// Update earnings (automatically checks eligibility)
import { updateUserEarnings } from '@/utils/cardEligibility';

await updateUserEarnings(userId, newEarnings);
```

## Security Considerations

1. **Webhook Verification**: All Stripe webhooks are verified using signatures
2. **Database Constraints**: Unique constraints prevent duplicate active cards
3. **Eligibility Validation**: Server-side validation of $500 threshold
4. **Payment Security**: Stripe handles all payment processing

## Monitoring

### Key Metrics to Track
- Number of cards created (free vs purchased)
- Revenue from card purchases
- User engagement with cards
- Earnings distribution among card holders

### Logs to Monitor
- Card creation success/failure
- Payment processing errors
- Webhook event processing
- Database constraint violations

## Future Enhancements

### Phase 2 Features
1. **Physical Cards**: Add option for physical card delivery
2. **Card Management**: Allow users to view, suspend, or cancel cards
3. **Spending Analytics**: Track card usage and spending patterns
4. **Rewards Program**: Add cashback or rewards for card usage
5. **Multiple Cards**: Allow users to have multiple cards for different purposes

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live card status
2. **Mobile App**: Native mobile app integration
3. **Advanced Analytics**: Detailed spending and earning analytics
4. **Automated Payouts**: Automatic transfers to cards based on earnings

## Troubleshooting

### Common Issues

1. **Card Creation Fails**
   - Check Stripe Issuing is enabled
   - Verify webhook is properly configured
   - Check database constraints

2. **Payment Processing Errors**
   - Verify Stripe keys are correct
   - Check payment method configuration
   - Review webhook event logs

3. **Eligibility Not Updating**
   - Ensure earnings are being updated correctly
   - Check database migration was applied
   - Verify utility functions are being called

### Debug Steps
1. Check Stripe Dashboard for failed requests
2. Review application logs for errors
3. Verify database constraints and data integrity
4. Test webhook endpoint manually

## Support

For technical support or questions about the Collab Cards feature, please refer to:
- Stripe Issuing documentation
- Stripe webhook documentation
- Application logs and error tracking 