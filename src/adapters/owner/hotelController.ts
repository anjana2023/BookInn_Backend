import { hotelDbRepositoryType } from "../../frameworks/database/repositories/hotelRepositoryMongoDB";
import { Request, Response, NextFunction } from "express";
import { HotelRejected, addHotel, addRoom, blockHotel, getMyHotels, updateHotel } from "../../app/usecases/owner/hotel";
import { hotelDbInterfaceType } from "../../app/interfaces/hotelDbInterface";
import { HttpStatus } from "../../types/httpStatus";
import { addNewRating, filterHotels, getHotelDetails, getUserHotels, hotelDetailsFilter, ratings, ReviewById, updateReviewById } from "../../app/usecases/User/read&write/hotel";
import { checkAvailability, getBookingsByHotels } from "../../app/usecases/Booking/booking";
import mongoose from "mongoose";
import { bookingDbInterfaceType } from "../../app/interfaces/bookingDbInterface";
import { bookingDbRepositoryType } from "../../frameworks/database/repositories/bookingRepositoryMongoDB";

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

const hotelController = (
  hotelDbRepository: hotelDbInterfaceType,
  hotelDbRepositoryImpl: hotelDbRepositoryType,
  bookingDbRepository: bookingDbInterfaceType,
  bookingDbRepositoryImp: bookingDbRepositoryType,

) => {
  const dbRepositoryHotel = hotelDbRepository(hotelDbRepositoryImpl());
  
  const dbRepositoryBooking = bookingDbRepository(bookingDbRepositoryImp())
  const registerHotel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const ownerId = req.owner;
      const hotelData = req.body;
      
      
      const registeredHotel = await addHotel(ownerId, hotelData, dbRepositoryHotel);
      res.json({
        status: "success",
        message: "Hotel added successfully",
        registeredHotel,
      });
    } catch (error) {
      next(error);
    }
  };

  
  const registerRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const hotelId = new mongoose.Types.ObjectId(req.params.id)
    

      const roomData = req.body

      const registeredRoom = await addRoom(
        hotelId,
       roomData,
        dbRepositoryHotel
      )
      res.json({
        status: "success",
        message: "room added suuccessfully",
        registeredRoom,
      })
    } catch (error) {
      next(error)
    }
  }

  const registeredHotels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const ownerId= req.owner;
      const Hotels = await getMyHotels(ownerId, dbRepositoryHotel);
   return res.status(HttpStatus.OK).json({ success: true, Hotels });
    } catch (error) {
      next(error);
    }
  };

  const getHotelsUserSide = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      
        const Hotels = await getUserHotels(dbRepositoryHotel);
        return res.status(HttpStatus.OK).json({ success: true, Hotels });
   
    } catch (error) {
      next(error);
    }
  };

  const destinationSearch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const place = req.query.destination as string
      const adults = req.query.adult as string
      const children = req.query.children as string
      const room = req.query.room as string
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const amenities = req.query.amenities as string
      const minPrice = req.body.minPrice as string
      const maxPrice = req.body.maxPrice as string
    
      const stayTypes = req.query.stayTypes as string
      const page = parseInt(req.query.pages as string) || 1
      const limit = 2
      const skip = (page - 1) * limit

      const data = await filterHotels(
        place,
        adults,
        children,
        room,
        startDate,
        endDate,
        amenities,
        minPrice,
        maxPrice,
        stayTypes,
        dbRepositoryHotel,
        skip,
        limit
      )
      res.status(HttpStatus.OK).json({
        status: "success",
        message: "search result has been fetched",
        data: data,
      })
    } catch (error) {
      next(error)
    }
  }

  const DetailsFilter = async (
  req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
    
      const id = req.query.id as string
      const adults = req.query.adult as string
      const children = req.query.children as string
      const room = req.query.room as string
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const minPrice = req.body.minPrice as string
      const maxPrice = req.body.maxPrice as string

      const data = await hotelDetailsFilter(
        id,
        adults,
        children,
        room,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        dbRepositoryHotel
      )
      res.status(HttpStatus.OK).json({
        status: "success",
        message: "Hotel details fetched",
        data,
      })
    } catch (error) {
      next(error)
    }
  }



  const hotelDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
   
    
      const Hotel = await getHotelDetails(id, dbRepositoryHotel);
   
      return res.status(HttpStatus.OK).json({ success: true, Hotel });
    } catch (error) {
      next(error);
    }
  };

  const updateHotelInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
  
      try {
        const { id } = req.params
        const result = await updateHotel(id, req.body, dbRepositoryHotel)
        if (result) {
          return res
            .status(HttpStatus.OK)
            .json({ success: true, message: "  Successfully updated" })
        } else {
          return res.status(HttpStatus.NOT_FOUND).json({ success: false })
        }
      } catch (error) {
        next(error)
      }
    }

  const hotelBlock = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      
      const updatedHotel = await blockHotel(id, dbRepositoryHotel);
  
      return res.status(HttpStatus.OK).json({ 
        success: true, 
        message: "Hotel block status updated successfully", 
        hotel: updatedHotel 
      });
    } catch (error) {
      next(error);
    }
  };
  
  const getHotelRejected = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {id} = req.params;
      const doctor = await HotelRejected(id,dbRepositoryHotel);
      return res.status(HttpStatus.OK).json({ success: true, doctor });
    } catch (error) {
      next(error);
    }
  }


  const checkAvilabitiy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dates = req.body
      const id = req.params.id
      const isDateExisted=await checkAvailability( id,dates,dbRepositoryHotel)
  
    } catch (error) {
      next(error)
      
    }
  }

  const getOwnerBookings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userID = req.owner
   
      const hotels = await getMyHotels(userID, dbRepositoryHotel)

      
      const HotelIds: string[] = hotels.map((hotel) => hotel._id.toString());

      const bookings=await getBookingsByHotels(HotelIds,dbRepositoryBooking)
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: "Bookings fetched successfully",
        bookings,
      })
    } catch (error) {
      next(error)
    }
  }

  const addRating = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user
    const data = req.body
    const result = await addNewRating(userId, data, dbRepositoryHotel)
    if (result) {
      return res
        .status(HttpStatus.OK)
        .json({ success: true, message: "  Successfully added rating" })
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false })
    }
  }

  const getRatingsbyHotelId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const hotelId = req.params.hotelId
    const result = await ratings(hotelId, dbRepositoryHotel)
    if (result) {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: "  Successfully getted rating",
        result,
      })
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false })
    }
  }

  const getRatingsbyId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const Id = req.params.Id    
    const result = await ReviewById(Id, dbRepositoryHotel)    
    if (result) {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: "  Successfully getted rating",
        result,
      })
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false })
    }
  }


  const updateRatingsbyId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const Id = req.params.Id    
    const updates=req.body    
    const result = await updateReviewById(Id,updates, dbRepositoryHotel)    
    if (result) {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: "  Successfully getted rating",
        result,
      })
    } else {
      return res.status(HttpStatus.NOT_FOUND).json({ success: false })
    }
  }


  return {
    registerHotel,
    registerRoom,
    registeredHotels,
    getHotelsUserSide,
    hotelDetails,
    updateHotelInfo,
    hotelBlock,
    getOwnerBookings,
    checkAvilabitiy,
    getHotelRejected,
    destinationSearch,
    DetailsFilter,
    updateRatingsbyId,
    getRatingsbyId,
    getRatingsbyHotelId,
    addRating
  };
};

export default hotelController;
