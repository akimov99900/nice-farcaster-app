# nice - Daily Positive Wishes Mini-App

A Farcaster mini-app that delivers personalized daily positive wishes to users. Each user receives a deterministic wish based on their Farcaster ID and the current date, ensuring the same wish throughout the day and a different one each day.

## ✨ Features

- **Farcaster Frame SDK** - Seamless authentication and integration using the official Farcaster SDK
- **Deterministic Wishes** - Same user gets the same wish all day, different wish each day
- **FNV-1a Hash Algorithm** - Cryptographically sound wish selection
- **Voting System** - Like/Dislike functionality with Vercel KV storage
- **Vote Statistics** - Real-time vote counts and user feedback
- **Mobile-Friendly** - Responsive design optimized for mobile devices
- **One Vote Per Day** - Users can vote once per day per wish

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nice-miniapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

   Note: In development mode, the app will use a mock user (FID: 12345) since Farcaster auth requires the mini-app environment.

## 📋 Project Structure

```
/
├── app/                    # Next.js 14 app directory
│   ├── api/
│   │   └── vote/
│   │       └── route.ts    # Voting API endpoint (Vercel KV)
│   ├── page.tsx           # Main page with auth, wish display & voting
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles (including voting styles)
├── lib/
│   ├── wishes.ts          # Wishes array (25 positive messages)
│   └── hash.ts            # FNV-1a hash implementation
├── public/
│   ├── icon.svg           # App icon (smiling sun)
│   └── manifest.json      # Farcaster mini-app manifest
├── package.json           # Dependencies including @vercel/kv
├── tsconfig.json
├── next.config.js
├── vercel.json
└── README.md
```

## 🔧 Technical Implementation

### Authentication Flow

The app uses Farcaster Quick Auth to authenticate users:

1. On app load, it attempts to authenticate via Farcaster context
2. Extracts the user's Farcaster ID (FID) from the authenticated session
3. Uses the FID as the seed for deterministic wish selection

### Wish Selection Algorithm

The wish selection uses the FNV-1a hash algorithm:

1. **Input**: `${fid}-${YYYY-MM-DD}` (user's FID + current date)
2. **Process**: Apply FNV-1a hash to the input string
3. **Output**: `hash % wishes.length` (index into the wishes array)

This ensures:
- Same user gets the same wish throughout the day
- Different wish each day for each user
- No state management required
- Cryptographically sound distribution

### Wishes Collection

The app includes 25 carefully crafted positive wishes:
- Encouraging and uplifting messages
- Motivational and inspirational content
- Focus on personal growth, kindness, and positivity
- Updated regularly to maintain freshness

### Voting System

The app includes a comprehensive voting system powered by Vercel KV:

#### Storage Schema
```
nice:vote:{date}:{wishIndex}:likes      -> integer counter
nice:vote:{date}:{wishIndex}:dislikes   -> integer counter  
nice:vote:{date}:{wishIndex}:voters     -> set of FID strings
```

#### Voting Logic
- **One Vote Per Day**: Each user (FID) can vote once per day per wish
- **Real-time Updates**: Statistics update immediately after voting
- **Vote Persistence**: All votes are stored in Vercel KV for durability
- **User Feedback**: "Thank you!" message displayed after voting

#### API Endpoints
- **POST /api/vote**: Submit a vote or check voting status
- **GET /api/vote**: Get current vote statistics

#### UI Flow
1. **Initial State**: Display wish with Like/Dislike buttons and current statistics
2. **After Voting**: Show "Thank you!" message with updated statistics
3. **Revisit**: Display "Thank you!" message if already voted today

## 🌐 Vercel Deployment

### Step-by-Step Deployment Guide

1. **Prepare your repository**
   ```bash
   git add .
   git commit -m "Initial commit: nice mini-app"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "Add New..." → "Project"
   - Select your repository

3. **Configure deployment settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: . (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Enable Vercel KV** (Required for voting functionality)
    - Go to your Vercel project dashboard
    - Click "Storage" tab in the left sidebar
    - Click "Create Database" → "KV"
    - Choose a region (recommended: same as your app deployment)
    - Click "Create"
    - Vercel will automatically configure the required environment variables:
      - `KV_URL`
      - `KV_REST_API_URL`
      - `KV_REST_API_TOKEN`

5. **Environment Variables** (Optional)
     - `NEXT_PUBLIC_APP_URL`: Your deployed app URL (e.g., https://your-app.vercel.app)
       - **How to set**: Go to Vercel Dashboard → Settings → Environment Variables → Add New
       - **Purpose**: Used for metadata generation and social sharing
       - **Note**: This variable is optional! The app has built-in fallbacks and will work without it
       - **When to set**: Only if you need custom metadata for social sharing or specific URL requirements

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at a `*.vercel.app` domain

6. **Custom Domain (Optional)**
   - Go to your project settings in Vercel
   - Navigate to "Domains"
   - Add your custom domain and follow DNS instructions

### Vercel Configuration

The `vercel.json` file includes:
- Build optimization settings
- Regional deployment (Singapore region for better Asian market coverage)

## 🔗 Farcaster Mini-App Registration

### Register Your Mini-App

1. **Prepare App Information**
   - **App Name**: "nice"
   - **Description**: "A daily dose of positive wishes and inspiration"
   - **Category**: Lifestyle
   - **Icon**: Use the provided `/icon.svg`

2. **Submit to Farcaster**
   - Visit the Farcaster Mini-Apps developer portal
   - Submit your app for review
   - Provide your deployed Vercel URL
   - Upload the app icon and manifest

3. **Manifest Configuration**
   The `public/manifest.json` includes:
   - App metadata and branding
   - Icon definitions
   - Display settings for optimal Farcaster integration
   - Shortcut configurations

### Frame Metadata

The app includes proper Open Graph and Twitter Card metadata for optimal display when shared in Farcaster frames.

## 🧪 Testing

### Local Testing

```bash
# Run development server
npm run dev

# Test in different viewports
# Open browser dev tools and test mobile/responsive layouts
```

### Production Testing

1. Deploy to Vercel
2. Test the deployed URL
3. Test in Farcaster client environment
4. Verify authentication flow
5. Test wish consistency (same user, same day = same wish)
6. Test voting functionality:
   - Verify Like/Dislike buttons appear
   - Test that voting updates statistics immediately
   - Verify "Thank you!" message appears after voting
   - Test that users cannot vote again on same day
   - Check vote persistence across browser sessions

## 🔒 Security Considerations

- **Minimal Data Storage**: Only stores vote counts and FIDs in Vercel KV
- **Client-Side Hashing**: Wish selection happens on the client
- **Farcaster Auth**: Uses secure Farcaster Quick Auth protocol
- **Vote Validation**: Server-side validation prevents duplicate voting
- **No PII Storage**: Only Farcaster IDs (public identifiers) are stored

## 🎨 Design System

### Color Palette
- **Primary**: Yellow (`#FFD700`)
- **Secondary**: Orange (`#FFA500`)
- **Background**: Light yellow gradient
- **Text**: Dark gray for readability

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Bold, larger sizes
- **Body**: Regular, optimized for readability

### Components
- **Cards**: Glass morphism effect with backdrop blur
- **Buttons**: Gradient backgrounds with hover effects
- **Icons**: Custom SVG icons for consistency

## 📱 Mobile Optimization

- Responsive design using Tailwind CSS
- Touch-friendly button sizes
- Optimized viewport settings
- Fast loading times
- Progressive Web App features

## 🔄 Updates and Maintenance

### Adding New Wishes

1. Edit `lib/wishes.ts`
2. Add new wishes to the array
3. Maintain the same style and tone
4. Test hash distribution

### Updating Dependencies

```bash
npm update
npm audit fix
```

### Monitoring

- Use Vercel Analytics for performance monitoring
- Monitor error logs in Vercel dashboard
- Track user engagement through Farcaster analytics

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the Farcaster Mini-Apps documentation

---

**Made with ❤️ for the Farcaster ecosystem**