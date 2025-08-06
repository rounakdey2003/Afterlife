# Link - http://afterlifeorg.netlify.app/
---
# Afterlife Website

A modern web application with YouTube integration, admin panel, and various interactive features.

## Features

- **Homepage**: Interactive landing page with modern design
- **Blog**: Dynamic blog system with content management
- **Store**: E-commerce functionality
- **Stream**: Live streaming integration
- **Tools**: Utility tools and resources
- **Notice**: Dynamic notice board system
- **Admin Panel**: Secure admin interface for content management

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **APIs**: YouTube Data API integration
- **Styling**: Custom CSS with theme toggle support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd afterlife-copy
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file and add your environment variables:
```bash
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

This project is configured for deployment on Netlify and other hosting platforms.

### Netlify Deployment

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `./`
5. Add environment variables in Netlify dashboard

## Project Structure

```
├── index.html              # Homepage
├── admin.html             # Admin dashboard
├── blog.html              # Blog page
├── store.html             # Store page
├── stream.html            # Streaming page
├── tools.html             # Tools page
├── notice.html            # Notice board
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── css/                   # Stylesheets
├── js/                    # JavaScript files
└── vercel.json           # Vercel configuration
```

## License

MIT License - see LICENSE file for details
