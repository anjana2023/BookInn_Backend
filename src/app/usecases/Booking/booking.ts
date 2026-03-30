import mongoose from "mongoose";
import Stripe from "stripe";
import createBookingEntity from "../../../entities/booking";
import {
  BookingInterface,
  TransactionDataType,
  dateInterface,
} from "../../../types/bookingInterface";
import { HttpStatus } from "../../../types/httpStatus";
import AppError from "../../../utils/appError";
import { bookingDbInterfaceType } from "../../interfaces/bookingDbInterface";
import { hotelDbInterfaceType } from "../../interfaces/hotelDbInterface";
import { HotelServiceInterface } from "../../service-interface/hotelServices";
import configKeys from "../../../config";
import { userDbInterface } from "../../interfaces/userDbRepositories";
import transactionEntity from "../../../entities/transactionEntity";
import { BookingServiceInterface } from "../../service-interface/bookingService";

export default async function createBooking(
  userId: string,
  bookingDetails: BookingInterface,
  bookingRepository: ReturnType<bookingDbInterfaceType>,
  hotelRepository: ReturnType<hotelDbInterfaceType>,
  hotelSerice: ReturnType<HotelServiceInterface>,
  userRepository: ReturnType<userDbInterface>
) {
  const {
    firstName,
    lastName,
    phoneNumber,
    email,
    hotelId,
    maxAdults,
    maxChildren,
    rooms,
    checkInDate,
    checkOutDate,
    totalDays,
    price,
    platformFee,
    paymentMethod,
  } = bookingDetails;
 

  if (
    !firstName ||
    !lastName ||
    !phoneNumber ||
    !email ||
    !hotelId ||
    !userId ||
    !maxAdults ||
    !rooms ||
    !checkInDate ||
    !checkOutDate ||
    !price ||
    !platformFee||
    !totalDays ||
    !paymentMethod
  ) {
    throw new AppError("Missing fields in Booking", HttpStatus.BAD_REQUEST);
  }

  const bookingEntity = createBookingEntity(
    firstName,
    lastName,
    phoneNumber,
    email,
    new mongoose.Types.ObjectId(hotelId),
    new mongoose.Types.ObjectId(userId),
    maxAdults,
    maxChildren,
    checkInDate,
    checkOutDate,
    totalDays,
    rooms,
    price,
    platformFee,
    paymentMethod
  );

  const data = await bookingRepository.createBooking(bookingEntity);

  if (data.paymentMethod === "Wallet") {
    const wallet = await userRepository.getWallet(data.userId as string)

    if (wallet && data && data.price && wallet?.balance >= data.price) {
      const transactionData: TransactionDataType = {
        newBalance: data.price,
        type: "Debit",
        description: "Booking transaction",
      }
      await updateWallet(data.userId as string, transactionData, userRepository)
      await updateBookingStatus(
        data._id as unknown as string,
        "Paid",
        bookingRepository,
        hotelRepository
      )
    } else {
      throw new AppError("Insufficient wallet balance", HttpStatus.BAD_REQUEST)
    }
  }

  return data
}


export const changeWalletAmounti = async (
  UserId: any,
  fees: any,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const changeupdated = await bookingRepository.changeTheWalletAmount(
    fees,
    UserId
  );
};

export const removeUnavilableDates = async (
  rooms: any,
  checkInDate: Date,
  checkOutDate: Date,
  hotelRepository: ReturnType<hotelDbInterfaceType>,
  hotelService: ReturnType<HotelServiceInterface>
) => {
  const dates = await hotelService.unavailbleDates(
    checkInDate.toString(),
    checkOutDate.toString()
  )

  const addDates = await hotelRepository.removeUnavailableDates(rooms, dates)
}



export const cancelBookingAndUpdateWallet = async (
  userID: string,
  bookingID: string,
  status: string,
  reason: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>,
  userRepository: ReturnType<userDbInterface>,
  bookingService: ReturnType<BookingServiceInterface>  
   
  ): Promise<any> => {

    if (!bookingID) {
      throw new AppError("Please provide a booking ID", HttpStatus.BAD_REQUEST)
    }
  
    const bookingDetails = await bookingRepository.updateBooking(bookingID, {
      bookingStatus: status,
      Reason: reason,
    })
  
    let bookerId: string | undefined
    if (bookingDetails?.userId) {
      if (typeof bookingDetails.userId === "string") {
        bookerId = bookingDetails.userId
      } else if (bookingDetails.userId instanceof mongoose.Types.ObjectId) {
        bookerId = bookingDetails.userId.toString()
      }
    }
  
    if (bookingDetails && bookingDetails.paymentMethod !== "pay_on_checkout") {
    
      if (bookingDetails.status === "cancelled") {
        const dateDifference = await bookingService.dateDifference(
          bookingDetails.updatedAt,
          bookingDetails.checkInDate ?? 0
        )
       
        const paidPrice = bookingDetails.price
        if (paidPrice !== undefined && paidPrice !== null) {
          const platformFee = paidPrice * 0.05
          let refundAmount: number = paidPrice - platformFee
  
          if (dateDifference !== undefined && dateDifference > 2) {
            const isRoomCountLessThanOrEqualTo5 = bookingDetails.rooms.length <= 5
  
            if (isRoomCountLessThanOrEqualTo5) {
              if (dateDifference > 7) {
                refundAmount = refundAmount
              } else if (dateDifference <= 7) {
                refundAmount /= 2
              }
            } else {
              if (dateDifference > 10) {
                refundAmount = refundAmount
              } else if (dateDifference <= 10) {
                refundAmount /= 2
              }
            }
            
  
            const data: TransactionDataType = {
              newBalance: refundAmount,
              type: "Credit",
              description: "Booking cancelled by user refund amount",
            }
            if (bookerId !== undefined && bookerId !== null) {
              await updateWallet(bookerId, data, userRepository)
            }
            const updateBooking = await bookingRepository.updateBooking(
              bookingID,
              {
                bookingStatus: "cancelled with refund",
                paymentStatus: "Refunded",
              }
            )
          } else {
            console.error("Date difference is less than 2 or undefined")
          }
        }
      } else {
        const data: TransactionDataType = {
          newBalance: bookingDetails?.price ?? 0,
          type: "Credit",
          description: "Booking cancelled by owner refund amount",
        }
        if (bookerId !== undefined && bookerId !== null) {
          await updateWallet(bookerId, data, userRepository)
        }
        const updateBooking = await bookingRepository.updateBooking(bookingID, {
          bookingStatus: "cancelled with refund",
          paymentStatus: "Refunded",
        })
      }
    }
  
    return bookingDetails
  }
  

  export const updateWallet = async (
    userId: string,
    transactionData: TransactionDataType,
    userRepository: ReturnType<userDbInterface>
  ) => {
    const { newBalance, type, description } = transactionData
  
    const balance = type === "Debit" ? -newBalance : newBalance
    const updateWallet = await userRepository.updateWallet(userId, balance)
    
  
    if (updateWallet) {
      const transactionDetails = transactionEntity(
        updateWallet?._id,
        newBalance,
        type,
        description
      )
      const transaction = await userRepository.createTransaction(
        transactionDetails
      )
    }
  }



export const addUnavilableDates = async (
  rooms: any,
  checkInDate: Date,
  checkOutDate: Date,
  hotelRepository: ReturnType<hotelDbInterfaceType>,
  hotelService: ReturnType<HotelServiceInterface>
) => {
  const dates = await hotelService.unavailbleDates(
    checkInDate.toString(),
    checkOutDate.toString()
  );

  const addDates = await hotelRepository.addUnavilableDates(rooms, dates);
};

export const checkAvailability = async (
  id: string,
  dates: dateInterface,
  hotelRepository: ReturnType<hotelDbInterfaceType>
) =>
  await hotelRepository.checkAvailability(
    id,
    dates.checkInDate,
    dates.checkOutDate
  );

export const makePayment = async (
  userName: string = "John Doe",
  email: string = "johndoe@gmail.com",
  bookingId: string,
  totalAmount: number
) => {
console.log("ENV KEY:", process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});
   console.log(stripe,"./")
  const customer = await stripe.customers.create({
    name: userName,
    email: email,
    address: {
      line1: "Los Angeles, LA",
      country: "US",
    },
  });
  console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("SUCCESS URL:", `${process.env.CLIENT_URL}/payment_status/${bookingId}?success=true`);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: { name: "Guests", description: "Room booking" },
          unit_amount: Math.round(totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${configKeys.CLIENT_PORT}/payment_status/${bookingId}?success=true`,
    cancel_url: `${configKeys.CLIENT_PORT}/payment_status/${bookingId}?success=false`,
  });

  

  return session.id;
};

export const getTransaction=async(
  userId: string,
  userRepository: ReturnType<userDbInterface>
)=>{ 

  const wallet=await userRepository.getWallet(userId)
  
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  const walletID=wallet._id 
  const transactions=await userRepository.getTransaction(walletID)
  return transactions
}


export const updateBookingStatusPayment = async (
  id: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const status = await bookingRepository.changeBookingstatusPayment(id);
  return status;
};

export const updateBookingStatus = async (
  id: string,
  paymentStatus: "Paid" | "Failed",
  bookingRepository: ReturnType<bookingDbInterfaceType>,
  hotelRepository: ReturnType<hotelDbInterfaceType>
) => {
  const updationData: Record<string, any> = {
    paymentStatus,
  }
  
  const bookingData = await bookingRepository.updateBooking(id, updationData)
}

export const getBookingByBookingId = async (
  userID: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) =>  await bookingRepository.getBooking(userID);
 

export const getBookingByUserId = async (
  userId: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const bookingDetails = await bookingRepository.getAllBookingByUserId(userId);
  return { bookingDetails };
};

export const getBookingByHotelId = async (
  doctorId: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const bookingDetails = await bookingRepository.getAllBookingByHotelId(
    doctorId
  );
  return { bookingDetails };
};

export const getBookingsByHotels = async (
  userID: string[],
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => await bookingRepository.getBookingByHotels(userID)


export const updateBookingDetails = async (
  userID: string,
  status: string,
  reason: string,
  bookingID: string,
  bookingRepository: ReturnType<bookingDbInterfaceType>,
  userRepository: ReturnType<userDbInterface>
) => {
  if (!bookingID)
    throw new AppError("Please provide a booking ID", HttpStatus.BAD_REQUEST)
  let bookingDetails
  if (status === "booked") {
    bookingDetails = await bookingRepository.updateBooking(bookingID, {
      bookingStatus: status,
    })
  } else {
    bookingDetails = await bookingRepository.updateBooking(bookingID, {
      bookingStatus: status,
      Reason: reason,
    })
  }

  return bookingDetails
}





export const getWalletBalance = async (
  userId: any,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const balance = await bookingRepository.getBalanceAmount(userId);
  return balance;
};

export const walletDebit = async (
  userId: any,
  Amount: any,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  const debit = await bookingRepository.debitAmount(userId, Amount);
};

export const changeWallet = async (
  bookingId: string,
  price: any,
  bookingRepository: ReturnType<bookingDbInterfaceType>
) => {
  // Retrieve the booking entity by its ID
  const booking = await bookingRepository.getBookingById(bookingId);

  //@ts-ignore
  const UserId = booking?.userId;

  const changeupdated = await bookingRepository.changeTheWalletAmount(
    price,
    UserId
  );
};
