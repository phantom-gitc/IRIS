import { Conversation, IConversation } from './conversation.model';
import { Message, IMessage, MessageRole, IToolCall, IToolResult } from './message.model';
import { NotFoundError } from '../../shared/errors';

export class ConversationService {
  async createConversation(userId: string, title?: string): Promise<IConversation> {
    return Conversation.create({
      userId,
      title: title || 'New Conversation',
      status: 'active',
    });
  }

  async getUserConversations(userId: string, limit = 30): Promise<IConversation[]> {
    return Conversation.find({ userId, status: { $ne: 'deleted' } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }

  async getConversationWithMessages(
    userId: string,
    conversationId: string
  ): Promise<{ conversation: IConversation; messages: IMessage[] }> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId, // Strictly enforce user ownership
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const messages = await Message.find({
      conversationId,
      userId,
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .exec();

    return { conversation, messages };
  }

  async addMessage(
    userId: string,
    conversationId: string,
    role: MessageRole,
    content: string,
    toolCalls?: IToolCall[],
    toolResults?: IToolResult[]
  ): Promise<IMessage> {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const message = await Message.create({
      conversationId,
      userId,
      role,
      content,
      toolCalls,
      toolResults,
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    return message;
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    conversation.status = 'deleted';
    await conversation.save();
  }
}

export const conversationService = new ConversationService();
