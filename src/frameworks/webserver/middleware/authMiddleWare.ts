import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../../types/httpStatus";
import configKeys from "../../../config";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      owner?: any;
    }
  }
}

export default function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const access_token = req.headers.authorization;
  if (!access_token) {
    return res.status(HttpStatus.FORBIDDEN).json("Your are not authenticated");
  }
  const tokenParts = access_token.split(" ");
  const token = tokenParts.length === 2 ? tokenParts[1] : null;

  if (!token) {
    return res.status(HttpStatus.FORBIDDEN).json("Invalid access token format");
  }

  jwt.verify(token, configKeys.ACCESS_SECRET, (err: any, user: any) => {
    if (err) {
      res
        .status(HttpStatus.FORBIDDEN)
        .json({ success: false, message: "Token is not valid" });
    } else {
      req.user = user.id;

      next();
    }
  });
}

// export async function authenticateOwner(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) {
//   try {
//     const access_token = req.headers.authorization;
//     if (!access_token) {
//       return res.status(HttpStatus.FORBIDDEN).json("You are not authenticated");
//     }

//     const tokenParts = access_token.split(" ");
//     const token = tokenParts.length === 2 ? tokenParts[1] : null;

//     if (!token) {
//       return res
//         .status(HttpStatus.FORBIDDEN)
//         .json("Invalid access token format");
//     }

//     const owner = jwt.verify(token, configKeys.ACCESS_SECRET) as JwtPayload;

//     if (owner.role === "owner") {
//       req.owner = owner.id;
//       return next();
//     }

//     return res.status(HttpStatus.FORBIDDEN).json({
//       success: false,
//       message: "You are not allowed to access this resource",
//       owner,
//     });
//   } catch (error) {
//     return res
//       .status(HttpStatus.FORBIDDEN)
//       .json({ success: false, message: "Token is not valid" });
//   }
// }


export async function authenticateOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const access_token = req.headers.authorization;
    console.log("////access",access_token)
    if (!access_token) {
      return res.status(HttpStatus.FORBIDDEN).json("You are not authenticated");
    }

    const tokenParts = access_token.split(" ");
    const token = tokenParts.length === 2 ? tokenParts[1] : null;

    if (!token) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json("Invalid access token format");
    }


    const owner = jwt.verify(token, configKeys.ACCESS_SECRET) as JwtPayload;
console.log("DECODED TOKEN:", owner);

    if (owner.role === "owner") {
      console.log("req owner",req.owner,owner.id)
      req.owner = owner.id;
      return next();
    }

    return res.status(HttpStatus.FORBIDDEN).json({
      success: false,
      message: "You are not allowed to access this resource",
      owner,
    });
  } catch (error) {
    return res
      .status(HttpStatus.FORBIDDEN)
      .json({ success: false, message: "Token is not valid" });
  }
}



// Admin authorization to get the access to routes in admin
export function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const access_token = req.headers.authorization;
  if (!access_token) {
    return res.status(HttpStatus.FORBIDDEN).json("You are not authenticated");
  }

  // Extract the token from the header (assuming it's in the format "Bearer <token>")
  const tokenParts = access_token.split(" ");
  const token = tokenParts.length === 2 ? tokenParts[1] : null;

  if (!token) {
    return res.status(HttpStatus.FORBIDDEN).json("Invalid access token format");
  }

  jwt.verify(token, configKeys.ACCESS_SECRET, (err: any, decodedToken: any) => {
    if (err) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ success: false, message: "Token is not valid" });
    }

    if (decodedToken.role === "admin") {
      return next();
    }

    return res.status(HttpStatus.FORBIDDEN).json({
      success: false,
      message: "You are not allowed to access this resource",
      user: decodedToken,
    });
  });
}
