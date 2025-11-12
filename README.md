# PhishGuard 🛡️

A powerful Chrome extension that detects phishing emails in Gmail using AI-driven analysis. PhishGuard leverages AWS Lambda, Amazon Comprehend, and advanced keyword matching to identify suspicious emails in real-time.

## Features

✨ **Real-time Phishing Detection** — Analyzes emails instantly when you click "Scan This Email"

🤖 **AI-Powered Analysis** — Uses AWS Comprehend for:

- Sentiment analysis (negative tone = higher risk)
- Entity recognition (detects brand impersonation)
- NLP-based threat detection

🎯 **Multi-Factor Risk Scoring**:

- Phishing keyword detection (verify account, update password, etc.)
- Urgency pattern matching (urgent, immediate, act now)
- Sentiment weighting (threats, warnings)
- Brand impersonation detection (PayPal, Amazon, Microsoft, etc.)

📊 **Detailed Risk Breakdown** — Shows exactly why an email is flagged:

- High Risk (🚨): 8+ points
- Medium Risk (⚠️): 5-7 points
- Low Risk (✅): <5 points

💡 **Contextual Messages** — Each analysis includes human-readable explanations of red flags found

## Installation

### Prerequisites

- Google Chrome (or Chromium-based browser)
- AWS Account with Lambda and Comprehend enabled
- Node.js (optional, for development)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/phishguard-extension.git
   cd phishguard-extension
   ```

2. **Set up AWS Lambda**

   - Create a Lambda function using the code in `lambda/phishguard-analyzer.py`
   - Attach IAM permissions for Comprehend (DetectSentiment, DetectEntities)
   - Create a Lambda Function URL (CORS enabled)
   - Copy your Lambda URL

3. **Update the extension configuration**

   - Open `background.js`
   - Replace the `LAMBDA_URL` with your Lambda Function URL:

   ```javascript
   const LAMBDA_URL = "https://your-lambda-url.lambda-url.region.on.aws/";
   ```

4. **Load the extension into Chrome**

   - Open `chrome://extensions`
   - Enable **Developer mode** (top-right corner)
   - Click **Load unpacked**
   - Select the `phishguard-extension` folder
   - The PhishGuard icon should appear in your Chrome toolbar

5. **Test it out**
   - Open Gmail
   - Open any email
   - Click the PhishGuard icon in the top-right
   - Click **"Scan This Email"**
   - View the phishing risk assessment

## Project Structure

```
phishguard-extension/
├── manifest.json           # Chrome extension manifest (v3)
├── popup.html             # Popup UI
├── popup.js               # Popup logic
├── popup.css              # Popup styling (AWS dark theme)
├── background.js          # Service worker (Lambda communication)
├── content.js             # Content script (email extraction)
├── icon.png              # Extension icon
├── TEST_EMAILS.md        # Test email samples for development
├── lambda/
│   └── phishguard-analyzer.py  # AWS Lambda function code
├── README.md             # This file
├── .gitignore           # Git ignore rules
└── LICENSE              # MIT License
```

## How It Works

### Email Extraction Flow

1. **User clicks "Scan This Email"** in the popup
2. **content.js** runs on the Gmail page and extracts:
   - Subject line
   - Email body (text & HTML)
   - Sender information
   - Links in the email
3. **popup.js** receives the email object
4. **background.js** sends it to Lambda via HTTP POST
5. **Lambda function** analyzes with AWS Comprehend
6. **Result** is displayed in the popup with risk level and explanation

### Risk Scoring Algorithm

```
Total Score = (Keywords × 2) + Urgency + Sentiment Weight + (Entities × 2)

Risk Levels:
- High Risk   → Score ≥ 8
- Medium Risk → Score 5-7
- Low Risk    → Score < 5
```

**Scoring Components:**

- **Keywords** (×2): Detects phishing phrases (verify account, update password, etc.)
- **Urgency** (×1): Matches urgency language (immediately, urgent, act now)
- **Sentiment** (+3/-1): Negative sentiment adds weight; positive subtracts
- **Entities** (×2): Detects impersonation of trusted brands

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

- `COMPREHEND_REGION`: AWS region (default: eu-west-1)
- `KEYWORD_SENSITIVITY`: Adjust keyword matching sensitivity (default: 1.0)

### Extension Configuration

Edit `background.js` to change:

- Lambda URL
- Request timeout
- Error handling behavior

## Testing

### Using Test Emails

1. Open `TEST_EMAILS.md` for sample phishing and legitimate emails
2. Copy a test email into Gmail as a draft or forward
3. Click "Scan This Email" to verify detection accuracy

### Expected Results

| Test Email  | Keywords | Urgency | Sentiment | Expected Risk |
| ----------- | -------- | ------- | --------- | ------------- |
| High Risk   | 4+       | 1+      | NEGATIVE  | 🚨 High       |
| Medium Risk | 2-3      | 0-1     | MIXED     | ⚠️ Medium     |
| Low Risk    | 0-1      | 0       | POSITIVE  | ✅ Low        |

### Browser Console

1. Right-click the PhishGuard icon → **Inspect popup**
2. Open the **Console** tab
3. Scan an email to see detailed logs:
   - Extracted email data
   - Lambda request/response
   - Analysis breakdown

## Security & Privacy

🔒 **Data Handling:**

- Email content is sent to AWS Lambda for analysis only
- No data is stored or logged (configure Lambda CloudWatch as needed)
- HTTPS only — all communication is encrypted
- Extension permissions are minimal (activeTab, scripting on Gmail)

🔐 **Best Practices:**

- Use AWS IAM roles and policies
- Enable CloudTrail for Lambda auditing
- Regularly review IAM permissions
- Keep Lambda code updated

## Troubleshooting

### "Failed to fetch" Error

- **Cause**: Lambda URL is incorrect or unreachable
- **Fix**: Verify Lambda URL in `background.js`, check Lambda is deployed and active

### "AccessDeniedException" (Comprehend)

- **Cause**: Lambda role lacks Comprehend permissions
- **Fix**: Attach the IAM policy shown above to Lambda's execution role

### Email content not extracted

- **Cause**: Gmail DOM selectors changed or email not fully loaded
- **Fix**: Check `content.js` selectors, wait for email to load completely

### CORS errors

- **Cause**: Lambda CORS not configured on AWS
- **Fix**: Enable CORS on Lambda Function URL settings in AWS console

## Development

### Local Testing

```bash
# Install dependencies (if using build tools)
npm install

# Run tests
npm test

# Build extension (if using webpack/bundler)
npm run build
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Support for other email providers (Outlook, Yahoo Mail, ProtonMail)
- [ ] Browser history of flagged emails
- [ ] Custom keyword and urgency pattern configuration
- [ ] Machine learning model for better accuracy
- [ ] Phishing database integration (URLhaus, OpenPhish)
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Email report feature

## Known Limitations

⚠️ **Current Limitations:**

- Gmail-only (other email providers not yet supported)
- Requires active Lambda invocation (no background scanning)
- Sentiment analysis is English-only
- Keyword matching is substring-based (not regex/word boundaries)
- No local ML model (depends on AWS services)

## Performance

- **Analysis time**: ~1-2 seconds (Lambda cold start + Comprehend API)
- **Email extraction**: ~500ms
- **UI update**: Instant upon response

## License

This project is licensed under the MIT License — see the LICENSE file for details.

## Support

Need help?

- 📧 **Email**: support@phishguard.dev
- 🐛 **Report Issues**: GitHub Issues
- 💬 **Discussions**: GitHub Discussions
- 📚 **Documentation**: See `TEST_EMAILS.md` and code comments

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
#   P h i s h G u a r d - E m a i l - A n a l y s e r  
 