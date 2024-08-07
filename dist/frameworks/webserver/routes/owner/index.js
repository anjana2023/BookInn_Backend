"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ownerController_1 = __importDefault(require("../../../../adapters/owner/ownerController"));
const ownerDbInterface_1 = require("../../../../app/interfaces/ownerDbInterface");
const hotelController_1 = __importDefault(require("../../../../adapters/owner/hotelController"));
const authServices_1 = require("../../../../app/service-interface/authServices");
const ownerRepository_1 = require("../../../database/repositories/ownerRepository");
const authService_1 = require("../../../servies/authService");
const authMiddleWare_1 = require("../../middleware/authMiddleWare");
const hotelDbInterface_1 = require("../../../../app/interfaces/hotelDbInterface");
const hotelRepositoryMongoDB_1 = require("../../../database/repositories/hotelRepositoryMongoDB");
const bookingController_1 = __importDefault(require("../../../../adapters/bookingController"));
const bookingDbInterface_1 = __importDefault(require("../../../../app/interfaces/bookingDbInterface"));
const userDbRepositories_1 = require("../../../../app/interfaces/userDbRepositories");
const hotelServices_1 = require("../../../../app/service-interface/hotelServices");
const bookingRepositoryMongoDB_1 = __importDefault(require("../../../database/repositories/bookingRepositoryMongoDB"));
const userRepositoryMongoDB_1 = require("../../../database/repositories/userRepositoryMongoDB");
const hotelServices_2 = require("../../../servies/hotelServices");
const ownerRouter = () => {
    const router = express_1.default.Router();
    const controller = (0, ownerController_1.default)(authServices_1.authServiceInterface, authService_1.authService, ownerDbInterface_1.ownerDbInterface, ownerRepository_1.ownerDbRepository, hotelDbInterface_1.hotelDbInterface, hotelRepositoryMongoDB_1.hotelDbRepository, userDbRepositories_1.userDbRepository, userRepositoryMongoDB_1.userRepositoryMongoDB);
    const hotelcontrol = (0, hotelController_1.default)(hotelDbInterface_1.hotelDbInterface, hotelRepositoryMongoDB_1.hotelDbRepository, bookingDbInterface_1.default, bookingRepositoryMongoDB_1.default);
    router.post("/auth/register", controller.registerOwner);
    router.post("/auth/login", controller.ownerLogin);
    router.post("/auth/verifyOtp", controller.verifyOtp);
    router.post("/auth/resendOtp", controller.resendOtp);
    router.post("/auth/forgot-password", controller.forgotPassword);
    router.post("/auth/reset_password/:token", controller.resetPassword);
    router.post("/auth/googleSignIn", controller.GoogleSignIn);
    router.get("/profile", authMiddleWare_1.authenticateOwner, controller.ownerProfile);
    router.patch("/profile/edit", authMiddleWare_1.authenticateOwner, controller.updateProfile);
    // router.post("/auth/verify", controller.verifyPhoneNumber);
    router.post("/addhotel", authMiddleWare_1.authenticateOwner, hotelcontrol.registerHotel);
    router.post("/addRoom/:id", authMiddleWare_1.authenticateOwner, hotelcontrol.registerRoom);
    router.put("/reapply_verification/:id", authMiddleWare_1.authenticateOwner, hotelcontrol.getHotelRejected);
    router.get("/myHotels", authMiddleWare_1.authenticateOwner, hotelcontrol.registeredHotels);
    router.patch("/block_hotel/:id", hotelcontrol.hotelBlock);
    router.get("/bookings", authMiddleWare_1.authenticateOwner, hotelcontrol.getOwnerBookings);
    router.patch("/user/:id", controller.getUser);
    router.get("/user/:id", controller.getUserById);
    router.get("/hotelDetails/:id", controller.hotelDetails);
    router.patch("/editHotel/:id", authMiddleWare_1.authenticateOwner, hotelcontrol.updateHotelInfo);
    const ownerBookingController = (0, bookingController_1.default)(bookingDbInterface_1.default, bookingRepositoryMongoDB_1.default, hotelDbInterface_1.hotelDbInterface, hotelRepositoryMongoDB_1.hotelDbRepository, hotelServices_1.hotelServiceInterface, hotelServices_2.hotelService, userDbRepositories_1.userDbRepository, userRepositoryMongoDB_1.userRepositoryMongoDB);
    router.get("/bookings", authMiddleWare_1.authenticateOwner, ownerBookingController.getOwnerBookings);
    return router;
};
exports.default = ownerRouter;
