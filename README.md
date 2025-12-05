# Voice of UPSA

A modern news website for UPSA built with Next.js, TypeScript, Clerk authentication, Supabase database, and TailwindCSS.

## 🚀 Features

- **Authentication**: Clerk-based user authentication with role-based access (User, Editor, Admin)
- **Content Management**: Full CRUD operations for articles with draft/published/archived status
- **Comments & Reactions**: Interactive commenting system with emoji reactions
- **Media Storage**: Cloudinary integration for image uploads
- **Responsive Design**: Mobile-first design with dark/light mode support
- **Real-time Updates**: Live data fetching from Supabase database
- **Type Safety**: Full TypeScript implementation

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudinary
- **Styling**: TailwindCSS + Material UI
- **Animations**: Framer Motion
- **Icons**: React Icons + Material UI Icons
- **Deployment**: Netlify

## 🎨 Color Scheme

- **Navy Blue**: `#001F3F` (Primary)
- **Golden Yellow**: `#FFD700` (Accent)
- **Black**: `#000000` (Dark text/background)
- **White**: `#FFFFFF` (Light background/text)

## 📁 Project Structure

```
voice-of-upsa/
├── pages/                 # Next.js pages and API routes
│   ├── api/              # API endpoints
│   ├── _app.tsx          # App configuration
│   ├── _document.tsx     # Document configuration
│   ├── index.tsx         # Homepage
│   ├── sign-in.tsx       # Sign in page
│   └── sign-up.tsx       # Sign up page
├── components/           # React components
│   └── Layout.tsx        # Main layout component
├── lib/                  # Shared utilities
│   └── database.ts       # Database configuration and types
├── styles/               # CSS files
│   └── globals.css       # Global styles and TailwindCSS
├── database/             # Database schemas
│   └── schema.sql        # Supabase database schema
├── public/               # Static assets
├── middleware/           # Next.js middleware
├── .env.local           # Environment variables
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # TailwindCSS configuration
└── next.config.js       # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Clerk account and application
- Cloudinary account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd voice-of-upsa
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and update with your credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Node Environment
NODE_ENV=development
```

### 4. Database Setup

1. Open your Supabase project
2. Go to the SQL Editor
3. Run the schema from `database/schema.sql`
4. Enable Row Level Security (RLS) as defined in the schema

### 5. Clerk Configuration

1. In your Clerk dashboard, configure the webhook endpoint:
   - Endpoint URL: `https://your-domain.com/api/auth/sync-user`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Secret: Use the `CLERK_WEBHOOK_SECRET` from your environment variables

2. Configure redirect URLs in Clerk:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 User Roles

- **User**: Can view articles, create comments, and react to content
- **Editor**: Can create, edit, and manage articles
- **Admin**: Full access to all features including user management

## 📖 API Endpoints

### Articles
- `GET /api/articles` - List articles (with pagination and search)
- `POST /api/articles` - Create article (Editor/Admin only)
- `GET /api/articles/[id]` - Get single article with comments
- `PUT /api/articles/[id]` - Update article (Editor/Admin only)
- `DELETE /api/articles/[id]` - Delete article (Admin only)

### Authentication
- `POST /api/auth/sync-user` - Clerk webhook for user sync

## 🚀 Deployment

### Netlify Deployment

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add all environment variables in Netlify dashboard
5. Deploy!

### Environment Variables for Production

Make sure to add all environment variables in your deployment platform:
- Clerk keys
- Supabase URL and keys
- Cloudinary credentials
- Application URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:

1. Check the console for errors
2. Verify all environment variables are set correctly
3. Ensure Supabase RLS policies are properly configured
4. Check Clerk webhook configuration
5. Verify Cloudinary settings

## 🔄 Database Schema

The application uses the following main tables:
- `users` - User information and roles
- `articles` - Article content and metadata
- `comments` - User comments on articles
- `likes` - Article likes/unlikes
- `reactions` - Emoji reactions to articles
- `cloudinary_uploads` - Image upload metadata
- `clerk_sync` - Clerk user synchronization tracking

See `database/schema.sql` for the complete schema with RLS policies.
# voice-of-upsa
# voice-of-upsa
