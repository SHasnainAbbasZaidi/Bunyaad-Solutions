import { z } from "zod";

// ─── Contact Form ─────────────────────────────────────────────────────────────

export const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().max(100).optional().or(z.literal("")),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  inquiryType: z.enum([
    "General",
    "Business Partnership",
    "Project Inquiry",
    "Technical Support",
    "Media & Press",
    "Careers",
    "Other",
  ]),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Hero Section ─────────────────────────────────────────────────────────────

export const heroSectionSchema = z.object({
  headline: z.string().min(1, "Headline is required").max(200),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  description: z.string().min(1, "Description is required").max(1000),
  ctaPrimaryText: z.string().min(1, "Primary button text is required").max(50),
  ctaPrimaryUrl: z.string().min(1, "Primary button URL is required"),
  ctaSecondaryText: z.string().max(50).optional().or(z.literal("")),
  ctaSecondaryUrl: z.string().optional().or(z.literal("")),
  backgroundImage: z.string().optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export type HeroSectionFormData = z.infer<typeof heroSectionSchema>;

// ─── About Section ────────────────────────────────────────────────────────────

export const aboutSectionSchema = z.object({
  sectionKey: z.string().min(1, "Section key is required"),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  image: z.string().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

export type AboutSectionFormData = z.infer<typeof aboutSectionSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export const serviceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  icon: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  fullContent: z.string().min(1, "Full content is required"),
  targetAudience: z.string().optional().or(z.literal("")),
  capabilities: z.string().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// ─── Project ──────────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  slug: z.string().min(1, "Slug is required"),
  logo: z.string().optional().or(z.literal("")),
  coverImage: z.string().optional().or(z.literal("")),
  description: z.string().min(1, "Description is required").max(1000),
  fullContent: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  businessModel: z.enum(["B2B", "B2C", "D2C", "HYBRID"]),
  status: z.enum([
    "CONCEPT",
    "PLANNING",
    "IN_DEVELOPMENT",
    "TESTING",
    "COMING_SOON",
    "LIVE",
    "ON_HOLD",
    "ARCHIVED",
  ]),
  externalUrl: z.string().url().optional().or(z.literal("")),
  launchDate: z.string().optional().or(z.literal("")),
  technologies: z.string().optional().or(z.literal("")),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  published: z.boolean().default(false),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ─── Team Member ──────────────────────────────────────────────────────────────

export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  photo: z.string().optional().or(z.literal("")),
  designation: z.string().min(1, "Designation is required").max(100),
  department: z.string().optional().or(z.literal("")),
  biography: z.string().optional().or(z.literal("")),
  skills: z.string().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  isFounder: z.boolean().default(false),
  isLeadership: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

// ─── Article ──────────────────────────────────────────────────────────────────

export const articleSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z.string().min(1, "Slug is required"),
  coverImage: z.string().optional().or(z.literal("")),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "Content is required"),
  category: z.enum([
    "Company Announcements",
    "Product Updates",
    "Platform Launches",
    "Technology Insights",
    "Business News",
    "Events",
    "Development Updates",
  ]),
  tags: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean().default(false),
  seoTitle: z.string().max(70).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  publishedAt: z.string().optional().or(z.literal("")),
  scheduledAt: z.string().optional().or(z.literal("")),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

// ─── User Management ──────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

// ─── Site Settings ────────────────────────────────────────────────────────────

export const siteSettingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  group: z.string().default("general"),
});

export type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;
