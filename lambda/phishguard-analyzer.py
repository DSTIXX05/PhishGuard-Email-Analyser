import json
import boto3

comprehend = boto3.client('comprehend')

def generate_risk_message(risk_level, breakdown, combined_text):
    """
    Generate a descriptive message explaining the phishing risk based on analysis.
    """
    keyword_score = breakdown.get("keywords", 0)
    urgency_score = breakdown.get("urgency", 0)
    sentiment = breakdown.get("sentiment", "NEUTRAL")
    entities = breakdown.get("entities", [])
    
    reasons = []
    
    # Keyword analysis
    if keyword_score >= 4:
        reasons.append(f"Multiple phishing indicators detected ({keyword_score} suspicious phrases)")
    elif keyword_score >= 2:
        reasons.append(f"Several phishing keywords found ({keyword_score} phrases)")
    elif keyword_score == 1:
        reasons.append("One phishing-related phrase detected")
    
    # Urgency analysis
    if urgency_score >= 2:
        reasons.append("Email uses urgent/demanding language (act immediately, etc.)")
    elif urgency_score == 1:
        reasons.append("Urgency language detected")
    
    # Sentiment analysis
    if sentiment == "NEGATIVE":
        reasons.append("Negative sentiment (threats, warnings, account issues)")
    elif sentiment == "MIXED":
        reasons.append("Mixed sentiment with pressuring elements")
    
    # Entity analysis (brand impersonation)
    sensitive_companies = ["PayPal", "Bank", "Amazon", "Microsoft", "Apple", "Google", "Apple ID", "Amazon Account"]
    mentioned_sensitive = [e for e in entities if any(s.lower() in e.lower() for s in sensitive_companies)]
    if mentioned_sensitive:
        reasons.append(f"Impersonates trusted services: {', '.join(mentioned_sensitive[:2])}")
    
    # Build message based on risk level
    if risk_level == "High":
        base_message = "🚨 HIGH RISK: This email has characteristics of a phishing attempt."
        if reasons:
            return f"{base_message}\n\nWarning signs: {' • '.join(reasons)}"
        else:
            return base_message
    
    elif risk_level == "Medium":
        base_message = "⚠️ MEDIUM RISK: This email shows some suspicious characteristics."
        if reasons:
            return f"{base_message}\n\nFlags: {' • '.join(reasons)}"
        else:
            return base_message
    
    else:  # Low risk
        if keyword_score > 0 or urgency_score > 0:
            return f"✅ LOW RISK: Email appears legitimate but contains {keyword_score} generic phrases often found in marketing emails."
        elif sentiment == "NEGATIVE":
            return "✅ LOW RISK: Email is negative in tone but shows no phishing indicators."
        else:
            return "✅ LOW RISK: Email appears to be legitimate correspondence."


def lambda_handler(event, context):
    """
    PhishGuard Email Phishing Detection Lambda
    Uses AWS Comprehend for sentiment/entity analysis + keyword detection
    Expects email object with: subject, bodyText, from, fromAddress, etc.
    """
    
    try:
        # Parse incoming email object from extension
        body = event.get("body", "")
        if isinstance(body, str):
            email_data = json.loads(body)
        else:
            email_data = body

        # Extract email fields (from extension's content.js)
        subject = email_data.get("subject", "")
        body_text = email_data.get("bodyText", "")
        from_addr = email_data.get("fromAddress", "")
        
        # Combine for analysis (subject + body)
        combined_text = f"{subject} {body_text}"
        
        # Skip if text is too short or empty
        if len(combined_text.strip()) < 10:
            return {
                "statusCode": 200,
                "body": json.dumps({
                    "risk_level": "Low",
                    "score": 0,
                    "breakdown": {
                        "keywords": 0,
                        "urgency": 0,
                        "sentiment": "NEUTRAL",
                        "entities": [],
                        "from_address": from_addr
                    },
                    "message": "✅ Email too short to analyze thoroughly."
                })
            }

        # --- Analyze with Comprehend ---
        sentiment_response = comprehend.detect_sentiment(Text=combined_text, LanguageCode="en")
        entities_response = comprehend.detect_entities(Text=combined_text, LanguageCode="en")

        sentiment_type = sentiment_response["Sentiment"]
        sentiment_score = sentiment_response["SentimentScore"]

        # --- Keyword detection (phishing indicators) ---
        suspicious_keywords = [
            "verify your account",
            "update your password",
            "login urgently",
            "confirm your credentials",
            "unusual activity detected",
            "click here",
            "act now",
            "confirm identity",
            "verify payment",
            "reset password",
            "validate account"
        ]
        
        urgency_patterns = ["immediately", "urgent", "act now", "as soon as possible", "within 24 hours", "right away"]

        keyword_score = sum(1 for w in suspicious_keywords if w in combined_text.lower())
        urgency_score = sum(1 for u in urgency_patterns if u in combined_text.lower())

        # --- Entity analysis (sensitive company names) ---
        sensitive_entities = ["paypal", "bank", "amazon", "microsoft", "apple", "google", "apple id", "amazon account"]
        detected_entities = [e["Text"] for e in entities_response["Entities"]]
        entity_score = sum(1 for e in detected_entities if e.lower() in sensitive_entities)

        # --- Sentiment weighting (negative = more suspicious) ---
        sentiment_weight = 0
        if sentiment_type == "NEGATIVE":
            sentiment_weight = 3
        elif sentiment_type == "MIXED":
            sentiment_weight = 1
        elif sentiment_type == "POSITIVE":
            sentiment_weight = -1

        # --- Final risk calculation ---
        total_score = (keyword_score * 2) + urgency_score + sentiment_weight + (entity_score * 2)

        # Determine risk level
        if total_score >= 8:
            risk_level = "High"
        elif total_score >= 5:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Build breakdown
        breakdown = {
            "keywords": keyword_score,
            "urgency": urgency_score,
            "sentiment": sentiment_type,
            "entities": detected_entities[:5],
            "from_address": from_addr
        }

        # Generate contextual message
        message = generate_risk_message(risk_level, breakdown, combined_text)

        # Build response
        result = {
            "risk_level": risk_level,
            "score": total_score,
            "breakdown": breakdown,
            "message": message
        }

        return {
            "statusCode": 200,
            "body": json.dumps(result)
        }

    except Exception as e:
        # Error handling
        print(f"Error in phishing analysis: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "risk_level": "Unknown",
                "score": 0,
                "message": f"❌ Analysis error: {str(e)}"
            })
        }