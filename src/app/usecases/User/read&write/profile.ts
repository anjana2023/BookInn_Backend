import { UserInterface } from "../../../../types/userInterfaces";
import { userDbInterface } from "../../../interfaces/userDbRepositories";

export const getUserProfile = async (
  userID: string,
  userRepository: ReturnType<userDbInterface>
) => {

  const user = await userRepository.getUserById(userID);
  return user;
};

export const updateUser = async (
  userID: string,
  updateData: UserInterface,
  userRepository: ReturnType<userDbInterface>
) => await userRepository.updateProfile(userID, updateData);

export const verifyNumber = async (
  phoneNumber: string,
  userRepository: ReturnType<userDbInterface>
) => {
  const user = await userRepository.getUserByNumber(phoneNumber);

};

export const getWalletUser = async (
  userId:string,
  userRepository: ReturnType<userDbInterface>
)=> {
const amount =  userRepository.getWallet(userId);

return amount;
} 

export const WalletTransactions = async (
  userId: string,
  userRepository: ReturnType<userDbInterface>
) => {
  const transactions = await userRepository.getTransactions(userId);
  return transactions;
};