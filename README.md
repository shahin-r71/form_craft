# Form Craft

Form Craft is a web application built with Next.js, TypeScript, Tailwind CSS, Prisma, and Supabase. It allows users to create, share, and manage dynamic forms and surveys.

## Features

*   **Template Creation:** Design custom form templates with various field types.
*   **Public & Private Templates:** Share templates publicly or keep them private.
*   **Form Submission:** Collect responses through generated forms.
*   **User Authentication:** Secure user accounts and data using Supabase Auth.
*   **Database Management:** Uses Prisma ORM for database interactions with Supabase Postgres.
*   **Styling:** Utilizes Tailwind CSS and Shadcn UI for a modern user interface.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   pnpm (or npm/yarn)
*   Supabase account and project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd form_craft
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env.local` file in the root directory.
    *   Add your Supabase project URL and anon key:
        ```
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Add your Supabase database connection string for Prisma:
        ```
        DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres?schema=public"
        ```
        *(Replace placeholders with your actual Supabase database credentials)*

4.  **Apply database migrations:**
    *   Ensure your Supabase database is running.
    *   Run the Prisma migrations:
        ```bash
        pnpm prisma migrate dev
        ```
    *   Apply the RLS policies (ensure you have `psql` installed and configured):
        ```bash
        psql -h [YOUR-HOST] -U postgres -d postgres -f utils/supabase/sql/rls.sql
        ```
        *(You might need to adjust the command based on your `psql` setup and provide the password when prompted)*

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [Supabase Auth](https://supabase.com/auth)

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details (if applicable).
