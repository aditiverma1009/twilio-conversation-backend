// API path constants
export const API_PATHS = {
  BASE: '/api',
  CONVERSATIONS: '/conversations',
} as const;

// Base response type for all API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Conversation Types
export interface ConversationDto {
  sid: string;
  friendlyName: string | null;
  createdAt: string;
}

export interface ParticipantDto {
  sid: string;
  identity: string;
  conversationSid: string;
}

// Request Types
export interface CreateConversationRequest {
  friendlyName?: string;
  participants: string[]; // Array of user identities
}

export interface UpdateConversationRequest {
  friendlyName?: string;
}

export interface AddParticipantsRequest {
  participants: string[]; // Array of user identities
}

// Pagination Types
export interface PaginationMetaDto {
  total: number;
  page: number;
  pageSize: number;
}

// Response Types
export type GetConversationResponse = ApiResponse<{
  conversation: ConversationDto;
  participants: ParticipantDto[];
}>;

export type GetParticipantsResponse = ApiResponse<{
  participants: ParticipantDto[];
}>;

export type GetConversationsResponse = ApiResponse<{
  conversations: ConversationDto[];
  meta: PaginationMetaDto;
}>;

// API Endpoints Schema
export const API_ENDPOINTS = {
  base: `${API_PATHS.BASE}${API_PATHS.CONVERSATIONS}`,
  routes: {
    // Conversations
    LIST: '/',
    GET: '/:conversationSid',
    CREATE: '/',
    UPDATE: '/:conversationSid',
    DELETE: '/:conversationSid',

    // Participants
    LIST_PARTICIPANTS: '/:conversationSid/participants',
    ADD_PARTICIPANT: '/:conversationSid/participants',
    REMOVE_PARTICIPANT: '/:conversationSid/participants/:participantSid',
    UPDATE_PARTICIPANT: '/:conversationSid/participants/:participantSid',

    // User-specific
    USER_CONVERSATIONS: '/users/me/conversations',
  },
} as const;

// API Method Definitions
export interface ChatApi {
  // Conversation Methods
  getConversations(params?: {
    page?: number;
    pageSize?: number;
    status?: 'active' | 'inactive';
  }): Promise<GetConversationsResponse>;

  getConversation(conversationSid: string): Promise<GetConversationResponse>;

  createConversation(
    data: CreateConversationRequest,
  ): Promise<ApiResponse<{
    conversation: ConversationDto;
  }>>;

  updateConversation(
    conversationSid: string,
    data: UpdateConversationRequest,
  ): Promise<ApiResponse<{
    conversation: ConversationDto;
  }>>;

  deleteConversation(conversationSid: string): Promise<ApiResponse<void>>;

  // Participant Methods
  getParticipants(conversationSid: string): Promise<GetParticipantsResponse>;

  addParticipants(
    conversationSid: string,
    data: AddParticipantsRequest,
  ): Promise<ApiResponse<{
    participants: ParticipantDto[];
  }>>;

  removeParticipant(
    conversationSid: string,
    participantSid: string,
  ): Promise<ApiResponse<void>>;

  updateParticipant(
    conversationSid: string,
    participantSid: string,
  ): Promise<ApiResponse<{
    participant: ParticipantDto;
  }>>;

  // User-specific Methods
  getUserConversations(): Promise<GetConversationsResponse>;
}

// Example Usage:
/*
// Backend implementation (NestJS example)
@Controller(API_ENDPOINTS.base)
export class ConversationsController implements ChatApi {
  constructor(private readonly twilioService: TwilioService) {}

  @Get(API_ENDPOINTS.routes.LIST)
  async getConversations(
    @Query() params: { page?: number; pageSize?: number; status?: 'active' | 'inactive' },
  ): Promise<GetConversationsResponse> {
    // Implementation using TwilioService
  }

  @Post(API_ENDPOINTS.routes.CREATE)
  async createConversation(
    @Body() data: CreateConversationRequest,
  ): Promise<ApiResponse<{ conversation: ConversationDto }>> {
    // Implementation using TwilioService
  }
}

// Frontend usage
const response = await axios.get<GetConversationsResponse>(
  `${API_ENDPOINTS.base}${API_ENDPOINTS.routes.LIST}`,
  {
    params: { page: 1, pageSize: 20 },
    headers: { Authorization: `Bearer ${token}` },
  },
);
*/ 