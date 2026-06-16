declare module 'africastalking' {
  interface AfricasTalkingConfig {
    apiKey: string;
    username: string;
  }

  interface SmsService {
    send(opts: { to: string[]; message: string; from?: string }): Promise<unknown>;
  }

  interface AfricasTalkingClient {
    SMS: SmsService;
  }

  function AfricasTalking(config: AfricasTalkingConfig): AfricasTalkingClient;
  export = AfricasTalking;
}
