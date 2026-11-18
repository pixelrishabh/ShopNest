export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailerService {
  send(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

class ConsoleMailer implements MailerService {
  async send(options: SendEmailOptions) {
    console.warn("\n================ [SHOPNEST MAILER] ================");
    console.warn("⚠️ EMAIL NOT SENT (no provider configured)");
    console.warn(`To: ${options.to}`);
    console.warn(`Subject: ${options.subject}`);
    console.warn("Body Preview:", options.text || options.html.slice(0, 150) + "...");
    console.warn("===================================================\n");
    return {
      success: false,
      error: "EMAIL NOT SENT (no provider configured)",
    };
  }
}

class ResendMailer implements MailerService {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from?: string) {
    this.apiKey = apiKey;
    this.from = from || "ShopNest <orders@shopnest.local>";
  }

  async send(options: SendEmailOptions) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);
      const res = await resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (res.error) {
        console.error("Resend error:", res.error);
        return { success: false, error: res.error.message };
      }

      return { success: true, messageId: res.data?.id };
    } catch (err: any) {
      console.error("Failed to send email via Resend:", err);
      return { success: false, error: err.message };
    }
  }
}

let mailerInstance: MailerService | null = null;

export function getMailer(): MailerService {
  if (mailerInstance) return mailerInstance;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.trim().length > 0) {
    mailerInstance = new ResendMailer(resendApiKey, process.env.EMAIL_FROM);
  } else {
    mailerInstance = new ConsoleMailer();
  }

  return mailerInstance;
}
