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
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ required: false })
  error?: string;
}

export class GetConversationsResponseDto extends ApiResponseDto<{
  conversations: ConversationDto[];
}> {
  declare data: {
    conversations: ConversationDto[];
  };
}

export class GetConversationResponseDto extends ApiResponseDto<{
  conversation: ConversationDto;
  participants: ParticipantDto[];
}> {}

export class GetParticipantsResponseDto extends ApiResponseDto<{
  participants: ParticipantDto[];
}> {} 