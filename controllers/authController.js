import { pool } from "../data/database.js";
import bcrypt from 'bcryptjs';
import JWT  from "jsonwebtoken";

function signJWTToken(user){
    return JWT.sign({
        id: user.id,
        email:user.email,
        role:user.position
    }, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}
