import { z } from 'zod';
var makePaginatedResponseSchema = function (dataSchema) {
    return z.object({
        data: z.array(dataSchema),
        paging: z.object({
            cursors: z.object({
                before: z.string().optional(),
                after: z.string().optional(),
            }),
        }),
    });
};
export var SuccessResponseSchema = z.object({
    success: z.boolean(),
});
export var ErrorResponseSchema = z.object({
    error: z.object({
        code: z.number().optional(),
        fbtrace_id: z.string().optional(),
        message: z.string().optional(),
        type: z.string().optional(),
    }),
});
export var ExchangeAuthorizationCodeResponseSchema = z.object({
    access_token: z.string(),
    user_id: z.coerce.string(),
});
export var CreateMediaContainerResponseSchema = z.object({
    id: z.string(),
});
export var PublishResponseSchema = z.object({
    id: z.string(),
});
export var ThreadsMediaObjectSchema = z.object({
    id: z.string().optional(),
    media_product_type: z.string().optional(),
    media_type: z
        .enum([
        'TEXT_POST',
        'IMAGE',
        'VIDEO',
        'CAROUSEL_ALBUM',
        'AUDIO',
        'REPOST_FACADE',
    ])
        .optional(),
    media_url: z.string().optional(),
    permalink: z.string().optional(),
    owner: z.string().optional(),
    username: z.string().optional(),
    text: z.string().optional(),
    timestamp: z.string().optional(),
    shortcode: z.string().optional(),
    thumbnail_url: z.string().optional(),
    // TODO: check if this is an array of string IDs or an array of media objects
    children: z.array(z.string()).optional(),
    is_quote_post: z.boolean().optional(),
    is_reply: z.boolean().optional(),
    status_code: z.string().optional(),
});
export var ThreadsReplySchema = z.object({
    id: z.string().optional(),
    text: z.string().optional(),
    username: z.string().optional(),
    permalink: z.string().optional(),
    timestamp: z.string().optional(),
    media_product_type: z.string().optional(),
    media_type: z
        .enum(['TEXT_POST', 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'AUDIO'])
        .optional(),
    media_url: z.string().optional(),
    shortcode: z.string().optional(),
    thumbnail_url: z.string().optional(),
    // TODO: check if this is an array of string IDs or an array of media objects
    children: z.array(z.string()).optional(),
    is_quote_post: z.boolean().optional(),
    has_replies: z.boolean().optional(),
    root_post: z.string().optional(),
    replied_to: z.string().optional(),
    is_reply: z.boolean().optional(),
    is_reply_owned_by_me: z.boolean().optional(),
    hide_status: z
        .enum([
        'NOT_HUSHED',
        'UNHUSHED',
        'HIDDEN',
        'COVERED',
        'BLOCKED',
        'RESTRICTED',
    ])
        .optional(),
});
export var GetUserThreadsResponseSchema = makePaginatedResponseSchema(ThreadsMediaObjectSchema);
export var GetMediaObjectResponseSchema = ThreadsMediaObjectSchema;
export var GetRepliesResponseSchema = makePaginatedResponseSchema(ThreadsReplySchema);
export var GetConversationResponseSchema = makePaginatedResponseSchema(ThreadsReplySchema);
export var ManageReplyResponseSchema = SuccessResponseSchema;
export var ThreadsUserProfileSchema = z.object({
    id: z.string().optional(),
    username: z.string().optional(),
    threads_profile_picture_url: z.string().optional(),
    threads_biography: z.string().optional(),
});
export var GetUserProfileResponseSchema = ThreadsUserProfileSchema;
export var ThreadsPublishingLimitSchema = z.object({
    data: z.array(z.object({
        reply_quota_usage: z.number().optional(),
        reply_config: z
            .object({
            quota_total: z.number().optional(),
            quota_duration: z.number().optional(),
        })
            .optional(),
    })),
});
export var GetUserThreadsPublishingLimitResponseSchema = ThreadsPublishingLimitSchema;
export var ThreadsMediaMetricSchema = z.enum([
    'views',
    'likes',
    'replies',
    'reposts',
    'quotes',
]);
export var ThreadsMediaMetricValueSchema = z.object({
    name: ThreadsMediaMetricSchema,
    // TODO: figure out literal union type
    period: z.string(),
    values: z.array(z.object({
        value: z.number(),
    })),
    title: z.string(),
    description: z.string(),
    id: z.string(),
});
export var GetMediaMetricsResponseSchema = z.object({
    data: z.array(ThreadsMediaMetricValueSchema),
});
export var ThreadsAccountMetricSchema = z.enum([
    'views',
    'likes',
    'replies',
    'reposts',
    'quotes',
    'followers_count',
    'follower_demographics',
]);
export var ThreadsAccountMetricValueSchema = z.object({
    name: ThreadsAccountMetricSchema,
    // TODO: figure out literal union type
    period: z.string(),
    // TODO: can we restrict this to be a homogenous array?
    values: z.array(z.object({
        value: z.number(),
        end_time: z.string().optional(),
    })),
    title: z.string(),
    description: z.string(),
    id: z.string(),
});
export var GetAccountMetricsResponseSchema = z.object({
    data: z.array(ThreadsAccountMetricValueSchema),
});
