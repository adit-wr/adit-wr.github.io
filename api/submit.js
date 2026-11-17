// Vercel Serverless Function — POST /api/submit
// Web3Forms access key stays server-side here (env var), so it is
// never shipped to the browser and never committed to the repo.
//
// Required env var (Vercel → Project Settings → Environment Variables):
//   WEB3FORMS_ACCESS_KEY = <your key>

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 1500;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const payload = req.body || {};
    const subject = String(payload.subject || "").slice(0, MAX_SUBJECT).trim();
    const message = String(payload.message || "").slice(0, MAX_MESSAGE).trim();

    // Defence in depth — the client validates too, but never trust it
    if (subject.length < 3 || message.length < 10) {
      return res.status(400).json({ success: false, message: "Subject or message too short" });
    }

    // Honeypot must be empty (bots fill it, humans don't)
    if (payload.botcheck && String(payload.botcheck).trim() !== "") {
      // Pretend success so bots learn nothing
      return res.status(200).json({ success: true });
    }

    const access_key = process.env.WEB3FORMS_ACCESS_KEY;
    if (!access_key) {
      console.error("[/api/submit] WEB3FORMS_ACCESS_KEY is not set");
      return res.status(500).json({ success: false, message: "Server is not configured to send mail yet" });
    }

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key,
        subject: `Portfolio — ${subject}`,
        message,
        from_name: "Portfolio Contact Form"
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return res.status(502).json({
        success: false,
        message: (data && data.message) || "Email service rejected the message"
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[/api/submit] Unexpected error:", err);
    return res.status(500).json({ success: false, message: "Unexpected server error" });
  }
};
