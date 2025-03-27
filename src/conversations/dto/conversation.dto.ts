import { ApiProperty } from '@nestjs/swagger';

export class ConversationDto {
  @ApiProperty({
    description: 'The unique identifier of the conversation',
    example: 'CH123456789',
  })
  sid: string;

  @ApiProperty({
    description: 'The friendly name of the conversation',
    example: 'Team Chat',
    nullable: true,
  })
  friendlyName: string | null;

  @ApiProperty({
    description: 'The creation timestamp of the conversation',
    example: '2024-03-26T16:00:00.000Z',
  })
  createdAt: string;
}

export class CreateConversationDto {
  @ApiProperty({
    description: 'The friendly name for the conversation',
    example: 'Team Chat',
    required: false,
  })
  friendlyName?: string;

  @ApiProperty({
    description: 'Array of user identities to add to the conversation',
    example: ['user1', 'user2'],
    type: [String],
  })
  participants: string[];
}

export class UpdateConversationDto {
  @ApiProperty({
    description: 'The new friendly name for the conversation',
    example: 'Updated Team Chat',
    required: false,
  })
  friendlyName?: string;
}

export class AddParticipantsDto {
  @ApiProperty({
    description: 'Array of user identities to add to the conversation',
    example: ['user3', 'user4'],
    type: [String],
  })
  participants: string[];
} 