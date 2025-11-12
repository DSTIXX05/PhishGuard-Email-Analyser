# PhishGuard Test Emails

Below are **benign, labeled test emails** for testing your PhishGuard extension. These contain phishing-like keywords but are clearly marked as security tests.

---

## Test Email 1: High Risk (Score: 4)

**Subject:** [TEST] Account Security Check - Please Verify Your Account

**Body:**

```
Hello,

This is a **SECURITY TEST EMAIL** for PhishGuard extension testing only.

We recommend you verify your account regularly for security purposes.
To demonstrate our phishing detection system, this email contains:
- Phrase: "verify your account"
- Phrase: "update your password"
- Phrase: "unusual activity detected"
- Call-to-action: "click here"

[TEST - Do not click] Click here to proceed with testing

This is NOT a real security alert. This is a benign test sample.
```

**Expected PhishGuard Result:** HIGH RISK (Score: 4)

---

## Test Email 2: Medium Risk (Score: 2)

**Subject:** [TEST] Password Update Reminder

**Body:**

```
Dear User,

This is a **SECURITY TEST EMAIL** for testing your PhishGuard extension.

For your account security, please update your password periodically.
This test email contains suspicious phrases like:
- "update your password"
- "click here"

Remember: Always verify the sender before taking action on email requests.

This is a benign test. No action required.
```

**Expected PhishGuard Result:** MEDIUM RISK (Score: 2)

---

## Test Email 3: Low Risk (Score: 0-1)

**Subject:** [TEST] Monthly Newsletter - Your Account Updates

**Body:**

```
Hello valued customer,

This is a **SECURITY TEST EMAIL** for PhishGuard testing.

Welcome to your monthly account summary. Your account remains secure and active.
We're here to help you get the most out of your services.

Please review your recent activity and contact us if you have any questions.

Best regards,
The Support Team
```

**Expected PhishGuard Result:** LOW RISK (Score: 0-1)

---

## Test Email 4: Medium Risk - Login Alert (Score: 2-3)

**Subject:** [TEST] Login Alert - Confirm Your Credentials

**Body:**

```
SECURITY TEST EMAIL - PhishGuard Extension Testing

We detected an unusual login attempt on your account.

To confirm your identity, please:
1. Verify your account details
2. Confirm your credentials within 24 hours
3. Update your password if needed

Login urgently to secure your account.

Note: This is a test email. Do not respond or click links.
```

**Expected PhishGuard Result:** MEDIUM to HIGH RISK (Score: 2-3)

- Keywords detected: "verify your account", "confirm your credentials", "login urgently"

---

## HTML Version for Gmail Testing

You can copy-paste these HTML versions directly into Gmail's compose as plain text or use them to test extraction:

### High Risk Email (HTML):

```html
<html>
  <body class="a3s aiL">
    <p>Hello,</p>
    <p><strong>[TEST] Security Test Email - PhishGuard Extension</strong></p>
    <p>This is a benign test email for PhishGuard extension testing.</p>
    <p>To verify your account security, please:</p>
    <ul>
      <li>Verify your account regularly</li>
      <li>Update your password periodically</li>
      <li>Check for unusual activity detected</li>
    </ul>
    <p><a href="#">Click here to proceed with the test</a></p>
    <p>
      <em>This is NOT a real security alert. This is a test sample only.</em>
    </p>
  </body>
</html>
```

### Medium Risk Email (HTML):

```html
<html>
  <body class="a3s aiL">
    <p>Dear User,</p>
    <p><strong>[TEST] Account Verification - PhishGuard Test</strong></p>
    <p>Please update your password to maintain security.</p>
    <p><a href="#">Click here to update your password</a></p>
    <p>This is a benign test email.</p>
  </body>
</html>
```

### Low Risk Email (HTML):

```html
<html>
  <body class="a3s aiL">
    <p>Hello,</p>
    <p><strong>[TEST] Your Monthly Summary</strong></p>
    <p>Here is your account summary for this month. Everything looks good!</p>
    <p>If you have any questions, please reach out to support.</p>
    <p>Best regards, The Team</p>
  </body>
</html>
```

---

## How to Test with PhishGuard

### Option 1: Forward/Create in Gmail

1. Copy one of the test emails above
2. Create a new email in Gmail and paste the content
3. Send it to yourself (or use Draft if you want to test locally)
4. Open the email
5. Click **"Scan This Email"** in your PhishGuard extension popup
6. Verify the risk level matches expectations

### Option 2: Local Testing with Mock Data

If you want to test without Gmail, you can mock the response in `popup.js`:

```javascript
// Add this for testing (remove for production)
const mockEmail = {
  subject: "[TEST] Verify Your Account",
  bodyText:
    "Please verify your account and update your password. Unusual activity detected. Click here to proceed.",
  links: [],
};

// Simulate Lambda response
const mockLambdaResponse = {
  risk_level: "High",
  score: 4,
  message: "Phishing likelihood analyzed successfully.",
};
```

---

## Keyword Coverage Test

Your Lambda checks for these keywords:

```
- "verify your account"
- "update your password"
- "login urgently"
- "confirm your credentials"
- "unusual activity detected"
- "click here"
```

**Test Coverage:**

- **High Risk (4+ keywords):** Test Email 1, Test Email 4
- **Medium Risk (2-3 keywords):** Test Email 2, Test Email 4
- **Low Risk (0-1 keywords):** Test Email 3

---

## Tips for Testing

1. **Check Browser Console:** Right-click extension popup → Inspect → Console tab to see logs
2. **Verify Content Extraction:** Look for "Extracted email:" logs showing the email body was captured
3. **Monitor Network Requests:** Open DevTools (F12) → Network tab → look for your Lambda URL request
4. **Check CORS Headers:** Verify Lambda response includes `Access-Control-Allow-Origin` header
5. **Test Edge Cases:**
   - Very long email bodies (test text truncation)
   - Emails with special characters (test sanitization)
   - Emails with no matching keywords (test Low Risk path)

---

## Cleanup

After testing:

- Delete test emails from Gmail inbox
- Clear extension's cached data if needed (right-click extension → Manage extension → Storage → Clear data)

Good luck with testing PhishGuard! 🎯
