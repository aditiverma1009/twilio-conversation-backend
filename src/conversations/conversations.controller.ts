import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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
import { AuthGuard } from '../auth/auth.guard';
import { ConversationsService } from './conversations.service';
import { Request } from 'express';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
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
    @Req() req: Request,
  ): Promise<GetConversationsResponseDto> {
    const currentUserId = req.user?.id as string;

    const response =
      await this.conversationsService.getConversations(currentUserId);
    return response;
  }

  @Get(':conversationSid')
  @ApiOperation({ summary: 'Get a conversation by SID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation details with participants',
    type: GetConversationResponseDto,
  })
  async getConversation(
    @Param('conversationSid') conversationSid: string,
  ): Promise<GetConversationResponseDto> {
    const response =
      await this.conversationsService.getConversation(conversationSid);
    return response;
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

  @Get(':conversationSid/participants')
  @ApiOperation({ summary: 'Get participants of a conversation' })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
    type: GetParticipantsResponseDto,
  })
  async getParticipants(
    @Param('conversationSid') conversationSid: string,
  ): Promise<GetParticipantsResponseDto> {
    const response =
      await this.conversationsService.getParticipants(conversationSid);
    return response;
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
