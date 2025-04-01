import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private twilioService: TwilioService,
  ) {}

  async register(email: string, password: string, name: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const hashedPassword = await bcrypt.hash(password, 10);
    const twilioIdentity = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        password: hashedPassword,
        name,
        twilioIdentity,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      identity: user.twilioIdentity,
    });

    const twilioToken = this.twilioService.generateToken(user.twilioIdentity);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        identity: user.twilioIdentity,
      },
      token,
      twilioToken,
    };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { name: username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      identity: user.twilioIdentity,
    });

    const twilioToken = this.twilioService.generateToken(user.twilioIdentity);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        identity: user.twilioIdentity,
      },
      token,
      twilioToken,
    };
  }
} 