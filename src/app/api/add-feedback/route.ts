import { respData, respErr } from "@/lib/resp";

import { getUserEmail, getUserInfo, getUserUuid } from "@/services/user";
import { insertFeedback } from "@/models/feedback";
import { sendContactFormEmail } from "@/services/email";

export async function POST(req: Request) {
  try {
    let { content, rating, name, email } = await req.json();
    if (!content) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    const user_email = await getUserEmail();
    const user_info = await getUserInfo();

    // 反馈邮箱与名称：优先使用登录用户信息，其次使用传入的邮箱/名称
    const feedbackEmail = user_email || email || "";
    const feedbackName =
      user_info?.nickname ||
      name ||
      user_email?.split("@")[0] ||
      email?.split("@")[0] ||
      "User";

    const feedback = {
      user_uuid: user_uuid,
      content: content,
      rating: rating,
      created_at: new Date(),
      status: "created",
    };

    const dbFeedback = await insertFeedback(feedback);

    // 如果有邮箱，则发送通知邮件（不影响主流程）
    if (feedbackEmail) {
      try {
        const ratingEmoji = rating === 1 ? "😞" : rating === 5 ? "😊" : "😐";
        const ratingText =
          rating === 1 ? "Negative" : rating === 5 ? "Positive" : "Neutral";

        const projectName =
          process.env.NEXT_PUBLIC_PROJECT_NAME || "ShipFire";
        const messageWithProject = `${content}\n\n@By${projectName}`;

        await sendContactFormEmail({
          name: feedbackName,
          email: feedbackEmail,
          subject: `Feedback from User - ${ratingText} (${ratingEmoji})`,
          message: `Rating: ${rating}/10 ${ratingEmoji}\n\nFeedback:\n${messageWithProject}`,
        });
      } catch (e) {
        console.log("send feedback email failed: ", e);
      }
    }

    return respData(dbFeedback);
  } catch (e) {
    console.log("add feedback failed", e);
    return respErr("add feedback failed");
  }
}
