# Collab Card Invitation System Setup Guide

## Overview
This system automatically sends Collab Card invitations to users when they reach $500 in earnings. It includes database triggers, email notifications, invitation tracking, and admin management tools.

## Features Implemented

### ✅ Automatic Invitation System
- **Database Triggers**: Automatically detect when users reach $500 threshold
- **Email Notifications**: Send personalized invitations to eligible users
- **Invitation Tracking**: Monitor invitation status (sent, accepted, expired, failed)
- **Admin Dashboard**: Manage and monitor all invitations

### ✅ API Endpoints
- `/api/collab-card/process-invitations` - Process pending invitations and send emails
- `/api/cron/expire-invitations` - Expire old invitations (30+ days)
- `/api/collab-card/process-invitations` (GET) - Get invitation statistics

### ✅ Database Schema
- `collab_card_invitations` table for invitation tracking
- Database triggers for automatic invitation creation
- Statistics view for monitoring
- Platform logging integration

## Setup Instructions

### 1. Database Migration

Run the database migration to create the necessary tables and triggers:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f database-migrations/collab-card-invitations-setup.sql
```

This will create:
- `collab_card_invitations` table
- Database triggers for automatic invitation creation
- Functions for expiring old invitations
- Statistics view
- Indexes for performance

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_APP_URL=https://your-domain.com

# New variables for invitation system
CRON_SECRET=your-secure-cron-secret-key
EMAIL_SERVICE_API_KEY=your-email-service-key
```

### 3. Email Service Integration

The system includes a placeholder for email sending. You need to integrate with your preferred email service:

#### Option A: SendGrid
```typescript
// In utils/trigger_colab_card/index.ts, replace the sendCollabCardEmail function:

import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendCollabCardEmail(email: string, firstName: string, lastName: string, earnings: number): Promise<boolean> {
  try {
    const msg = {
      to: email,
      from: 'noreply@yourdomain.com',
      subject: "🎉 Congratulations! You're Eligible for a Free Collab Card",
      html: `... your email template ...`
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    return false;
  }
}
```

#### Option B: AWS SES
```typescript
import AWS from 'aws-sdk';

const ses = new AWS.SES({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function sendCollabCardEmail(email: string, firstName: string, lastName: string, earnings: number): Promise<boolean> {
  try {
    const params = {
      Source: 'noreply@yourdomain.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "🎉 Congratulations! You're Eligible for a Free Collab Card" },
        Body: { Html: { Data: `... your email template ...` } }
      }
    };
    
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error('AWS SES error:', error);
    return false;
  }
}
```

#### Option C: Resend
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendCollabCardEmail(email: string, firstName: string, lastName: string, earnings: number): Promise<boolean> {
  try {
    await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to: [email],
      subject: "🎉 Congratulations! You're Eligible for a Free Collab Card",
      html: `... your email template ...`
    });
    
    return true;
  } catch (error) {
    console.error('Resend error:', error);
    return false;
  }
}
```

### 4. Cron Job Setup

Set up cron jobs to automatically process invitations and expire old ones:

#### Option A: Using a Cron Job Service (Recommended)

**Vercel Cron Jobs** (if using Vercel):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/collab-card/process-invitations",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/expire-invitations",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**GitHub Actions**:
```yaml
# .github/workflows/cron.yml
name: Collab Card Cron Jobs

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
    - cron: '0 2 * * *'    # Daily at 2 AM

jobs:
  process-invitations:
    runs-on: ubuntu-latest
    steps:
      - name: Process Pending Invitations
        run: |
          curl -X POST https://your-domain.com/api/collab-card/process-invitations \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
  
  expire-invitations:
    runs-on: ubuntu-latest
    steps:
      - name: Expire Old Invitations
        run: |
          curl -X POST https://your-domain.com/api/cron/expire-invitations \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option B: Using External Cron Services

**Cron-job.org**:
- URL: `https://your-domain.com/api/collab-card/process-invitations`
- Schedule: Every 6 hours
- Headers: `Authorization: Bearer your-cron-secret`

**EasyCron**:
- URL: `https://your-domain.com/api/collab-card/process-invitations`
- Schedule: Every 6 hours
- Custom Headers: `Authorization: Bearer your-cron-secret`

### 5. Admin Dashboard Integration

Add the Collab Card Invitations component to your admin dashboard:

```typescript
// In your admin dashboard navigation
import CollabCardInvitations from './CollabCardInvitations';

// Add to your routes/menu
{
  key: 'collab-card-invitations',
  label: 'Collab Card Invitations',
  icon: <MailOutlined />,
  component: <CollabCardInvitations />
}
```

## How It Works

### 1. Automatic Trigger
When a user's earnings are updated and reach $500:
1. Database trigger detects the change
2. Checks if user already has an active card
3. Checks if user has already been invited
4. Creates invitation record in database
5. Updates user's card eligibility status

### 2. Email Processing
The cron job processes pending invitations:
1. Fetches invitations with `email_sent = false`
2. Sends personalized email to each user
3. Updates invitation status based on email success/failure
4. Logs all activities

### 3. Invitation Management
- Invitations expire after 30 days
- Users can only have one active invitation at a time
- All activities are logged for audit purposes
- Admin dashboard provides full visibility

## Monitoring and Maintenance

### Key Metrics to Monitor
- Total invitations sent
- Email delivery success rate
- Invitation acceptance rate
- Average time from invitation to acceptance
- Failed email deliveries

### Regular Maintenance Tasks
1. **Daily**: Check for failed email deliveries
2. **Weekly**: Review invitation statistics
3. **Monthly**: Clean up expired invitations
4. **Quarterly**: Review and optimize email templates

### Troubleshooting

#### Common Issues

**Emails not being sent:**
- Check email service API keys
- Verify email service quotas
- Check server logs for errors

**Invitations not being created:**
- Verify database triggers are active
- Check user earnings updates
- Review platform logs

**Cron jobs not running:**
- Verify cron job URLs are accessible
- Check authorization headers
- Review server logs

## Security Considerations

### API Protection
- Use `CRON_SECRET` for cron job authentication
- Implement rate limiting on API endpoints
- Log all API access for audit purposes

### Data Privacy
- Only send emails to users who have opted in
- Respect user email preferences
- Implement unsubscribe mechanisms

### Database Security
- Use parameterized queries
- Implement proper access controls
- Regular backup of invitation data

## Testing

### Manual Testing
1. Update a user's earnings to $500+
2. Check if invitation record is created
3. Process pending invitations manually
4. Verify email is sent
5. Test invitation acceptance flow

### Automated Testing
```typescript
// Example test for invitation system
describe('Collab Card Invitations', () => {
  it('should create invitation when user reaches $500', async () => {
    // Test implementation
  });
  
  it('should send email for pending invitations', async () => {
    // Test implementation
  });
});
```

## Future Enhancements

### Phase 2 Features
- **SMS Notifications**: Send text messages for invitations
- **Push Notifications**: In-app notifications
- **Reminder Emails**: Follow-up emails for unaccepted invitations
- **A/B Testing**: Test different email templates
- **Analytics Dashboard**: Detailed invitation analytics

### Technical Improvements
- **Real-time Processing**: WebSocket integration for instant notifications
- **Bulk Processing**: Handle large volumes of invitations
- **Email Templates**: Dynamic template system
- **Internationalization**: Multi-language support

## Support

For issues or questions:
1. Check the platform logs for error details
2. Review the admin dashboard for invitation status
3. Verify email service configuration
4. Test API endpoints manually

## Conclusion

This system provides a complete solution for automatically inviting users to Collab Cards when they reach the $500 earnings threshold. It includes robust error handling, comprehensive logging, and admin tools for monitoring and management.

The system is designed to be scalable, secure, and maintainable, with clear separation of concerns and comprehensive documentation. 