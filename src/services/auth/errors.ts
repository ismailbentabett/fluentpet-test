export class AuthenticationError extends Error {
  constructor(
    public code: string,
    message: string,
    public technical?: unknown
  ) {
    super(message);
    this.name = "AuthenticationError";
  }

  static fromFirebaseError(error: any): AuthenticationError {
    const message = getAuthErrorMessage(error.code);
    return new AuthenticationError(error.code, message, error);
  }
}

const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use": "Email already in use",
    "auth/invalid-credential": "Invalid email or password",
    "auth/weak-password": "Password should be at least 6 characters",
    "auth/invalid-email": "Invalid email address",
    "auth/network-request-failed":
      "Network error occurred. Please check your connection",
    "auth/too-many-requests": "Too many attempts. Please try again later",
    "auth/user-disabled": "This account has been disabled",
  };

  return errorMessages[errorCode] ?? "An error occurred during authentication";
};