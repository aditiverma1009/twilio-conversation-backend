import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { Conversation, Participant } from '@prisma/client';
import {
  ConversationInstance,
  ConversationListInstanceOptions,
} from 'twilio/lib/rest/conversations/v1/conversation';

export interface TwilioConversation {
  sid: string;
  friendlyName: string;
  dateUpdated: string;
  dateCreated: string;
  createdAt: string;
}

export interface TwilioParticipant {
  sid: string;
  identity: string;
  attributes: Record<string, any>;
}

@Injectable()
export class TwilioService {
  public twilio: twilio.Twilio;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.twilio = twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  generateToken(identity: string): string {
    const AccessToken = twilio.jwt.AccessToken;
    const ChatGrant = AccessToken.ChatGrant;

    const token = new AccessToken(
      this.configService.get('TWILIO_ACCOUNT_SID') || '',
      this.configService.get('TWILIO_API_KEY') || '',
      this.configService.get('TWILIO_API_SECRET') || '',
      { identity },
    );

    const chatGrant = new ChatGrant({
      serviceSid: this.configService.get('TWILIO_CONVERSATIONS_SERVICE_SID'),
    });

    token.addGrant(chatGrant);

    return token.toJwt();
  }

  async createConversation(friendlyName?: string): Promise<Conversation> {
    // First create conversation in Twilio
    const twilioConversation =
      await this.twilio.conversations.v1.conversations.create({
        friendlyName,
      });

    // Then create in database
    const conversation = await this.prisma.conversation.create({
      data: {
        id: twilioConversation.sid,
        friendlyName: twilioConversation.friendlyName || friendlyName,
      },
    });

    return conversation;
  }

  async addParticipant(
    conversationSid: string,
    identity: string,
    attributes?: Record<string, any>,
  ): Promise<TwilioParticipant> {
    const participant = await this.twilio.conversations.v1
      .conversations(conversationSid)
      .participants.create({
        identity,
        attributes: JSON.stringify(attributes || {}),
      });
    return {
      sid: participant.sid,
      identity: participant.identity,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      attributes: JSON.parse(participant.attributes || '{}'),
    };
  }

  async removeParticipant(
    conversationSid: string,
    participantSid: string,
  ): Promise<void> {
    // First remove from Twilio
    await this.twilio.conversations.v1
      .conversations(conversationSid)
      .participants(participantSid)
      .remove();
  }

  async getConversation(
    conversationSid: string,
  ): Promise<Conversation & { participants: Participant[] }> {
    // Get from database with participants
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationSid },
      include: { participants: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  async getParticipants(conversationSid: string): Promise<Participant[]> {
    return this.prisma.participant.findMany({
      where: { conversationId: conversationSid },
    });
  }

  async listConversations(
    params: ConversationListInstanceOptions,
  ): Promise<{ conversations: TwilioConversation[] }> {
    const response =
      await this.twilio.conversations.v1.conversations.list(params);
    return {
      conversations: response.map((conv) => ({
        sid: conv.sid,
        friendlyName: conv.friendlyName,
        dateUpdated: conv.dateUpdated.toISOString(),
        dateCreated: conv.dateCreated.toISOString(),
        createdAt: conv.dateCreated.toISOString(),
      })),
    };
  }

  async fetchConversation(sid: string): Promise<TwilioConversation> {
    const conversation = await this.twilio.conversations.v1
      .conversations(sid)
      .fetch();
    return {
      sid: conversation.sid,
      friendlyName: conversation.friendlyName,
      dateUpdated: conversation.dateUpdated.toISOString(),
      dateCreated: conversation.dateCreated.toISOString(),
      createdAt: conversation.dateCreated.toISOString(),
    };
  }

  async listConversationParticipants(
    conversationSid: string,
  ): Promise<TwilioParticipant[]> {
    const participants = await this.twilio.conversations.v1
      .conversations(conversationSid)
      .participants.list();

    return participants.map((p) => ({
      sid: p.sid,
      identity: p.identity,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      attributes: JSON.parse(p.attributes || '{}'),
    }));
  }
}
