import mongoose from 'mongoose'

const TicketSchema = new mongoose.Schema ({
    
} , { timestamps:true})

export default Ticket = mongoose.model('Ticket' , TicketSchema);