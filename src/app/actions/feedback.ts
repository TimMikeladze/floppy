"use server";

interface FeedbackData {
  email: string;
  message: string;
}

interface FeedbackResult {
  success: boolean;
  error?: string;
}

export async function submitFeedback(
  data: FeedbackData,
): Promise<FeedbackResult> {
  const { email, message } = data;

  // Validate email
  if (!email || !email.trim()) {
    return { success: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  // Validate message
  if (!message || !message.trim()) {
    return { success: false, error: "Message is required" };
  }

  if (message.trim().length < 10) {
    return { success: false, error: "Message must be at least 10 characters" };
  }

  try {
    // TODO: In production, send to an email service, database, or webhook
    // For example:
    // - Send to a Discord/Slack webhook
    // - Store in a database
    // - Send via email service like Resend, SendGrid, etc.

    console.log("Feedback received:", {
      email,
      message: message.substring(0, 100),
    });

    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));

    return { success: true };
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return {
      success: false,
      error: "Failed to submit feedback. Please try again.",
    };
  }
}
