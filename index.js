import express from 'express'
import dotenv from "dotenv"
import cors from "cors"
import { serve } from "inngest/express";
import mongoose from "mongoose"
import userRoutes from "./route/user.js"
import { onUserSignup } from './inngest/function/on-signup'
import ticketRoutes from "./routes/ticket.js";
import { onTicketCreated } from './inngest/function/on-ticket-create.js'

dotenv.config()

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth" , userRoutes)
app.use("/api/tickets" , ticketRoutes)


app.use(
    "/api/inngest",
    serve({
        client : inngest,
        function : [onUserSignup , onTicketCreated]
    })
    
)

mongoose 
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected")
        app.listen (PORT , () => console.log("Server is listening on PORT:",PORT))
    })
    .catch((err) => {console.log("❌ MongoDB error :" , err)});