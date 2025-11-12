document.getElementById("scanBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("result");
  statusEl.innerHTML = "<p><strong>Status:</strong> Extracting email...</p>";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send a message to the content script already running on Gmail
  chrome.tabs.sendMessage(tab.id, { action: "extractEmail" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error:", chrome.runtime.lastError.message);
      statusEl.innerHTML =
        "<p><strong>Error:</strong> Couldn't access Gmail page.</p>";
      return;
    }
    if (response && response.email) {
      console.log("Extracted email:", response.email);
      statusEl.innerHTML =
        "<p><strong>Status:</strong> Sending to Lambda for analysis...</p>";

      // Now send the extracted email to background.js for Lambda analysis
      chrome.runtime.sendMessage(
        { type: "analyzeEmail", data: response.email },
        (result) => {
          if (chrome.runtime.lastError) {
            console.error("Lambda error:", chrome.runtime.lastError.message);
            statusEl.innerHTML =
              "<p><strong>Error:</strong> Lambda analysis failed.</p>";
            return;
          }
          console.log("Lambda result:", result);
          // Display the phishing risk analysis from Lambda
          const riskColor =
            result.risk_level === "High"
              ? "red"
              : result.risk_level === "Medium"
              ? "orange"
              : "green";
          statusEl.innerHTML = `
            <p><strong>Status:</strong> Analysis Complete</p>
            <p><strong>Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold;">${result.risk_level}</span></p>
            <p><strong>Phishing Score:</strong> ${result.score}</p>
            <p><strong>Message:</strong> ${result.message}</p>
          `;
        }
      );
    } else {
      statusEl.innerHTML =
        "<p><strong>Error:</strong> No email content found.</p>";
    }
  });
});
