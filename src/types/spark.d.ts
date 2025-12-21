export {};

declare global {
  interface Window {
    spark?: {
      llm?: (prompt: string, model?: string) => Promise<any>;
    };
  }
}
