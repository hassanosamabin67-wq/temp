#!/usr/bin/env node

/**
 * Test script for Collab Card Invitation System
 * 
 * This script tests the automatic invitation system by:
 * 1. Creating a test user
 * 2. Updating their earnings to trigger invitation
 * 3. Checking if invitation was created
 * 4. Processing pending invitations
 * 
 * Usage: node scripts/test-collab-card-invitations.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCollabCardInvitations() {
  console.log('🧪 Testing Collab Card Invitation System...\n');

  try {
    // Step 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = {
      userId: `test-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      userName: `testuser${Date.now()}`,
      earning: 0,
      card_eligible: false,
      has_collab_card: false
    };

    const { error: createError } = await supabase
      .from('users')
      .insert([testUser]);

    if (createError) {
      console.error('❌ Failed to create test user:', createError);
      return;
    }

    console.log('✅ Test user created:', testUser.email);

    // Step 2: Update earnings to $500 to trigger invitation
    console.log('\n2. Updating earnings to $500...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ earning: 500 })
      .eq('userId', testUser.userId);

    if (updateError) {
      console.error('❌ Failed to update earnings:', updateError);
      return;
    }

    console.log('✅ Earnings updated to $500');

    // Step 3: Wait a moment for database trigger to execute
    console.log('\n3. Waiting for database trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check if invitation was created
    console.log('\n4. Checking for invitation creation...');
    const { data: invitations, error: fetchError } = await supabase
      .from('collab_card_invitations')
      .select('*')
      .eq('user_id', testUser.userId);

    if (fetchError) {
      console.error('❌ Failed to fetch invitations:', fetchError);
      return;
    }

    if (invitations && invitations.length > 0) {
      console.log('✅ Invitation created successfully!');
      console.log('   - Invitation ID:', invitations[0].id);
      console.log('   - Status:', invitations[0].status);
      console.log('   - Earnings at invitation:', invitations[0].earnings_at_invitation);
    } else {
      console.log('❌ No invitation found - trigger may not be working');
    }

    // Step 5: Test invitation processing
    console.log('\n5. Testing invitation processing...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/collab-card/process-invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Invitation processing successful!');
      console.log('   - Processed:', result.processed);
      console.log('   - Successful:', result.successful);
      console.log('   - Failed:', result.failed);
    } else {
      console.log('❌ Invitation processing failed:', result.error);
    }

    // Step 6: Check invitation statistics
    console.log('\n6. Checking invitation statistics...');
    const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/collab-card/process-invitations`);
    const stats = await statsResponse.json();

    if (statsResponse.ok && stats.statistics) {
      console.log('✅ Statistics retrieved:');
      console.log('   - Total invitations:', stats.statistics.total_invitations);
      console.log('   - Pending:', stats.statistics.pending_invitations);
      console.log('   - Accepted:', stats.statistics.accepted_invitations);
      console.log('   - Expired:', stats.statistics.expired_invitations);
    } else {
      console.log('❌ Failed to retrieve statistics');
    }

    // Step 7: Cleanup test data
    console.log('\n7. Cleaning up test data...');
    await supabase
      .from('collab_card_invitations')
      .delete()
      .eq('user_id', testUser.userId);

    await supabase
      .from('users')
      .delete()
      .eq('userId', testUser.userId);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up email service integration');
    console.log('2. Configure cron jobs');
    console.log('3. Add admin dashboard component');
    console.log('4. Test with real users');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('   - NEXT_PUBLIC_APP_URL');
    process.exit(1);
  }

  testCollabCardInvitations();
}

module.exports = { testCollabCardInvitations }; 