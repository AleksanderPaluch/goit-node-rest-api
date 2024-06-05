import HttpError from "../helpers/HttpError.js";
import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {

    const authorizationHeader = req.headers.authorization
   
    if(typeof authorizationHeader !== "string") {
       
        throw HttpError(401)
    }

    const [bearer, token] = authorizationHeader.split(" ", 2)

   

    if (bearer !== "Bearer") {
       
    throw HttpError(401, "invalid token")
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error) {
            throw HttpError(401, "invalid token ")  
        }

        req.user = {id: decoded.id, email: decoded.email}
        
        next()
    })

  
}