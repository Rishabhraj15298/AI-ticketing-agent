import { inngest } from "../inngest/client";
import Ticket from "../models/ticket.model.js";


// Create a Ticket
export const createTicket = async(req , res) => {
    
    try {
        const {title , description} = req.body;
        if(!title || !description){
            return res
                .status(401)
                .json({message : "Title and description are required"})

        }

        const newTicket = Ticket.create({
            title,
            description,
            createadBy : req.user._id.toString(),
        })

        await inngest.send({
            name : "ticket/created",
            data : {
                ticketId : (await newTicket)._id.toString(),
                title,
                description,
                createadBy : req.user._id.toString(),
            },
        })

        return res.status(201).json({
            message:"Ticket has been created successfully and processing started",
            ticket : newTicket,
        })
    } catch (error) {
        console.error("Error occured while creating Ticket" , error.message);
        return res.status(500).json({message : "Internal server error "});
    }
}


// Get all the tickets 

export const getTickets = async(req , res) => {
    try{
        const user = req.user;
        let tickets = [];

        if(user.role !== "user"){
            const tickets = Ticket.find({})
                .populate("assignedTo ",["email" , "_id"] )
                .sort({createdAt : -1});
        }
        else{
            tickets = await Ticket.find({createdBy : user._id})
                .select("title description status createdAt")
                .sort({createadAt : -1});

        }
        return res.status(200).json(tickets);


    }catch(error){
        console.error("Error fetching tickets " , error.message);
        return res.status(500).json({message : "Internal Server Error"})
    }
}


// Get ticket that has been raised by a particular user 

export const getTicket = async(req , res) => {
    try {
        const user = req.user
        let ticket ;

        if(user.role !=="user"){
            ticket = Ticket.findById(req.params.id).populate("assignedTo" , [
                "email",
                "._id",
            ])
        }
        else{
            ticket = Ticket.findOne({
                createdBy : user._id,
                _id : req.params.id,

            }).select("title description status createdAt")
        }

        if(!ticket){
            return res.status(404).json({message : "TIcket not found"})
        }
        return res.status(200).json({ticket});
    } catch (error) {
        console.error ("Error fetching ticket ", error.message)
        return res.status(500).json({message : "Internal Server Error "})
    }
}



