import { ApiProperty } from '@nestjs/swagger';
import { ParticipantDto } from '../../conversations/dto/participant.dto';

export class UserDto {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The avatar URL of the user',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar?: string;

  @ApiProperty({
    description: 'The Twilio identity of the user',
    example: 'user123',
  })
  twilioIdentity: string;

  @ApiProperty({
    description: 'The creation timestamp of the user',
    example: '2024-03-26T16:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The last update timestamp of the user',
    example: '2024-03-26T16:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The participants in conversations',
    type: () => ParticipantDto,
    isArray: true,
  })
  participants: ParticipantDto[];
} 