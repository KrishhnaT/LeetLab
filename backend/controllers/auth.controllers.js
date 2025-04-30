import bcrypt from "bcryptjs";
import { db } from "../libs/db.js"
import { UserRole } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";


export const signUp = async (req,res) => {
     const {email, name, password} = req.body;
  try {
        if(!email || !name || !password){
             return res.status(400).json({
                  success: false,
                  message: "All Fields Are Required"
             })
        }
        const userAlreadyExists = await prisma.user.findFirst({
          where: {
            email: email,
          }
        });
   
             if(userAlreadyExists){
                  return res.status(400).json({
                       success: false,
                       message: "User Already Exists"
                  })
             }
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = await db.user.create({
             data:{
                  email,
                  password: hashedPassword,
                  name,
                  role:UserRole.USER
             }  
        })
   
        const token = jwt.sign({id:newUser.id}, process.env.JWT_SECRET,{
             expiresIn:"7d"
        })
        res.cookie("jwt",token,{
             httpOnly:true,
             sameSite: "strict",
             secure: process.env.NODE_ENV !== "development",
             maxAge: 7*24*60*60*1000
        })
        res.status(201).json({
          success:true,
          message: "User created successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            image: newUser.image,
          },
        });
        

  } catch (error) {
     console.log("Error while creating user :- ", error)
  }
}

export const login = async (req,res) => {
     const {email , password} = req.body;
     try {
          const user = await db.user.findFirst({
               where:{
                    email
               }
          })
          if(user){
               console.log("Email :- ",email);
               console.log("Password is :- ",password);
          }
          if(!user){
               return res.status(404).json({
                    success:false,
                    message:"User Not Found"
               })
          }

          if (!user.password) {
               return res.status(400).json({
                 success: false,
                 message: "User account is missing password"
               });
             }

          const isMatch = await bcrypt.compare(password , user.password);

          if(!isMatch){
               return res.status(500).json({
                    success: false,
                    message:"Incorrect Password "
               })
          }
          const token = jwt.sign({id:user.id}, process.env.JWT_SECRET,{
               expiresIn:"7d"
          })
          res.cookie("jwt",token,{
               httpOnly:true,
               sameSite: "strict",
               secure: process.env.NODE_ENV !== "development",
               maxAge: 7*24*60*60*1000
          })
       
          res.status(201).json({
                    success:true,
                    message:"User logged in Successfully",
                    user: {
                      id: user.id,
                      email: user.email,
                      name: user.name,
                      role: user.role,
                      image: user.image,
                    },
                  });
                       

     } catch (error) {
     console.log("Error while creating user :- ", error)
     }
}

export const logout = async (req,res) => {
          try {
               res.clearCookie("jwt",{
                    httpOnly: true,
                    sameSite:"strict",
                    secure: process.env.NODE_ENV !== "development"
               });

               return res.status(204).json({
                    success:true,
                    message:"User logged out successfully",
               })
          } catch (error) {
               console.log("Error while logging out :- ",error);
          }
}

export const check = async (req,res) => {
     try {
          res.status(200).json({
               success:true,
               message:"User authenticated successfully",
               user:req.user
          });
     } catch (error) {
          res.status(500).json({
               success:false,
               message:"Error in check route controller"
          })
          console.log("Error in check route controller :- ",error)
     }
}
