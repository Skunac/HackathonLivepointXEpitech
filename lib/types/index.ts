export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    metadata?: {
      confidence?: number;
      isRedirection?: boolean;
      redirectUrl?: string;
      documentationLinks?: string[];
      isGreetingResponse?: boolean;
      isManPage?: boolean;
      isRepetitionWarning?: boolean;
    };
  }
  
  export interface FormattedResponse {
    content: string;
    confidence?: number;
    redirections?: {
      type: 'google' | 'letmegooglethat' | 'documentation' | 'history';
      url?: string;
      message?: string;
    }[];
  }