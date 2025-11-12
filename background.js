// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "analyzeEmail") {
    fetch(
      "https://y6o7awwh2finsjlbezs2cqsxva0ywltn.lambda-url.eu-west-1.on.aws/",
      {
        // fetch("https://blu1kydg9h.execute-api.eu-west-1.amazonaws.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.data),
      }
    )
      .then((res) => res.json())
      .then((result) => {
        console.log("Raw Lambda response:", result);
        // Lambda wraps the actual response in a 'body' field as a string
        // Parse it if it's a string, otherwise use it directly
        const data =
          typeof result.body === "string"
            ? JSON.parse(result.body)
            : result.body || result;
        console.log("Parsed analysis:", data);
        sendResponse(data);
      })
      .catch((err) => console.error(err));
    return true; // keep the message channel open
  }
});
