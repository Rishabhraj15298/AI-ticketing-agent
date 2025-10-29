import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema ({

    email : {
        type : String ,
        required : true , 
        unique : true, 

    },
    password : {
        type : String ,
        required : true, 

    },
    role : {
        type : String ,
        default : "user",
        enum : ["user" , "admin" , "moderator"]
    },
    skills : 
        [String]
    
} , { timestamps : true} )

export default mongoose.model('User' , UserSchema);