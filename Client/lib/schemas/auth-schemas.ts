import { z } from "zod";

/**
 * Zod schema for login form validation.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Adjust min length based on backend rules if needed
});

/**
 * Zod schema for sign-up form validation (client-side including confirmation).
 */
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }), // Add firstName validation
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }), // Add lastName validation
    email: z.string().email({ message: "Invalid email address." }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." }), // Adjust min length based on backend rules
    confirmPassword: z.string().min(6, {
      message: "Confirm password is required.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Set the error path to the confirmPassword field
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
