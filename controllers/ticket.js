import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.model.js";

// 🎫 Create a Ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;

    // ✅ Input validation – agar title ya description missing hai toh error bhejna
    if (!title || !description) {
      return res.status(401).json({ message: "Title and description are required" });
    }

    // 🆕 Naya ticket create kar rahe hain (DB me store karne ke liye)
    const newTicket = Ticket.create({
      title,
      description,
      createadBy: req.user._id.toString(), // 🧑‍💻 User jisne ticket banaya uska ID store kar rahe hain
    });

    // 🚀 Inngest event trigger kar rahe hain (background processing ke liye)
    await inngest.send({
      name: "ticket/created", // Event ka naam
      data: {
        ticketId: (await newTicket)._id.toString(), // Ticket ka ID bhej rahe hain event ke saath
        title,
        description,
        createadBy: req.user._id.toString(),
      },
    });

    // ✅ Success response bhejna
    return res.status(201).json({
      message: "Ticket has been created successfully and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("❌ Error occured while creating Ticket", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// 📋 Get all Tickets
export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    // 🔐 Agar user admin ya staff hai toh sab tickets dekh sakta hai
    if (user.role !== "user") {
      const tickets = Ticket.find({})
        .populate("assignedTo", ["email", "_id"]) // 👀 assignedTo user ke details populate kar rahe hain
        .sort({ createdAt: -1 }); // 🔄 Latest tickets pehle dikhane ke liye
    } else {
      // 👤 Agar normal user hai toh sirf apne tickets hi dekh sakta hai
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    // ✅ Tickets bhejna response me
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("❌ Error fetching tickets", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔍 Get a Single Ticket (specific user ke ticket ya admin view)
export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    let ticket;

    // 👑 Agar admin/staff hai toh koi bhi ticket dekh sakta hai
    if (user.role !== "user") {
      ticket = Ticket.findById(req.params.id).populate("assignedTo", [
        "email",
        "_id",
      ]);
    } else {
      // 👤 Agar normal user hai toh sirf apne banaye hue tickets hi access kar sakta hai
      ticket = Ticket.findOne({
        createdBy: user._id,
        _id: req.params.id,
      }).select("title description status createdAt");
    }

    // ⚠️ Agar ticket nahi mila toh error bhejna
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // ✅ Ticket details bhejna
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("❌ Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
