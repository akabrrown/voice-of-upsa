import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});

const COMMON_DISPOSABLE_PATTERNS = [
  /temp.*mail/i,
  /dispos.*mail/i,
  /throw.*away.*mail/i,
  /fake.*inbox/i,
  /trash.*mail/i,
  /sharklasers/i,
  /guerrilla.*mail/i,
  /10.*minute.*mail/i,
  /10minutemail/i,
  /yopmail/i,
  /mailinator/i,
  /burnermail/i,
  /inboxkitten/i,
  /mohmal/i,
  /generator.*email/i,
  /dispostable/i,
  /getairmail/i,
  /crazymailing/i,
  /emailondeck/i,
  /fakemail/i,
  /mytemp/i,
];

export function isCommonDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return COMMON_DISPOSABLE_PATTERNS.some((pattern) => pattern.test(domain));
}

export const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .refine((email) => !isCommonDisposableEmail(email), {
      message: "Disposable and temporary email addresses are not permitted. Please use a permanent email address.",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
