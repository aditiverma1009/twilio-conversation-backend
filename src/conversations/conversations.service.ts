import { Injectable } from '@nestjs/common';
import {
  CreateConversationDto,
  AddParticipantsDto,
} from './dto/conversation.dto';
import {
  GetConversationsResponseDto,
  GetConversationResponseDto,
  GetParticipantsResponseDto,
  ApiResponseDto,
} from './dto/response.dto';
import { TwilioService, TwilioConversation } from '../twilio/twilio.service';
import { PrismaService } from '../prisma/prisma.service';

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

interface GetConversationsResponse {
  conversations: TwilioConversation[];
}

@Injectable()
export class ConversationsService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
  ) {}

  async getConversations(userId: string): Promise<GetConversationsResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twilioIdentity: true },
    });

    if (!user?.twilioIdentity) {
      throw new Error('User Twilio identity not found');
    }

    return this.twilioService.listConversations({
      limit: 30,
    });
  }

  async getConversation(sid: string): Promise<TwilioConversation> {
    return this.twilioService.fetchConversation(sid);
  }

  async getParticipants(conversationSid: string) {
    return this.twilioService.listConversationParticipants(conversationSid);
  }

  async createConversation(
    dto: CreateConversationDto,
    currentUserId: string,
  ): Promise<GetConversationResponseDto> {
    try {
      const twilioConversation = await this.twilioService.createConversation(
        dto.friendlyName || 'New Conversation',
      );

      await this.twilioService.addParticipant(
        twilioConversation.sid,
        currentUserId,
        { userId: currentUserId },
      );

      const conversation = await this.twilioService.fetchConversation(
        twilioConversation.sid,
      );
      const participants =
        await this.twilioService.listConversationParticipants(
          twilioConversation.sid,
        );

      return {
        success: true,
        data: {
          conversation: {
            sid: conversation.sid,
            friendlyName: conversation.friendlyName,
            createdAt: conversation.createdAt,
          },
          participants: participants.map((p) => ({
            id: p.sid,
            conversationId: twilioConversation.sid,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            userId: p.attributes?.userId || 'mock-user-id',
            identity: p.identity,
            createdAt: new Date(),
            updatedAt: new Date(),
            attributes: p.attributes || {},
          })),
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: {
          conversation: {
            sid: 'new-conversation',
            friendlyName: dto.friendlyName || 'New Conversation',
            createdAt: new Date().toISOString(),
          },
          participants: [],
        },
        error: getErrorMessage(error),
      };
    }
  }

  async addParticipants(
    conversationSid: string,
    dto: AddParticipantsDto,
  ): Promise<GetParticipantsResponseDto> {
    try {
      const addedParticipants = await Promise.all(
        dto.participants.map(async (identity) => {
          const userIdentity = await this.prisma.user.findUnique({
            where: { id: identity },
          });
          if (userIdentity) {
            return this.twilioService.addParticipant(
              conversationSid,
              userIdentity.twilioIdentity,
              { userId: identity },
            );
          }
        }),
      );

      const participants = await this.twilioService.listConversationParticipants(conversationSid);

      return {
        success: true,
        data: {
          participants: participants.map((p) => ({
            id: p.sid,
            conversationId: conversationSid,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            userId: p.attributes?.userId || '',
            identity: p.identity,
            createdAt: new Date(),
            updatedAt: new Date(),
            attributes: p.attributes || {},
          })),
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: {
          participants: [],
        },
        error: getErrorMessage(error),
      };
    }
  }

  async removeParticipant(
    conversationSid: string,
    participantSid: string,
  ): Promise<ApiResponseDto<void>> {
    try {
      await this.twilioService.removeParticipant(conversationSid, participantSid);
      return {
        success: true,
        data: undefined,
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: undefined,
        error: getErrorMessage(error),
      };
    }
  }
}
