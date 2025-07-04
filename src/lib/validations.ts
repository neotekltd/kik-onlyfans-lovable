import { z } from "zod";

// User registration validation
export const registerSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(320, "Email too long"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  
  confirmPassword: z.string(),
  
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .refine(val => !val.includes(' '), "Username cannot contain spaces"),
  
  displayName: z.string()
    .min(1, "Display name is required")
    .max(100, "Display name too long")
    .regex(/^[a-zA-Z0-9\s\-_'.]+$/, "Display name contains invalid characters"),
  
  ageVerified: z.boolean().refine(val => val === true, "Age verification is required"),
  termsAccepted: z.boolean().refine(val => val === true, "Terms acceptance is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login validation
export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  
  password: z.string()
    .min(1, "Password is required"),
});

// Post creation validation
export const postSchema = z.object({
  title: z.string()
    .max(200, "Title too long")
    .optional()
    .transform(val => val?.trim() || null),
  
  description: z.string()
    .max(5000, "Description too long")
    .optional()
    .transform(val => val?.trim() || null),
  
  isPremium: z.boolean().default(false),
  isPpv: z.boolean().default(false),
  
  ppvPrice: z.string()
    .optional()
    .refine(val => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 999.99;
    }, "Invalid price format or amount too high"),
});

// Message validation
export const messageSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long")
    .transform(val => val.trim()),
  
  recipientId: z.string().uuid("Invalid recipient ID"),
  
  isPpv: z.boolean().default(false),
  
  ppvPrice: z.number()
    .min(0, "Price cannot be negative")
    .max(999.99, "Price too high")
    .optional(),
});

// Profile update validation
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(1, "Display name is required")
    .max(100, "Display name too long")
    .regex(/^[a-zA-Z0-9\s\-_'.]+$/, "Display name contains invalid characters"),
  
  bio: z.string()
    .max(500, "Bio too long")
    .optional()
    .transform(val => val?.trim() || null),
  
  location: z.string()
    .max(100, "Location too long")
    .optional()
    .transform(val => val?.trim() || null),
  
  websiteUrl: z.string()
    .url("Invalid website URL")
    .max(200, "Website URL too long")
    .optional()
    .or(z.literal("")),
  
  twitterHandle: z.string()
    .max(50, "Twitter handle too long")
    .regex(/^@?[a-zA-Z0-9_]+$/, "Invalid Twitter handle format")
    .optional()
    .transform(val => val?.replace(/^@/, "") || null),
  
  instagramHandle: z.string()
    .max(50, "Instagram handle too long")
    .regex(/^@?[a-zA-Z0-9_.]+$/, "Invalid Instagram handle format")
    .optional()
    .transform(val => val?.replace(/^@/, "") || null),
});

// Input sanitization helper
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
};

// File validation
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: "File size cannot exceed 50MB" };
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not supported" };
  }
  
  return { valid: true };
};

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PostFormData = z.infer<typeof postSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;