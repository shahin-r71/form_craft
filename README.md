# FormCraft

FormCraft is a comprehensive form management system built with Next.js, TypeScript, and Supabase. It allows users to create, share, and manage dynamic forms and surveys with a modern, responsive interface.

## Features

### Form Management

- **Template Creation:** Design custom form templates with various field types (STRING, TEXT, INTEGER, CHECKBOX)
- **Public & Private Templates:** Share templates publicly or keep them private
- **Template Gallery:** Browse and use existing templates
- **Topic Categorization:** Organize templates by topics
- **Tagging System:** Add tags to templates for better organization and searchability

### User Interaction

- **Form Submission:** Collect and manage responses through generated forms
- **Comments & Likes:** Engage with templates through comments and likes
- **Access Control:** Grant specific users access to private templates

### User Management

- **Authentication:** Secure user accounts using Supabase Auth
- **User Profiles:** Manage user information and avatars
- **Admin Panel:** Administrative tools for user management (block/unblock, admin privileges)

### UI/UX

- **Responsive Design:** Works on desktop and mobile devices
- **Dark/Light Mode:** Support for different themes
- **Internationalization:** Multi-language support (English, Bengali)

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (v15)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [Supabase Auth](https://supabase.com/auth)
- **Form Validation:** [Zod](https://github.com/colinhacks/zod), [React Hook Form](https://react-hook-form.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Tables:** [TanStack Table](https://tanstack.com/table/)
- **Image Storage:** [Cloudinary](https://cloudinary.com/)

## Project Structure

```
form_craft/
├── app/                  # Next.js app directory
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # User dashboard
│   └── templates/       # Form templates
├── components/          # Reusable components
│   ├── auth/            # Authentication components
│   ├── core/            # Core application components
│   ├── templates/       # Template-related components
│   └── ui/              # UI components
├── lib/                 # Utility functions
│   └── validations/     # Zod validation schemas
├── prisma/              # Prisma schema and migrations
├── public/              # Static assets
├── utils/               # Utility functions
│   └── supabase/        # Supabase client utilities
└── i18n/                # Internationalization
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- pnpm (or npm/yarn)
- Supabase account and project

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/shahin-r71/form_craft
   cd form_craft
   ```
2. **Install dependencies:**

   ```bash
   pnpm install
   ```
3. **Set up environment variables:**

   - Create a `.env.local` file in the root directory.
   - Add your Supabase project URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     SUPABASE_ROLE_KEY=YOUR_SUPABASE_ROLE-KEY
     ```
   - Add your Supabase database connection string for Prisma:
     ```
     DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres?schema=public"
     DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres?schema=public"


     *(Replace placeholders with your actual Supabase database credentials)*
     ```
   - Add your Cloudinary credentials:
     ```
     NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
     NEXT_PUBLIC_CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
     CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
     NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=YOUR_CLOUDINARY_UPLOAD_PRESET

     ```
4. **Apply database migrations:**

   - Ensure your Supabase database is running.
   - Run the Prisma migrations:

     ```bash
     pnpm prisma migrate dev
     ```
   - Apply the RLS policies (ensure you have `psql` installed and configured):

     ```bash
     psql -h [YOUR-HOST] -U postgres -d postgres -f utils/supabase/sql/rls.sql
     ```

     *(You might need to adjust the command based on your `psql` setup and provide the password when prompted)*

     or you can copy the rls policies and user management policies from utils/supabase folder and manually run then on your supabase project.
5. **Run the development server:**

   ```bash
   pnpm dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses a PostgreSQL database with the following main models:

- **User:** User accounts and profiles
- **Template:** Form templates with fields, tags, and access controls
- **TemplateField:** Fields within templates (various types)
- **Submission:** User submissions for templates
- **FieldSubmission:** Individual field values in submissions
- **Comment:** User comments on templates
- **Like:** User likes on templates
- **Topic:** Categories for templates
- **Tag:** Tags for templates

## API Routes

The application provides RESTful API endpoints for:

- **Templates:** CRUD operations for templates and fields
- **Submissions:** Create and retrieve form submissions
- **Users:** User profile management
- **Admin:** User management for administrators
- **Comments:** Add and retrieve comments on templates
- **Likes:** Like/unlike templates
- **Tags:** Manage template tags
- **Topics:** Retrieve available topics

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
