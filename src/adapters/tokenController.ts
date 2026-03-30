import { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../types/httpStatus";
import { AuthServiceInterface } from "../app/service-interface/authServices";
import { AuthService } from "../frameworks/servies/authService";
import jwt, { JwtPayload } from "jsonwebtoken";
import configKeys from "../config";
import { userDbInterface } from "../app/interfaces/userDbRepositories";
import { userRepositoryMongoDB } from "../frameworks/database/repositories/userRepositoryMongoDB";
import { ownerDbInterfaceType } from "../app/interfaces/ownerDbInterface";
import { ownerDbRepositoryType } from "../frameworks/database/repositories/ownerRepository";
import { getUserById } from "../app/usecases/User/auth/userAuth";
import { getOwnerById } from "../app/usecases/owner/auth/ownerAuth";

const tokenContoller = (
  authServiceInterface: AuthServiceInterface,
  authServiceImpl: AuthService,
  userDbRepository: userDbInterface,
  userDbRepositoryImpl: userRepositoryMongoDB,
  ownerDbRepository: ownerDbInterfaceType,
  ownerDbRepositoryImpl: ownerDbRepositoryType
) => {
  const authService = authServiceInterface(authServiceImpl());
  const dbRepositoryUser = userDbRepository(userDbRepositoryImpl());
  const dbRepositoryOwner = ownerDbRepository(
    ownerDbRepositoryImpl()
  );



  /**
   ** method : POST
   */
  // refresh access token
  const getNewAccessToken = (req: Request, res: Response) => {

    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ success: false, error: "Invalid refresh token" });
    }
    // verify the recieved refresh token and create new access token
    jwt.verify(
      refresh_token,
      configKeys.REFRESH_SECRET,
      (err: any, user: any) => {
        if (err) {
          return res
            .status(HttpStatus.UNAUTHORIZED)
            .json({ message: "Refresh token is expired" });
        } else {
          const { id, name, role } = user;
         const tokens = authService.createTokens(id, name, role);
console.log(tokens,"./");
          res.status(HttpStatus.OK).json({
            success: true,
            message: "Token refreshed successfully",
            access_token: tokens,
          });
        }
      }
    );
  };




  /*
   * METHOD:GET,
   * Return acces token to client
   */

  const returnAccessToClient = async (req: Request, res: Response) => {
    try {

    const { access_token } = req.query as { access_token: string };
    if (!access_token)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ success: false, message: "Access token is required" });

    const token: JwtPayload = jwt.decode(access_token) as JwtPayload;

      if (token?.role  === "user") {
        const user = await getUserById(token.id, dbRepositoryUser);
        return res
          .status(HttpStatus.OK)
          .json({ success: true, access_token, user });
      }
       else if (token?.role === "owner") {
        const owner = await getOwnerById(
          token.id,
          dbRepositoryOwner
        );
        return res
          .status(HttpStatus.OK)
          .json({ success: true, access_token, user: owner });
      }

      return res.status(HttpStatus.OK).json({ success: true, access_token });

    } 
    catch (error) {
    console.error("Error in token controller:", error);
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
    }
  };



  return { returnAccessToClient ,  getNewAccessToken};
};

export default tokenContoller;