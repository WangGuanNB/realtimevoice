import { respData, respErr } from "@/lib/resp";
import { sendContactFormEmail } from "@/services/email";

export async function POST(req: Request) {
  try {
    let { name, email, subject, message } = await req.json();
    
    if (!name || !email || !subject || !message) {
      return respErr("invalid params");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return respErr("invalid email format");
    }

    await sendContactFormEmail({
      name: name,
      email: email,
      subject: subject,
      message: message,
    });

    return respData({ message: "Email sent successfully" });
  } catch (e) {
    console.log("send contact email failed", e);
    return respErr("send contact email failed");
  }
}

