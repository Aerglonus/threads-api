import axios from 'axios';
import { Extensions, Thread, ThreadsUser } from './threads-types';

export type GetUserProfileResponse = {
  data: {
    userData: {
      user: ThreadsUser;
    };
  };
  extensions: Extensions;
};

export type GetUserProfileThreadsResponse = {
  data: {
    mediaData?: {
      threads: Thread[];
    };
  };
  extensions: Extensions;
};

export type GetUserProfileRepliesResponse = {
  data: {
    mediaData?: {
      threads: Thread[];
    };
  };
  extensions: Extensions;
};

export type GetUserProfileThreadResponse = {
  data: {
    data: {
      containing_thread: Thread;
      reply_threads?: Thread[];
    };
  };
  extensions: Extensions;
};

export type GetThreadLikersResponse = {
  data: {
    likers: {
      users: ThreadsUser[];
    };
  };
  extensions: Extensions;
};

type HTTPAgentType = typeof import('http').Agent;
export type ThreadsAPIOptions = {
  fbLSDToken?: string;
  verbose?: boolean;
  httpAgent?: HTTPAgentType;
};

export const DEFAULT_LSD_TOKEN = 'NjppQDEgONsU_1LCzrmp6q';

export class ThreadsAPI {
  fbLSDToken: string = DEFAULT_LSD_TOKEN;
  verbose: boolean = false;
  httpAgent?: HTTPAgentType;

  constructor(options?: ThreadsAPIOptions) {
    if (options?.fbLSDToken) {
      this.fbLSDToken = options.fbLSDToken;
    }
    this.verbose = options?.verbose || false;
    this.httpAgent = options?.httpAgent;
  }

  _getDefaultHeaders = (username?: string) => ({
    authority: 'www.threads.net',
    accept: '*/*',
    'accept-language': 'ko',
    'cache-control': 'no-cache',
    origin: 'https://www.threads.net',
    pragma: 'no-cache',
    ...(!!username ? { referer: `https://www.threads.net/@${username}` } : undefined),
    'x-asbd-id': '129477',
    'x-fb-lsd': this.fbLSDToken,
    'x-ig-app-id': '238260118697367',
  });

  getUserIDfromUsername = async (
    username: string,
    options?: { noUpdateLSD?: boolean, proxy?: { host: string, port: number } },
  ): Promise<string | undefined> => {
    const res = await axios.get(`https://www.threads.net/@${username}`, {
      proxy: options?.proxy,
      httpAgent: this.httpAgent,
      headers: {
        ...this._getDefaultHeaders(username),
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'ko,en;q=0.9,ko-KR;q=0.8,ja;q=0.7',
        pragma: 'no-cache',
        referer: 'https://www.instagram.com/',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': `navigate`,
        'sec-fetch-site': `cross-site`,
        'sec-fetch-user': `?1`,
        'upgrade-insecure-requests': `1`,
        'x-asbd-id': undefined,
        'x-fb-lsd': undefined,
        'x-ig-app-id': undefined,
      },
    });

    // let text: string = (await res.text())
    let text: string = res.data;
    // remove ALL whitespaces from text
    text = text.replace(/\s/g, '');
    // remove all newlines from text
    text = text.replace(/\n/g, '');

    const userID: string | undefined = text.match(/"props":{"user_id":"(\d+)"},/)?.[1];
    const lsdToken: string | undefined = text.match(/"LSD",\[\],{"token":"(\w+)"},\d+\]/)?.[1];

    if (!options?.noUpdateLSD && !!lsdToken) {
      this.fbLSDToken = lsdToken;
      if (this.verbose) {
        console.debug('[fbLSDToken] UPDATED', this.fbLSDToken);
      }
    }

    return userID;
  };

  getUserProfile = async (username: string, userId: string, options?: {
    proxy?: { host: string, port: number },
  }) => {
    if (this.verbose) {
      console.debug('[fbLSDToken] USING', this.fbLSDToken);
    }
    const res = await axios.post<GetUserProfileResponse>(
      'https://www.threads.net/api/graphql',
      new URLSearchParams({
        lsd: this.fbLSDToken,
        variables: `{"userID":"${userId}"}`,
        doc_id: '23996318473300828',
      }),
      {
        httpAgent: this.httpAgent,
        proxy: options?.proxy,
        headers: {
          ...this._getDefaultHeaders(username),
          'x-fb-friendly-name': 'BarcelonaProfileRootQuery',
        },
      },
    );

    const user = res.data.data.userData.user;
    return user;
  };

  getUserProfileThreads = async (username: string, userId: string, options?: {
    proxy?: { host: string, port: number },
  }) => {
    if (this.verbose) {
      console.debug('[fbLSDToken] USING', this.fbLSDToken);
    }
    const res = await axios.post<GetUserProfileThreadsResponse>(
      'https://www.threads.net/api/graphql',
      new URLSearchParams({
        lsd: this.fbLSDToken,
        variables: `{"userID":"${userId}"}`,
        doc_id: '6232751443445612',
      }),
      {
        httpAgent: this.httpAgent,
        proxy: options?.proxy,
        headers: {
          ...this._getDefaultHeaders(username),
          'x-fb-friendly-name': 'BarcelonaProfileThreadsTabQuery',
        },
      },
    );

    const threads = res.data.data?.mediaData?.threads || [];
    return threads;
  };

  getUserProfileReplies = async (username: string, userId: string, options?: {
    proxy?: { host: string, port: number },
  }) => {
    if (this.verbose) {
      console.debug('[fbLSDToken] USING', this.fbLSDToken);
    }
    const res = await axios.post<GetUserProfileThreadsResponse>(
      'https://www.threads.net/api/graphql',
      new URLSearchParams({
        lsd: this.fbLSDToken,
        variables: `{"userID":"${userId}"}`,
        doc_id: '6307072669391286',
      }),
      {
        httpAgent: this.httpAgent,
        proxy: options?.proxy,
        headers: {
          ...this._getDefaultHeaders(username),
          'x-fb-friendly-name': 'BarcelonaProfileRepliesTabQuery',
        },
      },
    );

    const threads = res.data.data?.mediaData?.threads || [];
    return threads;
  };

  getPostIDfromURL = async (
    postURL: string,
    options?: { noUpdateLSD?: boolean, proxy?: { host: string, port: number } },
  ): Promise<string | undefined> => {
    const res = await axios.get(postURL, {
      proxy: options?.proxy,
      httpAgent: this.httpAgent,
    });

    let text: string = res.data;
    text = text.replace(/\s/g, '');
    text = text.replace(/\n/g, '');

    const postID: string | undefined = text.match(/{"post_id":"(.*?)"}/)?.[1];
    const lsdToken: string | undefined = text.match(/"LSD",\[\],{"token":"(\w+)"},\d+\]/)?.[1];

    if (!options?.noUpdateLSD && !!lsdToken) {
      this.fbLSDToken = lsdToken;
      if (this.verbose) {
        console.debug('[fbLSDToken] UPDATED', this.fbLSDToken);
      }
    }

    return postID;
  };

  getThreads = async (postID: string, options?: { proxy?: { host: string, port: number } }) => {
    if (this.verbose) {
      console.debug('[fbLSDToken] USING', this.fbLSDToken);
    }
    const res = await axios.post<GetUserProfileThreadResponse>(
      'https://www.threads.net/api/graphql',
      new URLSearchParams({
        lsd: this.fbLSDToken,
        variables: `{"postID":"${postID}"}`,
        doc_id: '5587632691339264',
      }),
      {
        httpAgent: this.httpAgent,
        proxy: options?.proxy,
        headers: {
          ...this._getDefaultHeaders(),
          'x-fb-friendly-name': 'BarcelonaPostPageQuery',
        },
      },
    );
    const thread = res.data.data.data;
    return thread;
  };

  getThreadLikers = async (postID: string, options?: { proxy?: { host: string, port: number } }) => {
    if (this.verbose) {
      console.debug('[fbLSDToken] USING', this.fbLSDToken);
    }
    const res = await axios.post<GetThreadLikersResponse>(
      'https://www.threads.net/api/graphql',
      new URLSearchParams({
        lsd: this.fbLSDToken,
        variables: `{"mediaID":"${postID}"}`,
        doc_id: '9360915773983802',
      }),
      {
        httpAgent: this.httpAgent,
        proxy: options?.proxy,
        headers: {
          ...this._getDefaultHeaders(),
        },
      },
    );
    const likers = res.data.data.likers;
    return likers;
  };
}
