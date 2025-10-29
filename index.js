import express from 'express'
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"
import userRoutes from "./route/user.js"
import { onUserSignup } from './inngest/function/on-signup'

dotenv.config()

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth" , userRoutes)


app.use(
    "/api/inngest",
    serve({
        client : inngest,
        function : [onUserSignup , ]
    })
    
)

mongoose 
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected")
        app.listen (PORT , () => console.log("Server is listening on PORT:",PORT))
    })
    .catch((err) => {console.log("❌ MongoDB error :" , err)});