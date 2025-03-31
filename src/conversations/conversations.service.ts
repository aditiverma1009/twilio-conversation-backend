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
import { TwilioService } from '../twilio/twilio.service';
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

@Injectable()
export class ConversationsService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
  ) {}

  async getConversations(
    identity: string,
  ): Promise<GetConversationsResponseDto> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            identity,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        conversations: conversations.map((conversation) => ({
          sid: conversation.id,
          friendlyName: conversation.friendlyName,
          createdAt: conversation.createdAt.toISOString()
        })),
      },
    };
  }

  async getConversation(
    conversationSid: string,
  ): Promise<GetConversationResponseDto> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationSid },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!conversation) {
        return {
          success: false,
          data: {
            conversation: {
              sid: conversationSid,
              friendlyName: null,
              createdAt: new Date().toISOString(),
            },
            participants: [],
          },
          error: 'Conversation not found',
        };
      }

      return {
        success: true,
        data: {
          conversation: {
            sid: conversation.id,
            friendlyName: conversation.friendlyName,
            createdAt: conversation.createdAt.toISOString(),
          },
          participants: conversation.participants.map((p) => ({
            id: p.id,
            updatedAt: p.updatedAt,
            identity: p.identity,
            userId: p.userId,
            conversationId: p.conversationId,
            createdAt: p.createdAt,
          })),
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: {
          conversation: {
            sid: conversationSid,
            friendlyName: null,
            createdAt: new Date().toISOString(),
          },
          participants: [],
        },
        error: getErrorMessage(error),
      };
    }
  }

  async createConversation(
    dto: CreateConversationDto,
    currentUserId: string,
  ): Promise<GetConversationResponseDto> {
    try {
      // First create conversation in Twilio
      const twilioConversation = await this.twilioService.createConversation(
        dto.friendlyName,
      );

      // Then add the current user as a participant
      await this.twilioService.addParticipant(
        twilioConversation.id,
        currentUserId,
        currentUserId,
      );

      // Get the conversation with all participants from database
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: twilioConversation.id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!conversation) {
        return {
          success: false,
          data: {
            conversation: {
              sid: twilioConversation.id,
              friendlyName: twilioConversation.friendlyName,
              createdAt: twilioConversation.createdAt.toISOString(),
            },
            participants: [],
          },
          error: 'Failed to fetch created conversation',
        };
      }

      return {
        success: true,
        data: {
          conversation: {
            sid: conversation.id,
            friendlyName: conversation.friendlyName,
            createdAt: conversation.createdAt.toISOString(),
          },
          participants: conversation.participants.map((p) => ({
            id: p.id,
            updatedAt: p.updatedAt,
            identity: p.identity,
            userId: p.userId,
            conversationId: p.conversationId,
            createdAt: p.createdAt,
          })),
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: {
          conversation: {
            sid: 'new-conversation',
            friendlyName: dto.friendlyName || null,
            createdAt: new Date().toISOString(),
          },
          participants: [],
        },
        error: getErrorMessage(error),
      };
    }
  }

  async getParticipants(
    conversationSid: string,
  ): Promise<GetParticipantsResponseDto> {
    try {
      const participants = await this.prisma.participant.findMany({
        where: { conversationId: conversationSid },
        include: {
          user: true,
        },
      });

      return {
        success: true,
        data: {
          participants: participants.map((p) => ({
            id: p.id,
            updatedAt: p.updatedAt,
            identity: p.identity,
            userId: p.userId,
            conversationId: p.conversationId,
            createdAt: p.createdAt,
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

  async getConversationToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const twilioToken = this.twilioService.generateToken(user.twilioIdentity);

      return twilioToken;
    }
  }
  async addParticipants(
    conversationSid: string,
    dto: AddParticipantsDto,
  ): Promise<GetParticipantsResponseDto> {
    try {
      const addedParticipants = await Promise.all(
        dto.participants.map(async (identity) => {
          // First add to Twilio
          const userIdentity = await this.prisma.user.findUnique({
            where: { id: identity },
          });
          if (userIdentity) {
            const twilioParticipant = await this.twilioService.addParticipant(
              conversationSid,
              userIdentity.twilioIdentity,
              identity, // Using identity as userId for now, should be replaced with actual user ID
            );

            return twilioParticipant;
          }
        }),
      );

      return {
        success: true,
        data: {
          participants: addedParticipants
            .filter((p) => p !== null && p !== undefined)
            .map((p) => ({
              id: p.id,
              updatedAt: p.updatedAt,
              identity: p.identity,
              userId: p.userId,
              conversationId: p.conversationId,
              createdAt: p.createdAt,
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
      // First remove from Twilio
      await this.twilioService.removeParticipant(
        conversationSid,
        participantSid,
      );

      // Database removal will be handled by cascade delete
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
