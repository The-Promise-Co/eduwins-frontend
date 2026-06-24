export interface InitializePaymentResponse {
  authorizationUrl: string;
  authorization_url?: string;
  reference?: string;
  access_code?: string;
}

export interface InitializeCoursePaymentPayload {
  email: string;
  amount: number;
  course_id: string;
  callback_url?: string;
}

export interface VerifyPaymentResponse {
  status: string;
  reference: string;
  course_id?: string;
  user_id?: string;
  enrolled?: boolean;
  alreadyEnrolled?: boolean;
  metadata?: Record<string, unknown>;
}
