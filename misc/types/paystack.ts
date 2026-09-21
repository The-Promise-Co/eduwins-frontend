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
  course_id?: string;
  booking_id?: string;
  user_id?: string;
  enrolled?: boolean;
  alreadyEnrolled?: boolean;
  enrollment?: Record<string, unknown> | null;
}

export interface InitializeBookingPaymentPayload {
  email: string;
  amount: number;
  booking_id: string;
  callback_url?: string;
}
