import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {inngest } from '../inngest/client.js'

export const signup = async(req,res) => {
    const {email , password , skills =[]} = req.body;

    try {
        const hashed = bcrypt.hash(password, 10)
        const user = await User.create({
            email , password: hashed , skills
        })

        // Fire the inngest event

        await inngest.send({
            name : 'users/signup',
            data:{
                email //now this will be get stored in the data and can be accessed by data.event
            }
        })

        const token = jwt.sign({
            _id:user._id , 
            role: user.role,
            
        },process.env.JWT_SECRET)

        res.json({user , token})
    } catch (error) {
        res.status(500)
            .json({message : "Signup failed" , details:error.message})
    }



}


export const login = async(req,res)=> {
    const {email , password} = req.body;


    try {
        const user = await User.findOne({email})

        if(!user){
            res.status(401) .json({error : "User not found"})

        }

        const isMatch = bcrypt.compare(password , user.password)
        if(!isMatch){
            res.status (401).json({
                message : "Invalid credentials"
            })
        }

        const token = jwt.sign({
            _id: user._id,
            role:user.role,
        },process.env.JWT_SECRET)

        res.json({user , token})

        

    } catch (error) {
        res.json({
            message : "Login failed ",
            details : error.message,
        }).status(500)
    }
}

export const logout = async (req , res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if(!token)res.status(401).json({error : "Unauthorized"})
        jwt.verify(token , process.env.JWT_SECRET , (error , decoded) => {
            if(error)res.status(401).json({error : "Unauthorized"})

        })
        res.json({message:"Logout successful"}).status(200)
    } catch (error) {
        res.status(500).json({message : "Logout failed " , details : error.message})
    }
}

export const updateUser = async(req , res) => {
    const {skills =[] , email , role  } = req.body;;
     try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ eeor: "Forbidden" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User not found" });

    await User.updateOne(
      { email },
      { skills: skills.length ? skills : user.skills, role }
    );
    return res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed", details: error.message });
  }
}   



export const getUser = async(req , res ) => {
    try {
        if(req.user.role !== "admin"){
            res.status(401).json({error : "Forbidden"})
        }
        const user = await User.find().select("-password")
        return res.json({user})
    } catch (error) {
        res.status(500).json({ error: "Error occured while fetching user detail ", details: error.message });
    }
}