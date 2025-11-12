# PhishGuard 🛡️

A powerful Chrome extension that detects phishing emails in Gmail using AI-driven analysis. PhishGuard leverages AWS Lambda, Amazon Comprehend, and advanced keyword matching to identify suspicious emails in real-time.

## Features

- ✨ **Real-time Phishing Detection** — Analyzes emails instantly when you click "Scan This Email"
- 🤖 **AI-Powered Analysis** — Uses AWS Comprehend for sentiment analysis, entity recognition, and NLP-based threat detection
- 🎯 **Multi-Factor Risk Scoring** — Detects phishing keywords, urgency patterns, sentiment weighting, and brand impersonation
- 📊 **Detailed Risk Breakdown** — Shows exactly why an email is flagged with color-coded risk levels
- 💡 **Contextual Messages** — Human-readable explanations of red flags found in each email

### Risk Levels

| Level       | Score      | Indicator |
| ----------- | ---------- | --------- |
| High Risk   | ≥ 8 points | 🚨        |
| Medium Risk | 5-7 points | ⚠️        |
| Low Risk    | < 5 points | ✅        |

## Installation

### Prerequisites

- Google Chrome (or Chromium-based browser)
- AWS Account with Lambda and Comprehend enabled
- Node.js (optional, for development)

### Quick Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/phishguard-extension.git
cd phishguard-extension
```

2. **Set up AWS Lambda**

   - Create a Lambda function using the code in `lambda/phishguard-analyzer.py`
   - Attach IAM permissions for Comprehend (DetectSentiment, DetectEntities)
   - Create a Lambda Function URL with CORS enabled
   - Copy your Lambda URL

3. **Configure the extension**

   Open `background.js` and replace the `LAMBDA_URL`:

```javascript
const LAMBDA_URL = "https://your-lambda-url.lambda-url.region.on.aws/";
```

4. **Load into Chrome**

   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (top-right corner)
   - Click **Load unpacked**
   - Select the `phishguard-extension` folder
   - The PhishGuard icon will appear in your Chrome toolbar

5. **Test it out**

   - Open Gmail and select any email
   - Click the PhishGuard icon
   - Click **"Scan This Email"**
   - View the phishing risk assessment

## Project Structure

```
phishguard-extension/
├── manifest.json              # Chrome extension manifest (v3)
├── popup.html                 # Popup UI
├── popup.js                   # Popup logic
├── popup.css                  # Popup styling
├── background.js              # Service worker
├── content.js                 # Content script for Gmail
├── TEST_EMAILS.md             # Test email samples
├── lambda/
│   └── phishguard-analyzer.py # AWS Lambda function
├── README.md                  # This file
├── LICENSE                    # MIT License
└── AWS-DEPLOYMENT.md          # AWS setup guide
```

## How It Works

### Email Analysis Flow

1. **User clicks "Scan This Email"** in the popup
2. **content.js** extracts email data:
   - Subject line
   - Email body (text & HTML)
   - Sender information
   - Links
3. **popup.js** receives the email object
4. **background.js** sends data to Lambda via HTTP POST
5. **Lambda function** analyzes with AWS Comprehend
6. **Result** displays in popup with risk level and explanation

### Risk Scoring Algorithm

```
Total Score = (Keywords × 2) + Urgency + Sentiment Weight + (Entities × 2)
```

**Scoring Breakdown:**

| Component | Weight | Description                                                      |
| --------- | ------ | ---------------------------------------------------------------- |
| Keywords  | ×2     | Detects phishing phrases (verify account, update password, etc.) |
| Urgency   | ×1     | Matches urgency language (immediately, urgent, act now)          |
| Sentiment | +3/-1  | Negative sentiment adds weight; positive subtracts               |
| Entities  | ×2     | Detects impersonation of trusted brands                          |

**Risk Thresholds:**

- **High Risk** → Score ≥ 8
- **Medium Risk** → Score 5-7
- **Low Risk** → Score < 5

## Configuration

### AWS Lambda Setup

**Required IAM Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["comprehend:DetectSentiment", "comprehend:DetectEntities"],
      "Resource": "*"
    }
  ]
}
```

**Environment Variables (Optional):**

| Variable              | Default     | Description                  |
| --------------------- | ----------- | ---------------------------- |
| `COMPREHEND_REGION`   | `eu-west-1` | AWS region for Comprehend    |
| `KEYWORD_SENSITIVITY` | `1.0`       | Keyword matching sensitivity |

### Extension Configuration

Edit `background.js` to customize:

- Lambda URL
- Request timeout
- Error handling behavior

## Testing

### Using Test Emails

1. Open `TEST_EMAILS.md` for sample phishing and legitimate emails
2. Copy a test email into Gmail
3. Click "Scan This Email" to verify detection

### Test Results Reference

| Test Case   | Keywords | Urgency | Sentiment | Expected  |
| ----------- | -------- | ------- | --------- | --------- |
| High Risk   | 4+       | 1+      | NEGATIVE  | 🚨 High   |
| Medium Risk | 2-3      | 0-1     | MIXED     | ⚠️ Medium |
| Low Risk    | 0-1      | 0       | POSITIVE  | ✅ Low    |

### Browser Console Debugging

1. Right-click the PhishGuard icon → **Inspect popup**
2. Open the **Console** tab
3. Scan an email to see logs:
   - Extracted email data
   - Lambda request/response
   - Analysis breakdown

## Security & Privacy

### Data Handling 🔒

- Email content is sent to AWS Lambda for analysis only
- No data is stored or logged by the extension
- All communication is HTTPS encrypted
- Minimal extension permissions (activeTab, scripting on Gmail only)

### Best Practices 🔐

- Use AWS IAM roles and least-privilege policies
- Enable CloudTrail for Lambda auditing
- Regularly review and update IAM permissions
- Keep Lambda function code up to date

## Troubleshooting

### "Failed to fetch" Error

**Cause:** Lambda URL is incorrect or unreachable

**Solution:**

- Verify Lambda URL in `background.js`
- Confirm Lambda is deployed and active
- Check AWS Lambda function URL is enabled

### "AccessDeniedException" from Comprehend

**Cause:** Lambda role lacks Comprehend permissions

**Solution:**

- Attach the IAM policy above to Lambda's execution role
- Verify permissions are applied correctly

### Email Content Not Extracted

**Cause:** Gmail DOM selectors changed or email not fully loaded

**Solution:**

- Check `content.js` selectors match current Gmail DOM
- Wait for email to load completely before scanning
- Check browser console for specific errors

### CORS Errors

**Cause:** Lambda CORS not configured on AWS

**Solution:**

- Enable CORS on Lambda Function URL settings
- Verify CORS headers in Lambda response

## Development

### Local Setup

```bash
# Install dependencies (if using build tools)
npm install

# Run tests
npm test

# Build extension
npm run build
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## Roadmap

- [ ] Support for other email providers (Outlook, Yahoo Mail, ProtonMail)
- [ ] Email scan history and dashboard
- [ ] Custom keyword and urgency pattern configuration
- [ ] Machine learning model for improved accuracy
- [ ] Phishing database integration (URLhaus, OpenPhish)
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Email report feature

## Known Limitations

- ⚠️ Gmail-only (other email providers not yet supported)
- Requires active Lambda invocation (no background scanning)
- Sentiment analysis is English-only
- Keyword matching uses substring matching (not regex)
- No local ML model (depends on AWS services)

## Performance

- **Analysis time:** ~1-2 seconds (Lambda cold start + Comprehend API)
- **Email extraction:** ~500ms
- **UI update:** Instant upon response

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Support

Need help?

- 📧 **Email:** support@phishguard.dev
- 🐛 **Report Issues:** [GitHub Issues](../../issues)
- 💬 **Discussions:** [GitHub Discussions](../../discussions)
- 📚 **Docs:** See `TEST_EMAILS.md` and code comments

## Changelog

### v1.0 (Initial Release)

- ✅ Core phishing detection with keyword matching
- ✅ AWS Comprehend integration (sentiment + entities)
- ✅ Chrome extension popup UI
- ✅ Gmail content extraction
- ✅ Contextual risk messages

### v1.1 (Planned)

- Multi-email provider support
- Scan history dashboard

## Credits

Built with ❤️ using:

- [Chrome Extension API (Manifest V3)](https://developer.chrome.com/docs/extensions/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [Amazon Comprehend](https://aws.amazon.com/comprehend/)

---

**PhishGuard** — Protecting your inbox from phishing attacks. 🛡️
