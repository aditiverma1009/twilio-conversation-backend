import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.participant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        twilioIdentity: uuidv4(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        twilioIdentity: uuidv4(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Bob Wilson',
        twilioIdentity: uuidv4(),
      },
    }),
  ]);

  // Create test conversations
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        id: 'CH_test_1', // Simulated Twilio conversation SID
        friendlyName: 'General Chat',
      },
    }),
    prisma.conversation.create({
      data: {
        id: 'CH_test_2',
        friendlyName: 'Project Discussion',
      },
    }),
  ]);

  // Add participants to conversations
  const participants = await Promise.all([
    // Add all users to General Chat
    ...users.map((user) =>
      prisma.participant.create({
        data: {
          id: `PA_${user.id}_1`, // Simulated Twilio participant SID
          identity: user.twilioIdentity,
          conversationId: conversations[0].id,
          userId: user.id,
        },
      }),
    ),
    // Add John and Jane to Project Discussion
    prisma.participant.create({
      data: {
        id: `PA_${users[0].id}_2`,
        identity: users[0].twilioIdentity,
        conversationId: conversations[1].id,
        userId: users[0].id,
      },
    }),
    prisma.participant.create({
      data: {
        id: `PA_${users[1].id}_2`,
        identity: users[1].twilioIdentity,
        conversationId: conversations[1].id,
        userId: users[1].id,
      },
    }),
  ]);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  }); 