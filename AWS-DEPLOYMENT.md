# AWS Deployment Guide for PhishGuard

This guide walks through deploying PhishGuard's Lambda function to AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured locally (optional, but recommended)
- Python 3.9+ installed locally (for testing)

## Step 1: Create Lambda Function

### Via AWS Console

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Click **Create function**
3. Configure:

   - **Function name**: `phishguard-analyzer`
   - **Runtime**: Python 3.11
   - **Architecture**: x86_64
   - **Execution role**: Create new role with basic Lambda permissions

4. Click **Create function**

### Via AWS CLI

```bash
aws lambda create-function \
  --function-name phishguard-analyzer \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR-ACCOUNT-ID:role/lambda-role \
  --handler phishguard-analyzer.lambda_handler \
  --zip-file fileb://function.zip
```

## Step 2: Add Code

### Via Console

1. Open your Lambda function
2. Go to **Code** tab
3. Copy the code from `lambda/phishguard-analyzer.py`
4. Paste into the editor
5. Click **Deploy**

### Via CLI

```bash
# Create deployment package
zip function.zip phishguard-analyzer.py

# Update function code
aws lambda update-function-code \
  --function-name phishguard-analyzer \
  --zip-file fileb://function.zip
```

## Step 3: Attach IAM Permissions

Your Lambda needs permissions to call Comprehend.

### Via Console

1. Open Lambda function
2. Click **Configuration** tab
3. Click on the **Execution role** link
4. In IAM console, click **Add inline policy**
5. Choose **JSON** and paste:

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

6. Name: `PhishguardComprehendPolicy`
7. Click **Create policy**

### Via CLI

```bash
aws iam put-role-policy \
  --role-name phishguard-analyzer-role \
  --policy-name PhishguardComprehendPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["comprehend:DetectSentiment", "comprehend:DetectEntities"],
      "Resource": "*"
    }]
  }'
```

## Step 4: Create Function URL

PhishGuard calls Lambda via a Function URL (not API Gateway).

### Via Console

1. Open Lambda function
2. Click **Configuration** → **Function URL**
3. Click **Create function URL**
4. Configure:

   - **Auth type**: NONE (extension handles auth)
   - **CORS**: ✓ Enable
     - **Allowed origins**: `*`
     - **Allowed methods**: POST, GET, OPTIONS
     - **Allowed headers**: `Content-Type`

5. Copy the Function URL (e.g., `https://xxxxx.lambda-url.region.on.aws/`)

### Via CLI

```bash
aws lambda create-function-url-config \
  --function-name phishguard-analyzer \
  --auth-type NONE \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["POST","GET","OPTIONS"],"AllowHeaders":["Content-Type"]}'

# Get the URL
aws lambda get-function-url-config --function-name phishguard-analyzer
```

## Step 5: Update Extension Configuration

1. Open `background.js` in your extension
2. Find the `LAMBDA_URL` variable
3. Replace with your Function URL:

```javascript
const LAMBDA_URL = "https://your-function-url.lambda-url.region.on.aws/";
```

4. Save and reload extension in Chrome

## Step 6: Test the Deployment

### Test via curl

```bash
curl -X POST "https://your-function-url.lambda-url.region.on.aws/" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Verify Your Account",
    "bodyText": "Please verify your account and update your password immediately. Click here.",
    "fromAddress": "security@bank.com"
  }'
```

Expected response:

```json
{
  "risk_level": "High",
  "score": 7,
  "breakdown": {...},
  "message": "🚨 HIGH RISK: This email has characteristics of a phishing attempt..."
}
```

### Test via Extension

1. Open Gmail
2. Open any email
3. Click PhishGuard icon → **Scan This Email**
4. Check for the analysis result in the popup

## Step 7: Monitor & Logging

### CloudWatch Logs

1. Lambda → **Monitor** → **View logs in CloudWatch**
2. Check for errors and performance metrics
3. Set up alarms for high error rates:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name phishguard-errors \
  --alarm-actions arn:aws:sns:region:account:topic \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### X-Ray Tracing (Optional)

Enable X-Ray for detailed tracing:

```bash
aws lambda update-function-configuration \
  --function-name phishguard-analyzer \
  --tracing-config Mode=Active
```

## Troubleshooting

### "AccessDeniedException" from Comprehend

- **Issue**: Lambda role lacks Comprehend permissions
- **Fix**: Re-check IAM policy attachment (Step 3)

### "Failed to fetch" from Extension

- **Issue**: Function URL is wrong or Lambda URL has CORS issue
- **Fix**: Verify Function URL, check CORS config, test with curl

### High Lambda Latency

- **Issue**: Cold starts or Comprehend API delays
- **Workaround**:
  - Increase memory (improves CPU)
  - Use provisioned concurrency (costs more)
  - Consider caching responses

### Comprehend API Throttling

- **Issue**: Too many requests to Comprehend
- **Workaround**:
  - Implement caching in Lambda
  - Request quota increase in AWS Service Quotas
  - Add exponential backoff retry logic

## Cost Estimation

**Typical monthly cost** (assuming 100 scans/day):

- Lambda: ~$2 (1M free requests/month)
- Comprehend: ~$10 (2x API calls per scan × 0.0001/unit × 3000 scans)
- **Total**: ~$12/month

[AWS Pricing Calculator](https://calculator.aws/)

## Production Checklist

- [ ] Lambda function deployed and tested
- [ ] IAM permissions attached
- [ ] Function URL created with CORS enabled
- [ ] Extension Lambda URL updated
- [ ] CloudWatch logging configured
- [ ] Error alerts set up
- [ ] Load testing completed
- [ ] Security review done (no hardcoded secrets)
- [ ] Documentation updated

## Next Steps

- Implement email history storage (DynamoDB)
- Add custom keyword configuration
- Set up automated backups
- Implement rate limiting per user
- Add authentication layer

For questions, check the main [README.md](../README.md)
