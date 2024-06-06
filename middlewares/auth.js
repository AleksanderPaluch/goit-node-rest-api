import HttpError from "../helpers/HttpError.js";
import jwt from "jsonwebtoken";
import User from "../models/users.js"

export const auth = (req, res, next) => {

    const authorizationHeader = req.headers.authorization
   
    if(typeof authorizationHeader !== "string") {
       
        throw HttpError(401)
    }

    const [bearer, token] = authorizationHeader.split(" ", 2)

   

    if (bearer !== "Bearer") {
       
    throw HttpError(401, "invalid token")
    }

    jwt.verify(token, process.env.JWT_SECRET, async (error, decoded) => {
        if (error) {
            throw HttpError(401, "invalid token ")  
        }

        try {
            const user = await User.findById(decoded.id)

            if (user === null) {
                throw HttpError(401, "invalid token ") 
            }

            if (user.token !== token) {
                throw HttpError(401, "invalid token ") 
            }

        } catch (error) {
            next(error)
        }

        req.user = {id: decoded.id, email: decoded.email}
        
        next()
    })

  
}