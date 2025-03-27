import { ApiProperty } from '@nestjs/swagger';

export class ParticipantDto {
  @ApiProperty({
    description: 'The unique identifier of the participant',
    example: 'PA123456789',
  })
  id: string;

  @ApiProperty({
    description: 'The Twilio identity of the participant',
    example: 'user123',
  })
  identity: string;

  @ApiProperty({
    description: 'The ID of the conversation',
    example: 'CH123456789',
  })
  conversationId: string;

  @ApiProperty({
    description: 'The ID of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'The creation timestamp of the participant',
    example: '2024-03-26T16:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update timestamp of the participant',
    example: '2024-03-26T16:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Additional Twilio participant attributes',
    example: { role: 'admin' },
    nullable: true,
  })
  attributes?: Record<string, any>;
} 