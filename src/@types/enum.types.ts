export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum RequestUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RequestStatus {
  PENDING = 'Pending',
  FULFILLED = 'Fulfilled',
  CANCELLED = 'Cancelled',
}

export enum UserRole {
  DONOR = 'donor',
  REQUESTER = 'requester',
  ADMIN = 'admin',
}

export enum NotificationType {
  NEW_REQUEST = "new_request",
  REQUEST_FULFILLED = "request_fulfilled",
  REQUEST_CANCELLED = "request_cancelled",
}