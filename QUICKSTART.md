# Quick Start Guide for PhishGuard

Get PhishGuard running in 10 minutes.

## Step 1: AWS Setup (5 minutes)

1. **Create Lambda Function**

   - Go to AWS Lambda Console
   - Create new function named `phishguard-analyzer`
   - Choose Python 3.11 runtime
   - Copy code from `lambda/phishguard-analyzer.py` into the editor

2. **Add Comprehend Permissions**

   - Click Configuration → Execution role
   - Add inline policy:

   ```json
   {
     "Effect": "Allow",
     "Action": ["comprehend:DetectSentiment", "comprehend:DetectEntities"],
     "Resource": "*"
   }
   ```

3. **Create Function URL**
   - Configuration → Function URL → Create function URL
   - Auth type: NONE
   - CORS: Enable (Allow all origins)
   - Copy the URL (you'll need this)

## Step 2: Chrome Extension Setup (3 minutes)

1. **Update Lambda URL**

   - Open `background.js`
   - Replace `LAMBDA_URL` with your Function URL from Step 1
   - Save

2. **Load Extension in Chrome**

   - Open `chrome://extensions`
   - Enable Developer mode (top-right)
   - Click "Load unpacked"
   - Select the `phishguard-extension` folder
   - PhishGuard icon should appear in toolbar

3. **Verify Installation**
   - Right-click PhishGuard icon
   - Click "This can read and change site data"
   - Select "On all sites" or "On mail.google.com"

## Step 3: Test It (2 minutes)

1. **Test Email in Gmail**

   - Open Gmail
   - Create a new email with subject: "Verify Your Account"
   - Add body: "Please verify your account and update your password immediately. Click here."
   - Send to yourself

2. **Scan with PhishGuard**
   - Open the email you just created
   - Click the PhishGuard icon in top-right
   - Click "Scan This Email"
   - Should see: 🚨 HIGH RISK

## Troubleshooting

**Extension not appearing in Chrome?**

- Make sure you're using Chrome (not Edge, Firefox, etc.)
- Try reloading `chrome://extensions`

**"Failed to fetch" error?**

- Check that Lambda URL is correct in `background.js`
- Make sure Lambda is deployed (not draft)
- Test URL in browser (should return error in JSON format)

**"Analysis error" message?**

- Check Lambda CloudWatch logs (Lambda → Monitor → View logs in CloudWatch)
- Verify IAM policy is attached correctly
- Make sure you're in correct AWS region

**Extension works but showing "undefined" values?**

- Make sure you updated `background.js` with correct Lambda URL
- Check that Lambda function is returning valid JSON

## What's Next?

- Try scanning the test emails in `TEST_EMAILS.md`
- Customize keywords in Lambda function
- Set up monitoring in CloudWatch
- (Optional) Deploy to Chrome Web Store

## Files Overview

```
phishguard-extension/
├── manifest.json           # Extension config
├── popup.html             # UI
├── popup.js               # User interactions
├── content.js             # Extracts email from Gmail
├── background.js          # Talks to Lambda
├── lambda/
│   └── phishguard-analyzer.py  # AWS Lambda code
└── TEST_EMAILS.md         # Sample emails for testing
```

## Documentation

- **Full README**: `README.md`
- **AWS Setup Guide**: `AWS-DEPLOYMENT.md`
- **Test Emails**: `TEST_EMAILS.md`

## Support

Check `README.md` for full documentation and troubleshooting.
