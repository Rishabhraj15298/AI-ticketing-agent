import { NonRetriableError } from "inngest";
import { inngest } from "../client.js";
import { sendMail } from "../../../utils/mailer.js";
import User from "../../../models/user.model.js";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    try {
      // ✅ Corrected: should come from event.data, not user.data
      const { email } = event.data;

      // ✅ Corrected async syntax and variable scoping
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });

        if (!userObject) {
          throw new NonRetriableError("User no longer exists in our database");
        }

        return userObject;
      });

      // ✅ Send welcome email step
      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi ${user.name || ""},\n\nThanks for signing up! We're happy to have you onboard.`;

        await sendMail(user.email, subject, message);
      });

      return { success: true };
    } catch (error) {
      console.error("Error running step:", error.message);
      return { success: false, error: error.message };
    }
  }
);