const normalizeMessageId = (value) => String(value || "").replace(/^<|>$/g, "");

const sendEmail = async ({ to, name, subject, htmlContent }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME || "Nexus Mail" },
      to: [{ email: to, name }],
      subject,
      htmlContent,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Email provider rejected the message");
  return normalizeMessageId(body.messageId);
};

module.exports = { normalizeMessageId, sendEmail };
