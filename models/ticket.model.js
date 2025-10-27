import mongoose from 'mongoose'

const TicketSchema = new mongoose.Schema ({
    title : String,
    description : String , 
    status : {type : String , default : "TODO"},
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    assignedTo : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        default  : null ,
    },
    priority : String , 
    Deadline : Date,
    helpfulNotes:String,
    relatedSkills : [String],
    

} , { timestamps:true})

export default Ticket = mongoose.model('Ticket' , TicketSchema);