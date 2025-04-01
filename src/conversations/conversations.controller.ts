import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { Request } from 'express';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { TwilioConversation, TwilioParticipant } from 'src/twilio/twilio.service';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations of logged in user',
    type: GetConversationsResponseDto,
  })
  async getConversations(
    @GetUser('id') userId: string,
  ): Promise<ApiResponseDto<{ conversations: TwilioConversation[] }>> {
    const response = await this.conversationsService.getConversations(userId);
    return {
      success: true,
      data: response,
    };
  }

  @Get(':sid')
  @ApiOperation({ summary: 'Get a conversation by SID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation details with participants',
    type: GetConversationResponseDto,
  })
  async getConversation(
    @Param('sid') sid: string,
  ): Promise<ApiResponseDto<{ conversation: TwilioConversation }>> {
    const conversation = await this.conversationsService.getConversation(sid);
    return {
      success: true,
      data: { conversation },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'The conversation has been created',
    type: GetConversationResponseDto,
  })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req: Request,
  ): Promise<GetConversationResponseDto> {
    const currentUserId = req.user?.id as string;
    const response = await this.conversationsService.createConversation(
      createConversationDto,
      currentUserId,
    );
    return response;
  }

  @Get(':sid/participants')
  @ApiOperation({ summary: 'Get participants of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
    type: GetParticipantsResponseDto,
  })
  async getParticipants(
    @Param('sid') sid: string,
  ): Promise<ApiResponseDto<{ participants: TwilioParticipant[] }>> {
    const participants = await this.conversationsService.getParticipants(sid);
    return {
      success: true,
      data: { participants },
    };
  }

  @Post(':conversationSid/participants')
  @ApiOperation({ summary: 'Add participants to a conversation' })
  @ApiResponse({
    status: 200,
    description: 'The participants have been added',
    type: GetParticipantsResponseDto,
  })
  async addParticipants(
    @Param('conversationSid') conversationSid: string,
    @Body() addParticipantsDto: AddParticipantsDto,
  ): Promise<GetParticipantsResponseDto> {
    const response = await this.conversationsService.addParticipants(
      conversationSid,
      addParticipantsDto,
    );
    return response;
  }

  @Post('token')
  @ApiOperation({ summary: 'Create a new conversation token' })
  async getChatToken(@Req() req: Request): Promise<string | undefined> {
    const currentUserId = req.user?.id as string;
    return this.conversationsService.getConversationToken(currentUserId);
  }

  @Delete(':conversationSid/participants/:participantSid')
  @ApiOperation({ summary: 'Remove a participant from a conversation' })
  @ApiResponse({
    status: 200,
    description: 'The participant has been removed',
    type: ApiResponseDto,
  })
  async removeParticipant(
    @Param('conversationSid') conversationSid: string,
    @Param('participantSid') participantSid: string,
  ): Promise<ApiResponseDto<void>> {
    const response = await this.conversationsService.removeParticipant(
      conversationSid,
      participantSid,
    );
    return response;
  }
}
