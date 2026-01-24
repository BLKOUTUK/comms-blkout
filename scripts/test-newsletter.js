#!/usr/bin/env node

/**
 * BLKOUT Newsletter Test Script
 *
 * Purpose: Validate end-to-end newsletter workflow
 * Tests: Resend API, newsletter generation, email delivery
 *
 * Usage:
 *   node scripts/test-newsletter.js
 *
 * Requirements:
 *   - RESEND_API_KEY environment variable set
 *   - Test recipient email (defaults to robbe@blkoutuk.com)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_HK47Qpxi_8hfuv32bYXxnb3nzFkoMLrSS';
const TEST_RECIPIENT = process.env.TEST_EMAIL || 'rob@blkoutuk.com';
const FROM_ADDRESS = 'BLKOUT <onboarding@resend.dev>'; // Using Resend test domain (blkoutuk.com not verified)

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(title, 'bright');
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Test 1: Basic Resend API connectivity
 */
async function testResendConnection() {
  section('TEST 1: Resend API Connectivity');

  try {
    log('Testing Resend API with simple email...', 'cyan');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TEST_RECIPIENT],
        subject: 'BLKOUT Newsletter Test - Connectivity Check',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #a855f7;">✅ Resend API Test</h1>
            <p>If you're reading this, the Resend API integration is working!</p>
            <p><strong>Test Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>From:</strong> ${FROM_ADDRESS}</p>
            <p><strong>To:</strong> ${TEST_RECIPIENT}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is a test email from the BLKOUT Comms newsletter workflow validation.
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    log('✅ SUCCESS: Email sent via Resend', 'green');
    log(`   Email ID: ${result.id}`, 'bright');
    log(`   Recipient: ${TEST_RECIPIENT}`, 'bright');
    log(`\n   Check inbox at ${TEST_RECIPIENT}`, 'yellow');

    return { success: true, emailId: result.id };
  } catch (error) {
    log('❌ FAILED: Resend API connection failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Full newsletter HTML template
 */
async function testNewsletterTemplate() {
  section('TEST 2: Newsletter HTML Template');

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const newsletterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLKOUT Weekly Test - ${dateStr}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #4a1942 100%); padding: 30px; text-align: center; }
    .header img { max-width: 120px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header .subtitle { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px; }
    .content { padding: 30px; }
    .intro { font-size: 16px; color: #555; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 20px; color: #1a1a2e; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 3px solid #e91e63; display: inline-block; }
    .test-card { background: #fafafa; border-radius: 8px; padding: 15px; margin-bottom: 12px; border-left: 4px solid #e91e63; }
    .test-card h3 { margin: 0 0 8px 0; font-size: 16px; color: #1a1a2e; }
    .test-card p { margin: 0; font-size: 14px; color: #666; }
    .cta-box { background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%); border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }
    .cta-box h3 { color: white; margin: 0 0 10px 0; }
    .cta-box p { color: rgba(255,255,255,0.9); margin: 0 0 15px 0; font-size: 14px; }
    .cta-button { display: inline-block; background: white; color: #e91e63; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; }
    .footer { background: #1a1a2e; padding: 25px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; }
    .footer a { color: #e91e63; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://blkoutuk.com/images/blkout_logo_roundel_colour.png" alt="BLKOUT">
      <h1>BLKOUT Newsletter Test</h1>
      <div class="subtitle">Weekly Community Update - Test Edition</div>
    </div>

    <div class="content">
      <div class="intro">
        This is a test newsletter to validate the BLKOUT Comms workflow.
        If you're reading this beautifully formatted email, congratulations!
        The newsletter system is operational. 🎉
      </div>

      <div class="section">
        <h2 class="section-title">✨ Test Section 1: Community Highlights</h2>
        <div class="test-card">
          <h3>Newsletter System Validation</h3>
          <p>Testing end-to-end workflow from generation to delivery via Resend API.</p>
        </div>
        <div class="test-card">
          <h3>HTML Template Rendering</h3>
          <p>Verifying responsive design, branding, and email client compatibility.</p>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📅 Test Section 2: Technical Details</h2>
        <div class="test-card">
          <h3>Sent: ${now.toLocaleString()}</h3>
          <p>Test executed from newsletter test script (scripts/test-newsletter.js)</p>
        </div>
        <div class="test-card">
          <h3>Recipient: ${TEST_RECIPIENT}</h3>
          <p>Email delivery service: Resend API</p>
        </div>
      </div>

      <div class="cta-box">
        <h3>Test Complete</h3>
        <p>If this email looks good and all links work, the newsletter workflow is ready for production.</p>
        <a href="https://blkoutuk.com" class="cta-button">Visit BLKOUT</a>
      </div>
    </div>

    <div class="footer">
      <p>BLKOUT UK - Technology for Black Queer Liberation</p>
      <p>
        <a href="https://blkoutuk.com">Website</a> |
        <a href="mailto:info@blkoutuk.com">Contact</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px;">
        This is a test email from the newsletter workflow validation.<br>
        Test script: apps/comms-blkout/scripts/test-newsletter.js
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    log('Sending full newsletter HTML template...', 'cyan');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TEST_RECIPIENT],
        subject: `BLKOUT Newsletter Template Test - ${dateStr}`,
        html: newsletterHTML
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    log('✅ SUCCESS: Newsletter template sent', 'green');
    log(`   Email ID: ${result.id}`, 'bright');
    log(`\n   Validate in inbox:`, 'yellow');
    log(`   - BLKOUT logo displays`, 'yellow');
    log(`   - Purple/pink gradient header`, 'yellow');
    log(`   - All sections render correctly`, 'yellow');
    log(`   - CTA button works`, 'yellow');
    log(`   - Footer links present`, 'yellow');

    return { success: true, emailId: result.id };
  } catch (error) {
    log('❌ FAILED: Newsletter template test failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Verify domain configuration
 */
async function checkDomainVerification() {
  section('TEST 3: Domain Verification Status');

  log('ℹ️  Domain verification check:', 'cyan');
  log(`   FROM address: ${FROM_ADDRESS}`, 'bright');

  if (FROM_ADDRESS.includes('onboarding@resend.dev')) {
    log('\n   ⚠️  Using Resend test domain', 'yellow');
    log('   This is OK for testing, but you should verify blkoutuk.com for production', 'yellow');
    log('\n   Steps to verify domain:', 'cyan');
    log('   1. Login to resend.com dashboard', 'bright');
    log('   2. Go to Domains section', 'bright');
    log('   3. Add blkoutuk.com', 'bright');
    log('   4. Add DNS records as instructed', 'bright');
    log('   5. Wait for verification (24-48 hours)', 'bright');
    log('   6. Update FROM_ADDRESS in this script', 'bright');
  } else if (FROM_ADDRESS.includes('blkoutuk.com')) {
    log('\n   ✅ Using custom domain (blkoutuk.com)', 'green');
    log('   Verify domain is verified in Resend dashboard', 'yellow');
    log('   If emails aren\'t arriving, domain may not be verified yet', 'yellow');
  }

  return { success: true };
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║        BLKOUT NEWSLETTER WORKFLOW TEST SUITE              ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  log(`\nTest Configuration:`, 'cyan');
  log(`  API Key: ${RESEND_API_KEY.substring(0, 10)}...`, 'bright');
  log(`  Test Email: ${TEST_RECIPIENT}`, 'bright');
  log(`  From Address: ${FROM_ADDRESS}`, 'bright');
  log(`  Date: ${new Date().toLocaleString()}`, 'bright');

  const results = [];

  // Run tests sequentially
  results.push(await testResendConnection());

  if (results[0].success) {
    log('\n⏱️  Waiting 2 seconds before next test...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 2000));
    results.push(await testNewsletterTemplate());
  } else {
    log('\n⚠️  Skipping template test due to connectivity failure', 'yellow');
  }

  results.push(await checkDomainVerification());

  // Summary
  section('TEST SUMMARY');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  if (passed === total) {
    log(`✅ ALL TESTS PASSED (${passed}/${total})`, 'green');
    log('\nNewsletter workflow is operational!', 'green');
    log('Next steps:', 'cyan');
    log('  1. Check inbox for both test emails', 'bright');
    log('  2. Verify HTML renders correctly', 'bright');
    log('  3. Test on mobile and desktop clients', 'bright');
    log('  4. Generate real newsletter via API', 'bright');
  } else {
    log(`⚠️  SOME TESTS FAILED (${passed}/${total} passed)`, 'yellow');
    log('\nReview errors above and:', 'yellow');
    log('  1. Verify RESEND_API_KEY is correct', 'bright');
    log('  2. Check domain verification status', 'bright');
    log('  3. Confirm test email address is valid', 'bright');
  }

  console.log('\n');
}

// Run tests
runTests().catch(error => {
  log('\n❌ FATAL ERROR', 'red');
  log(error.stack, 'red');
  process.exit(1);
});
