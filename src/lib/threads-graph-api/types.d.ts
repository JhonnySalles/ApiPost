import { z } from 'zod';
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export type CursorPaginationParams = {
    before?: string;
    after?: string;
    limit?: number;
};
export type TemporalRangeParams = {
    since?: string;
    until?: string;
};
export type TemporalPaginationParams = TemporalRangeParams & {
    limit?: number;
};
export declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: boolean;
}, {
    success: boolean;
}>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodOptional<z.ZodNumber>;
        fbtrace_id: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code?: number | undefined;
        message?: string | undefined;
        type?: string | undefined;
        fbtrace_id?: string | undefined;
    }, {
        code?: number | undefined;
        message?: string | undefined;
        type?: string | undefined;
        fbtrace_id?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        code?: number | undefined;
        message?: string | undefined;
        type?: string | undefined;
        fbtrace_id?: string | undefined;
    };
}, {
    error: {
        code?: number | undefined;
        message?: string | undefined;
        type?: string | undefined;
        fbtrace_id?: string | undefined;
    };
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export declare const ExchangeAuthorizationCodeResponseSchema: z.ZodObject<{
    access_token: z.ZodString;
    user_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    access_token: string;
    user_id: string;
}, {
    access_token: string;
    user_id: string;
}>;
export type ExchangeAuthorizationCodeResponse = z.infer<typeof ExchangeAuthorizationCodeResponseSchema>;
export type CreateMediaContainerParams = {
    replyToId?: string;
    replyControl?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';
} & ({
    mediaType: 'TEXT';
    text: string;
    topicTag?: string;
} | {
    mediaType: 'IMAGE';
    imageUrl: string;
    isCarouselItem?: boolean;
    text?: string;
    topicTag?: string;
} | {
    mediaType: 'VIDEO';
    videoUrl: string;
    isCarouselItem?: boolean;
    text?: string;
    topicTag?: string;
} | {
    mediaType: 'CAROUSEL';
    children: string[];
    text?: string;
    topicTag?: string;
});
export declare const CreateMediaContainerResponseSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateMediaContainerResponse = z.infer<typeof CreateMediaContainerResponseSchema>;
export type PublishParams = {
    creationId: string;
};
export declare const PublishResponseSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type PublishResponse = z.infer<typeof PublishResponseSchema>;
export declare const ThreadsMediaObjectSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    media_product_type: z.ZodOptional<z.ZodString>;
    media_type: z.ZodOptional<z.ZodEnum<["TEXT_POST", "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "AUDIO", "REPOST_FACADE"]>>;
    media_url: z.ZodOptional<z.ZodString>;
    permalink: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    shortcode: z.ZodOptional<z.ZodString>;
    thumbnail_url: z.ZodOptional<z.ZodString>;
    children: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    is_quote_post: z.ZodOptional<z.ZodBoolean>;
    is_reply: z.ZodOptional<z.ZodBoolean>;
    status_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    owner?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    status_code?: string | undefined;
}, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    owner?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    status_code?: string | undefined;
}>;
export type ThreadsMediaObject = z.infer<typeof ThreadsMediaObjectSchema>;
export type ThreadsMediaObjectField = keyof ThreadsMediaObject;
export declare const ThreadsReplySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    permalink: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    media_product_type: z.ZodOptional<z.ZodString>;
    media_type: z.ZodOptional<z.ZodEnum<["TEXT_POST", "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "AUDIO"]>>;
    media_url: z.ZodOptional<z.ZodString>;
    shortcode: z.ZodOptional<z.ZodString>;
    thumbnail_url: z.ZodOptional<z.ZodString>;
    children: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    is_quote_post: z.ZodOptional<z.ZodBoolean>;
    has_replies: z.ZodOptional<z.ZodBoolean>;
    root_post: z.ZodOptional<z.ZodString>;
    replied_to: z.ZodOptional<z.ZodString>;
    is_reply: z.ZodOptional<z.ZodBoolean>;
    is_reply_owned_by_me: z.ZodOptional<z.ZodBoolean>;
    hide_status: z.ZodOptional<z.ZodEnum<["NOT_HUSHED", "UNHUSHED", "HIDDEN", "COVERED", "BLOCKED", "RESTRICTED"]>>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    has_replies?: boolean | undefined;
    root_post?: string | undefined;
    replied_to?: string | undefined;
    is_reply_owned_by_me?: boolean | undefined;
    hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
}, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    has_replies?: boolean | undefined;
    root_post?: string | undefined;
    replied_to?: string | undefined;
    is_reply_owned_by_me?: boolean | undefined;
    hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
}>;
export type ThreadsReply = z.infer<typeof ThreadsReplySchema>;
export type ThreadsReplyField = keyof ThreadsReply;
export type GetUserThreadsParams = {
    id: string;
    fields?: ThreadsMediaObjectField[];
} & XOR<TemporalPaginationParams, CursorPaginationParams>;
export declare const GetUserThreadsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodType<{
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        owner?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        status_code?: string | undefined;
    }, z.ZodTypeDef, {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        owner?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        status_code?: string | undefined;
    }>, "many">;
    paging: z.ZodObject<{
        cursors: z.ZodObject<{
            before: z.ZodOptional<z.ZodString>;
            after: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            before?: string | undefined;
            after?: string | undefined;
        }, {
            before?: string | undefined;
            after?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        owner?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        status_code?: string | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        owner?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        status_code?: string | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}>;
export type GetUserThreadsResponse = z.infer<typeof GetUserThreadsResponseSchema>;
export type GetMediaObjectParams = {
    id: string;
    fields?: ThreadsMediaObjectField[];
};
export declare const GetMediaObjectResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    media_product_type: z.ZodOptional<z.ZodString>;
    media_type: z.ZodOptional<z.ZodEnum<["TEXT_POST", "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "AUDIO", "REPOST_FACADE"]>>;
    media_url: z.ZodOptional<z.ZodString>;
    permalink: z.ZodOptional<z.ZodString>;
    owner: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
    shortcode: z.ZodOptional<z.ZodString>;
    thumbnail_url: z.ZodOptional<z.ZodString>;
    children: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    is_quote_post: z.ZodOptional<z.ZodBoolean>;
    is_reply: z.ZodOptional<z.ZodBoolean>;
    status_code: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    owner?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    status_code?: string | undefined;
}, {
    id?: string | undefined;
    media_product_type?: string | undefined;
    media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | "REPOST_FACADE" | undefined;
    media_url?: string | undefined;
    permalink?: string | undefined;
    owner?: string | undefined;
    username?: string | undefined;
    text?: string | undefined;
    timestamp?: string | undefined;
    shortcode?: string | undefined;
    thumbnail_url?: string | undefined;
    children?: string[] | undefined;
    is_quote_post?: boolean | undefined;
    is_reply?: boolean | undefined;
    status_code?: string | undefined;
}>;
export type GetMediaObjectResponse = z.infer<typeof GetMediaObjectResponseSchema>;
export type GetRepliesParams = {
    id: string;
    fields?: ThreadsReplyField[];
    reverse?: boolean;
} & XOR<TemporalPaginationParams, CursorPaginationParams>;
export declare const GetRepliesResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodType<{
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }, z.ZodTypeDef, {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }>, "many">;
    paging: z.ZodObject<{
        cursors: z.ZodObject<{
            before: z.ZodOptional<z.ZodString>;
            after: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            before?: string | undefined;
            after?: string | undefined;
        }, {
            before?: string | undefined;
            after?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}>;
export type GetRepliesResponse = z.infer<typeof GetRepliesResponseSchema>;
export type GetConversationParams = {
    id: string;
    fields?: ThreadsReplyField[];
    reverse?: boolean;
} & XOR<TemporalPaginationParams, CursorPaginationParams>;
export declare const GetConversationResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodType<{
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }, z.ZodTypeDef, {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }>, "many">;
    paging: z.ZodObject<{
        cursors: z.ZodObject<{
            before: z.ZodOptional<z.ZodString>;
            after: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            before?: string | undefined;
            after?: string | undefined;
        }, {
            before?: string | undefined;
            after?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }, {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}, {
    data: {
        id?: string | undefined;
        media_product_type?: string | undefined;
        media_type?: "IMAGE" | "VIDEO" | "TEXT_POST" | "CAROUSEL_ALBUM" | "AUDIO" | undefined;
        media_url?: string | undefined;
        permalink?: string | undefined;
        username?: string | undefined;
        text?: string | undefined;
        timestamp?: string | undefined;
        shortcode?: string | undefined;
        thumbnail_url?: string | undefined;
        children?: string[] | undefined;
        is_quote_post?: boolean | undefined;
        is_reply?: boolean | undefined;
        has_replies?: boolean | undefined;
        root_post?: string | undefined;
        replied_to?: string | undefined;
        is_reply_owned_by_me?: boolean | undefined;
        hide_status?: "NOT_HUSHED" | "UNHUSHED" | "HIDDEN" | "COVERED" | "BLOCKED" | "RESTRICTED" | undefined;
    }[];
    paging: {
        cursors: {
            before?: string | undefined;
            after?: string | undefined;
        };
    };
}>;
export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;
export type ManageReplyParams = {
    id: string;
    hide: boolean;
};
export declare const ManageReplyResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: boolean;
}, {
    success: boolean;
}>;
export type ManageReplyResponse = z.infer<typeof ManageReplyResponseSchema>;
export declare const ThreadsUserProfileSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    threads_profile_picture_url: z.ZodOptional<z.ZodString>;
    threads_biography: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    username?: string | undefined;
    threads_profile_picture_url?: string | undefined;
    threads_biography?: string | undefined;
}, {
    id?: string | undefined;
    username?: string | undefined;
    threads_profile_picture_url?: string | undefined;
    threads_biography?: string | undefined;
}>;
export type ThreadsUserProfile = z.infer<typeof ThreadsUserProfileSchema>;
export type ThreadsUserProfileField = keyof ThreadsUserProfile;
export type GetUserProfileParams = {
    id: string;
    fields?: ThreadsUserProfileField[];
};
export declare const GetUserProfileResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    threads_profile_picture_url: z.ZodOptional<z.ZodString>;
    threads_biography: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string | undefined;
    username?: string | undefined;
    threads_profile_picture_url?: string | undefined;
    threads_biography?: string | undefined;
}, {
    id?: string | undefined;
    username?: string | undefined;
    threads_profile_picture_url?: string | undefined;
    threads_biography?: string | undefined;
}>;
export type GetUserProfileResponse = z.infer<typeof GetUserProfileResponseSchema>;
export declare const ThreadsPublishingLimitSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        reply_quota_usage: z.ZodOptional<z.ZodNumber>;
        reply_config: z.ZodOptional<z.ZodObject<{
            quota_total: z.ZodOptional<z.ZodNumber>;
            quota_duration: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        }, {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }, {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data: {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }[];
}, {
    data: {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }[];
}>;
export type ThreadsPublishingLimit = z.infer<typeof ThreadsPublishingLimitSchema>;
export type ThreadsPublishingLimitField = keyof ThreadsPublishingLimit['data'][0];
export type GetUserThreadsPublishingLimitParams = {
    id: string;
    fields?: ThreadsPublishingLimitField[];
};
export declare const GetUserThreadsPublishingLimitResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        reply_quota_usage: z.ZodOptional<z.ZodNumber>;
        reply_config: z.ZodOptional<z.ZodObject<{
            quota_total: z.ZodOptional<z.ZodNumber>;
            quota_duration: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        }, {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }, {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data: {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }[];
}, {
    data: {
        reply_quota_usage?: number | undefined;
        reply_config?: {
            quota_total?: number | undefined;
            quota_duration?: number | undefined;
        } | undefined;
    }[];
}>;
export type GetUserThreadsPublishingLimitResponse = z.infer<typeof GetUserThreadsPublishingLimitResponseSchema>;
export declare const ThreadsMediaMetricSchema: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes"]>;
export type ThreadsMediaMetric = z.infer<typeof ThreadsMediaMetricSchema>;
export declare const ThreadsMediaMetricValueSchema: z.ZodObject<{
    name: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes"]>;
    period: z.ZodString;
    values: z.ZodArray<z.ZodObject<{
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: number;
    }, {
        value: number;
    }>, "many">;
    title: z.ZodString;
    description: z.ZodString;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    values: {
        value: number;
    }[];
    id: string;
    name: "views" | "likes" | "replies" | "reposts" | "quotes";
    period: string;
    title: string;
    description: string;
}, {
    values: {
        value: number;
    }[];
    id: string;
    name: "views" | "likes" | "replies" | "reposts" | "quotes";
    period: string;
    title: string;
    description: string;
}>;
export type ThreadsMediaMetricValue = z.infer<typeof ThreadsMediaMetricValueSchema>;
export type GetMediaMetricsParams = {
    id: string;
    metrics?: ThreadsMediaMetric[];
} & TemporalRangeParams;
export declare const GetMediaMetricsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        name: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes"]>;
        period: z.ZodString;
        values: z.ZodArray<z.ZodObject<{
            value: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            value: number;
        }, {
            value: number;
        }>, "many">;
        title: z.ZodString;
        description: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        values: {
            value: number;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes";
        period: string;
        title: string;
        description: string;
    }, {
        values: {
            value: number;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes";
        period: string;
        title: string;
        description: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data: {
        values: {
            value: number;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes";
        period: string;
        title: string;
        description: string;
    }[];
}, {
    data: {
        values: {
            value: number;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes";
        period: string;
        title: string;
        description: string;
    }[];
}>;
export type GetMediaMetricsResponse = z.infer<typeof GetMediaMetricsResponseSchema>;
export declare const ThreadsAccountMetricSchema: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes", "followers_count", "follower_demographics"]>;
export type ThreadsAccountMetric = z.infer<typeof ThreadsAccountMetricSchema>;
export declare const ThreadsAccountMetricValueSchema: z.ZodObject<{
    name: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes", "followers_count", "follower_demographics"]>;
    period: z.ZodString;
    values: z.ZodArray<z.ZodObject<{
        value: z.ZodNumber;
        end_time: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: number;
        end_time?: string | undefined;
    }, {
        value: number;
        end_time?: string | undefined;
    }>, "many">;
    title: z.ZodString;
    description: z.ZodString;
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    values: {
        value: number;
        end_time?: string | undefined;
    }[];
    id: string;
    name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
    period: string;
    title: string;
    description: string;
}, {
    values: {
        value: number;
        end_time?: string | undefined;
    }[];
    id: string;
    name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
    period: string;
    title: string;
    description: string;
}>;
export type ThreadsAccountMetricValue = z.infer<typeof ThreadsAccountMetricValueSchema>;
export type GetAccountMetricsParams = {
    id: string;
    metrics?: ThreadsAccountMetric[];
} & TemporalRangeParams;
export declare const GetAccountMetricsResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodObject<{
        name: z.ZodEnum<["views", "likes", "replies", "reposts", "quotes", "followers_count", "follower_demographics"]>;
        period: z.ZodString;
        values: z.ZodArray<z.ZodObject<{
            value: z.ZodNumber;
            end_time: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            value: number;
            end_time?: string | undefined;
        }, {
            value: number;
            end_time?: string | undefined;
        }>, "many">;
        title: z.ZodString;
        description: z.ZodString;
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        values: {
            value: number;
            end_time?: string | undefined;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
        period: string;
        title: string;
        description: string;
    }, {
        values: {
            value: number;
            end_time?: string | undefined;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
        period: string;
        title: string;
        description: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data: {
        values: {
            value: number;
            end_time?: string | undefined;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
        period: string;
        title: string;
        description: string;
    }[];
}, {
    data: {
        values: {
            value: number;
            end_time?: string | undefined;
        }[];
        id: string;
        name: "views" | "likes" | "replies" | "reposts" | "quotes" | "followers_count" | "follower_demographics";
        period: string;
        title: string;
        description: string;
    }[];
}>;
export type GetAccountMetricsResponse = z.infer<typeof GetAccountMetricsResponseSchema>;
export { };
