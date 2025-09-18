var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t = op[0] & 2 ? y['return'] : op[0] ? y['throw'] || ((t = y['return']) && t.call(y), 0) : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
      }
    return t;
  };
import {
  CreateMediaContainerResponseSchema,
  ErrorResponseSchema,
  ExchangeAuthorizationCodeResponseSchema,
  GetAccountMetricsResponseSchema,
  GetConversationResponseSchema,
  GetMediaMetricsResponseSchema,
  GetMediaObjectResponseSchema,
  GetRepliesResponseSchema,
  GetUserProfileResponseSchema,
  GetUserThreadsPublishingLimitResponseSchema,
  GetUserThreadsResponseSchema,
  ManageReplyResponseSchema,
  PublishResponseSchema,
} from './types.js';
var ThreadsApiError = /** @class */ (function (_super) {
  __extends(ThreadsApiError, _super);
  function ThreadsApiError(error) {
    var _newTarget = this.constructor;
    var _this =
      _super.call(
        this,
        (error === null || error === void 0 ? void 0 : error.error.message) || 'An unknown error occurred'
      ) || this;
    _this._error = error;
    var actualProto = _newTarget.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(_this, actualProto);
    } else {
      // @ts-ignore
      _this.__proto__ = actualProto;
    }
    return _this;
  }
  ThreadsApiError.prototype.getThreadsError = function () {
    return this._error;
  };
  return ThreadsApiError;
})(Error);
export { ThreadsApiError };
var ThreadsPublicApiClient = /** @class */ (function () {
  function ThreadsPublicApiClient(baseUrl) {
    if (baseUrl === void 0) {
      baseUrl = 'https://graph.threads.net';
    }
    this._baseUrl = baseUrl;
  }
  ThreadsPublicApiClient.prototype._apiUrl = function (endpoint) {
    return this._baseUrl + endpoint;
  };
  ThreadsPublicApiClient.prototype._apiGet = function (endpoint, params, responseSchema) {
    return __awaiter(this, void 0, void 0, function () {
      var filteredParams, apiUrl, response, json, error;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            filteredParams = Object.keys(params).reduce(function (acc, key) {
              var _a;
              return params[key] === undefined
                ? __assign({}, acc)
                : __assign(__assign({}, acc), ((_a = {}), (_a[key] = params[key] + ''), _a));
            }, {});
            apiUrl = this._apiUrl(endpoint) + '?' + new URLSearchParams(filteredParams);
            return [
              4 /*yield*/,
              fetch(apiUrl, {
                method: 'GET',
              }),
            ];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            json = _a.sent();
            if (json.error) {
              error = ErrorResponseSchema.safeParse(json);
              throw new ThreadsApiError(error.success ? error.data : undefined);
            }
            return [2 /*return*/, responseSchema.parse(json)];
        }
      });
    });
  };
  ThreadsPublicApiClient.prototype._apiPost = function (endpoint, params, responseSchema) {
    return __awaiter(this, void 0, void 0, function () {
      var apiUrl, body, response, json, error;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            apiUrl = this._apiUrl(endpoint);
            body = new FormData();
            Object.keys(params).forEach(function (key) {
              return params[key] && body.append(key, params[key]);
            });
            return [
              4 /*yield*/,
              fetch(apiUrl, {
                method: 'POST',
                body: body,
              }),
            ];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            json = _a.sent();
            if (json.error) {
              error = ErrorResponseSchema.safeParse(json);
              throw new ThreadsApiError(error.success ? error.data : undefined);
            }
            return [2 /*return*/, responseSchema.parse(json)];
        }
      });
    });
  };
  ThreadsPublicApiClient.prototype.createAuthorizationUrl = function (clientId, redirectUri, scope, state, baseUrl) {
    if (baseUrl === void 0) {
      baseUrl = 'https://www.threads.net';
    }
    return (
      baseUrl +
      '/oauth/authorize' +
      '?' +
      new URLSearchParams(
        __assign(
          { client_id: clientId, redirect_uri: redirectUri, scope: scope.join(','), response_type: 'code' },
          state && { state: state }
        )
      )
    );
  };
  ThreadsPublicApiClient.prototype.exchangeAuthorizationCode = function (clientId, clientSecret, redirectUri, code) {
    return __awaiter(this, void 0, void 0, function () {
      var formData, response, json;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            formData = new FormData();
            formData.append('client_id', clientId);
            formData.append('client_secret', clientSecret);
            formData.append('grant_type', 'authorization_code');
            formData.append('redirect_uri', redirectUri);
            formData.append('code', code);
            return [
              4 /*yield*/,
              fetch(this._apiUrl('/oauth/access_token'), {
                method: 'POST',
                body: formData,
              }),
            ];
          case 1:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 2:
            json = _a.sent();
            return [2 /*return*/, ExchangeAuthorizationCodeResponseSchema.parse(json)];
        }
      });
    });
  };
  return ThreadsPublicApiClient;
})();
export { ThreadsPublicApiClient };
var ThreadsAuthenticatedApiClient = /** @class */ (function (_super) {
  __extends(ThreadsAuthenticatedApiClient, _super);
  function ThreadsAuthenticatedApiClient(accessToken, userId, baseUrl) {
    if (baseUrl === void 0) {
      baseUrl = 'https://graph.threads.net';
    }
    var _this = _super.call(this, baseUrl) || this;
    _this._accessToken = accessToken;
    _this._userId = userId;
    return _this;
  }
  ThreadsAuthenticatedApiClient.prototype._authenticatedGet = function (endpoint, params, responseSchema) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [
          2 /*return*/,
          this._apiGet(endpoint, __assign(__assign({}, params), { access_token: this._accessToken }), responseSchema),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype._authenticatedPost = function (endpoint, params, responseSchema) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [
          2 /*return*/,
          this._apiPost(endpoint, __assign(__assign({}, params), { access_token: this._accessToken }), responseSchema),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.createMediaContainer = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [
          2 /*return*/,
          this._authenticatedPost(
            '/v1.0/me/threads',
            __assign(
              __assign(
                __assign(
                  {
                    media_type: params.mediaType,
                    text: params.text,
                    reply_control: params.replyControl,
                    reply_to_id: params.replyToId,
                    topic_tag: params.topicTag,
                  },
                  params.mediaType === 'IMAGE' && {
                    image_url: params.imageUrl,
                    is_carousel_item: params.isCarouselItem,
                  }
                ),
                params.mediaType === 'VIDEO' && {
                  video_url: params.videoUrl,
                  is_carousel_item: params.isCarouselItem,
                }
              ),
              params.mediaType === 'CAROUSEL' && {
                children: params.children.join(','),
              }
            ),
            CreateMediaContainerResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.publish = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [
          2 /*return*/,
          this._authenticatedPost(
            '/v1.0/me/threads_publish',
            {
              creation_id: params.creationId,
            },
            PublishResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getUserThreads = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields), (restParams = __rest(params, ['id', 'fields'])));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/threads'),
            __assign({ fields: fields === null || fields === void 0 ? void 0 : fields.join(',') }, restParams),
            GetUserThreadsResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getMediaObject = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id),
            {
              fields: fields === null || fields === void 0 ? void 0 : fields.join(','),
            },
            GetMediaObjectResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getUserProfile = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id),
            {
              fields: fields === null || fields === void 0 ? void 0 : fields.join(','),
            },
            GetUserProfileResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getUserThreadsPublishingLimit = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/threads_publishing_limit'),
            {
              fields: fields === null || fields === void 0 ? void 0 : fields.join(','),
            },
            GetUserThreadsPublishingLimitResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getReplies = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields), (restParams = __rest(params, ['id', 'fields'])));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/replies'),
            __assign({ fields: fields === null || fields === void 0 ? void 0 : fields.join(',') }, restParams),
            GetRepliesResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getConversation = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, fields, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (fields = params.fields), (restParams = __rest(params, ['id', 'fields'])));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/conversation'),
            __assign({ fields: fields === null || fields === void 0 ? void 0 : fields.join(',') }, restParams),
            GetConversationResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.manageReply = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (restParams = __rest(params, ['id'])));
        return [
          2 /*return*/,
          this._authenticatedPost(
            '/v1.0/'.concat(id, '/manage_reply'),
            __assign({}, restParams),
            ManageReplyResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getMediaMetrics = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, metrics, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (metrics = params.metrics), (restParams = __rest(params, ['id', 'metrics'])));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/insights'),
            __assign({ metric: metrics === null || metrics === void 0 ? void 0 : metrics.join(',') }, restParams),
            GetMediaMetricsResponseSchema
          ),
        ];
      });
    });
  };
  ThreadsAuthenticatedApiClient.prototype.getAccountMetrics = function (params) {
    return __awaiter(this, void 0, void 0, function () {
      var id, metrics, restParams;
      return __generator(this, function (_a) {
        ((id = params.id), (metrics = params.metrics), (restParams = __rest(params, ['id', 'metrics'])));
        return [
          2 /*return*/,
          this._authenticatedGet(
            '/v1.0/'.concat(id, '/threads_insights'),
            __assign({ metric: metrics === null || metrics === void 0 ? void 0 : metrics.join(',') }, restParams),
            GetAccountMetricsResponseSchema
          ),
        ];
      });
    });
  };
  return ThreadsAuthenticatedApiClient;
})(ThreadsPublicApiClient);
export { ThreadsAuthenticatedApiClient };
