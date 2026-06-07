export interface InitializePaymentResponse {
  authorizationUrl: string;
  reference?: string;
  access_code?: string;
}
