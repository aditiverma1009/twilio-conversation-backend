import { ApiProperty } from '@nestjs/swagger';
import { ConversationDto } from './conversation.dto';
import { ParticipantDto } from './participant.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;
}

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'The response data',
  })
  data: T;

  @ApiProperty({
    description: 'Error message if request failed',
    required: false,
  })
  error?: string;
}

export class GetConversationsResponseDto extends ApiResponseDto<{
  conversations: ConversationDto[];
  meta: PaginationMetaDto;
}> {
  @ApiProperty({
    description: 'Response data',
    type: () => ({
      conversations: [ConversationDto],
      meta: PaginationMetaDto,
    }),
  })
  declare data: {
    conversations: ConversationDto[];
    meta: PaginationMetaDto;
  };
}

export class GetConversationResponseDto extends ApiResponseDto<{
  conversation: ConversationDto;
  participants: ParticipantDto[];
}> {
  @ApiProperty({
    description: 'Response data',
    type: () => ({
      conversation: ConversationDto,
      participants: [ParticipantDto],
    }),
  })
  declare data: {
    conversation: ConversationDto;
    participants: ParticipantDto[];
  };
}

export class GetParticipantsResponseDto extends ApiResponseDto<{
  participants: ParticipantDto[];
}> {
  @ApiProperty({
    description: 'Response data',
    type: () => ({
      participants: [ParticipantDto],
    }),
  })
  declare data: {
    participants: ParticipantDto[];
  };
} 