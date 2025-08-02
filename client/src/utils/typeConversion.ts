// Utility functions to convert database null types to undefined for better TypeScript handling

export const convertNullToUndefined = <T>(value: T | null): T | undefined => {
  return value === null ? undefined : value;
};

export const convertDatabaseString = (value: string | null): string | undefined => {
  return value === null ? undefined : value;
};

export const convertDatabaseBoolean = (value: boolean | null, defaultValue: boolean = false): boolean => {
  return value === null ? defaultValue : value;
};

export const convertDatabaseNumber = (value: number | null, defaultValue: number = 0): number => {
  return value === null ? defaultValue : value;
};

export const convertDatabaseArray = <T>(value: T[] | null): T[] => {
  return value === null ? [] : value;
};

// Type conversion for notifications
export interface Notification {
  id: string;
  title: string;
  message?: string;
  type: string;
  user_id?: string;
  is_read: boolean;
  created_at?: string;
  data?: any;
}

export const convertDbNotificationToNotification = (dbNotification: any): Notification => ({
  id: dbNotification.id,
  title: dbNotification.title,
  message: convertNullToUndefined(dbNotification.message),
  type: dbNotification.type,
  user_id: convertNullToUndefined(dbNotification.user_id),
  is_read: convertDatabaseBoolean(dbNotification.is_read),
  created_at: convertNullToUndefined(dbNotification.created_at),
  data: dbNotification.data
});

// Message type enum
export type MessageType = 'text' | 'media' | 'ppv';

export const convertToMessageType = (type: string): MessageType => {
  switch (type) {
    case 'text':
    case 'media': 
    case 'ppv':
      return type as MessageType;
    case 'video':
    case 'image':
    case 'file':
      return 'media';
    default:
      return 'text';
  }
};