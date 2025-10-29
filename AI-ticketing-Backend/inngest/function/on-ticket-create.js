// 📦 Importing all required modules
import { inngest } from "../client.js";
import Ticket from "../../../models/ticket.model.js";
import User from "../../../models/user.model.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../../utils/mailer.js";
import analyzeTicket from "../../../utils/ai.js";

// 🧩 Inngest function that runs jab bhi 'ticket/created' event trigger hota hai
export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 }, // agar fail ho gaya toh max 2 baar retry karega
  { event: "ticket/created" },

  async ({ event, step }) => {
    try {
      // 🎟️ Step 1: Event se ticketId nikalna
      const { ticketId } = event.data;

      // 🧾 Step 2: Ticket ko database se fetch karna
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);

        if (!ticketObject) {
          // NonRetriableError ka matlab yeh hai ki agar ticket missing hai,
          // toh Inngest dubara try nahi karega (kyunki issue permanent hai)
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      // 📌 Step 3: Ticket ka initial status 'TODO' set kar dena
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
      });

      // 🤖 Step 4: AI se ticket ka analysis karwana
      const aiResponse = await analyzeTicket(ticket);

      // 🧠 Step 5: AI se milne wale data ko database me update karna
      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];

        if (aiResponse) {
          // Agar AI ne kuch priority diya hai toh use rakh lo,
          // warna 'medium' default rakh do.
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,

            helpfulNotes: aiResponse.helpfulNotes, // AI ke helpful points
            status: "IN_PROGRESS", // ab ticket kaam me lag gaya hai
            relatedSkills: aiResponse.relatedSkills, // yeh skills se decide hoga moderator
          });

          skills = aiResponse.relatedSkills;
        }

        return skills;
      });

      // 🧍‍♂️ Step 6: Moderator find karna based on relatedSkills
      const moderator = await step.run("assign-moderator", async () => {
        // ⚙️ Yeh MongoDB query thodi interesting hai:
        // Hum `skills` array ke andar AI ke diye hue `relatedSkills` se match kar rahe hain.
        // `$elemMatch` + `$regex` ka use ho raha hai taaki case-insensitive search ho.
        let user = await User.findOne({
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"), // e.g. "React|Node|Frontend"
              $options: "i", // case-insensitive
            },
          },
        });

        // Agar koi matching moderator nahi milta, toh admin ko assign kar do
        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        // Ticket me assignedTo field update kar dena
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      // 📧 Step 7: Moderator ko email bhejna ki unhe ticket assign hua hai
      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticket._id);

          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket has been assigned to you: ${finalTicket.title}`
          );
        }
      });

      // ✅ Sab kuch sahi se chala toh success response return karo
      return { success: true };
    } catch (error) {
      console.log("❌ Error occurred while running the steps:", error.message);
      return { success: false };
    }
  }
);
