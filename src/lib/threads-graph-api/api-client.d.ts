import { z } from 'zod';
import { CreateMediaContainerParams, CreateMediaContainerResponse, ErrorResponse, ExchangeAuthorizationCodeResponse, GetAccountMetricsParams, GetAccountMetricsResponse, GetConversationParams, GetConversationResponse, GetMediaMetricsParams, GetMediaMetricsResponse, GetMediaObjectParams, GetMediaObjectResponse, GetRepliesParams, GetRepliesResponse, GetUserProfileParams, GetUserProfileResponse, GetUserThreadsParams, GetUserThreadsPublishingLimitParams, GetUserThreadsPublishingLimitResponse, GetUserThreadsResponse, ManageReplyParams, ManageReplyResponse, PublishParams, PublishResponse } from './types';
export declare class ThreadsApiError extends Error {
    private readonly _error?;
    constructor(error?: ErrorResponse);
    getThreadsError(): {
        error: {
            code?: number | undefined;
            message?: string | undefined;
            type?: string | undefined;
            fbtrace_id?: string | undefined;
        };
    } | undefined;
}
export declare class ThreadsPublicApiClient {
    private readonly _baseUrl;
    constructor(baseUrl?: string);
    _apiUrl(endpoint: string): string;
    _apiGet<U, V, T extends z.ZodType<V, z.ZodTypeDef, U>>(endpoint: string, params: Record<string, string | number | boolean | undefined>, responseSchema: T): Promise<V>;
    _apiPost<U, V, T extends z.ZodType<V, z.ZodTypeDef, U>>(endpoint: string, params: Record<string, string | number | boolean | undefined>, responseSchema: T): Promise<V>;
    createAuthorizationUrl(clientId: string, redirectUri: string, scope: string[], state?: string, baseUrl?: string): string;
    exchangeAuthorizationCode(clientId: string, clientSecret: string, redirectUri: string, code: string): Promise<ExchangeAuthorizationCodeResponse>;
}
export declare class ThreadsAuthenticatedApiClient extends ThreadsPublicApiClient {
    private readonly _accessToken;
    private readonly _userId;
    constructor(accessToken: string, userId: string, baseUrl?: string);
    _authenticatedGet<U, V, T extends z.ZodType<V, z.ZodTypeDef, U>>(endpoint: string, params: Record<string, string | number | boolean | undefined>, responseSchema: T): Promise<V>;
    _authenticatedPost<U, V, T extends z.ZodType<V, z.ZodTypeDef, U>>(endpoint: string, params: Record<string, string | number | boolean | undefined>, responseSchema: T): Promise<V>;
    createMediaContainer(params: CreateMediaContainerParams): Promise<CreateMediaContainerResponse>;
    publish(params: PublishParams): Promise<PublishResponse>;
    getUserThreads(params: GetUserThreadsParams): Promise<GetUserThreadsResponse>;
    getMediaObject(params: GetMediaObjectParams): Promise<GetMediaObjectResponse>;
    getUserProfile(params: GetUserProfileParams): Promise<GetUserProfileResponse>;
    getUserThreadsPublishingLimit(params: GetUserThreadsPublishingLimitParams): Promise<GetUserThreadsPublishingLimitResponse>;
    getReplies(params: GetRepliesParams): Promise<GetRepliesResponse>;
    getConversation(params: GetConversationParams): Promise<GetConversationResponse>;
    manageReply(params: ManageReplyParams): Promise<ManageReplyResponse>;
    getMediaMetrics(params: GetMediaMetricsParams): Promise<GetMediaMetricsResponse>;
    getAccountMetrics(params: GetAccountMetricsParams): Promise<GetAccountMetricsResponse>;
}
