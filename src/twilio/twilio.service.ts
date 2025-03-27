import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio, jwt } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';
import { Conversation, Participant } from '@prisma/client';

@Injectable()
export class TwilioService {
  private twilio: Twilio;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.twilio = new Twilio(
      this.configService.get<string>('TWILIO_API_KEY'),
      this.configService.get<string>('TWILIO_API_SECRET'),
      { accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID') },
    );
  }

  generateToken(identity: string): string {
    const AccessToken = jwt.AccessToken;
    const ChatGrant = AccessToken.ChatGrant;

    const token = new AccessToken(
      this.configService.get<string>('TWILIO_ACCOUNT_SID') || '',
      this.configService.get<string>('TWILIO_API_KEY') || '',
      this.configService.get<string>('TWILIO_API_SECRET') || '',
      { identity },
    );

    const chatGrant = new ChatGrant({
      serviceSid: this.configService.get<string>('TWILIO_SERVICE_SID'),
    });

    token.addGrant(chatGrant);
    return token.toJwt();
  }

  async createConversation(friendlyName?: string): Promise<Conversation> {
    // First create conversation in Twilio
    const twilioConversation = await this.twilio.conversations.v1.conversations.create({
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

  async addParticipant(conversationSid: string, identity: string, userId: string): Promise<Participant> {
    // First add participant in Twilio
    const twilioParticipant = await this.twilio.conversations.v1
      .conversations(conversationSid)
      .participants.create({ identity });

    // Then create in database
    const participant = await this.prisma.participant.create({
      data: {
        id: twilioParticipant.sid,
        identity,
        conversationId: conversationSid,
        userId,
      },
    });

    return participant;
  }

  async removeParticipant(conversationSid: string, participantSid: string): Promise<void> {
    // First remove from Twilio
    await this.twilio.conversations.v1
      .conversations(conversationSid)
      .participants(participantSid)
      .remove();

    // Then remove from database (will be handled by cascade delete)
  }

  async getConversation(conversationSid: string): Promise<Conversation & { participants: Participant[] }> {
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
    // Get from database
    return this.prisma.participant.findMany({
      where: { conversationId: conversationSid },
    });
  }
} 