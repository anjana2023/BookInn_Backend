import { ChatDbRepositoryInterace } from "../../interfaces/chatDbInterface";


export const updateUnreadMessages = async (
  conversationID: string,
  recieverID: string,
  chatRepository: ReturnType<ChatDbRepositoryInterace>
) => {
  console.log("calling updateUnreadMessages in server");

  return await chatRepository.updateMessages(
    { conversationId: conversationID, senderId: recieverID },
    { isRead: true }
  );
};
