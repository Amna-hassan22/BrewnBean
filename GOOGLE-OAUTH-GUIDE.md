# Google OAuth Integration Guide for Brew&Bean

## Overview

This guide explains how to implement Google OAuth for your Brew&Bean coffee shop website, allowing users to sign up and log in with their Google accounts.

## Demo Implementation Status

I've added a demo implementation of Google Sign-In to both the registration and login pages. This demo simulates the Google OAuth flow but does not actually connect to Google servers. To fully implement Google OAuth, you'll need to:

1. Create a Google Cloud Project
2. Configure OAuth credentials
3. Implement the actual Google OAuth flow
4. Handle backend authentication with Google tokens

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Configure the consent screen (External type recommended for public sites)
5. Fill in the required fields (App name, user support email, developer contact)
6. Add scopes (at minimum: `profile` and `email`)
7. Add test users if needed

## Step 2: Create OAuth Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the Application type
4. Add a name for your client (e.g., "Brew&Bean Web Client")
5. Add authorized JavaScript origins:
   - `http://localhost:5500` (for local development)
   - `https://your-vercel-app.vercel.app` (for production)
6. Add authorized redirect URIs:
   - `http://localhost:5500/login.html`
   - `http://localhost:5500/register.html`
   - `https://your-vercel-app.vercel.app/login.html`
   - `https://your-vercel-app.vercel.app/register.html`
7. Click "Create"
8. Note your Client ID and Client Secret

## Step 3: Implement Google Sign-In

Replace the demo implementation with actual Google Sign-In code:

### 1. Include the Google Sign-In Script

Add this to the `<head>` section of both login.html and register.html:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### 2. Update the Google Sign-In Configuration

Replace YOUR_GOOGLE_CLIENT_ID with the Client ID you obtained from Google Cloud Console:

```javascript
// Google Sign-In Configuration
window.googleSignInConfig = {
  client_id: "YOUR_GOOGLE_CLIENT_ID",
  auto_select: false,
  callback: handleGoogleSignIn,
};
```

### 3. Implement Real Google Sign-In Button

Replace the demo button with the real Google Sign-In button:

```javascript
function initGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: window.googleSignInConfig.client_id,
    callback: handleGoogleSignIn,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignInButton"),
    {
      theme: "outline",
      size: "large",
      width: 320,
      shape: "rectangular",
      text: "continue_with",
    }
  );

  // Also display the One Tap UI
  google.accounts.id.prompt();
}
```

### 4. Update Your HTML Button

```html
<div id="googleSignInButton"></div>
```

### 5. Update the handleGoogleSignIn Function

```javascript
function handleGoogleSignIn(response) {
  // Get the ID token from the response
  const idToken = response.credential;

  // Send the ID token to your backend for verification
  // For this demo, we'll decode it client-side
  const base64Url = idToken.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  const user = JSON.parse(jsonPayload);

  // Now handle the user info
  const userData = {
    name: user.name,
    email: user.email,
    picture: user.picture,
    googleId: user.sub,
  };

  // Continue with your existing logic...
}
```

## Step 4: Backend Implementation

To fully implement Google Sign-In, you'll need to verify the Google token on your backend:

### 1. Create a Backend Endpoint

In your bnbweb-backend project, create an endpoint to handle Google authentication:

```javascript
// routes/authRoutes.js
router.post(
  "/google-auth",
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    // Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Check if user exists
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        name: payload.name,
        email: payload.email,
        password: crypto.randomBytes(16).toString("hex"), // Random password
        isVerified: true, // Google accounts are already verified
        provider: "google",
        googleId: payload.sub,
      });

      await user.save();
    } else {
      // Update existing user with Google info if not already set
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.provider = user.provider || "google";
        await user.save();
      }
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider,
        },
      },
    });
  })
);
```

### 2. Install Required Packages

```bash
npm install google-auth-library --save
```

### 3. Configure Google Auth Client

```javascript
// controllers/authController.js
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
```

## Step 5: Update Environment Variables

Add the following to your .env file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Testing

1. Start your backend server
2. Open your application in a browser
3. Click "Sign in with Google" on the login page
4. Verify that the authentication flow works correctly
5. Check that user data is saved properly in your database

## Troubleshooting

- **Popup Blocked**: If the Google sign-in popup is blocked, ensure you're calling the Google sign-in function directly from a user action
- **Invalid Client ID**: Double-check your Client ID and make sure it matches in both frontend and backend
- **CORS Issues**: Ensure your authorized JavaScript origins are correctly set in Google Cloud Console
- **Token Verification Failed**: Check that your backend is using the correct Client ID for verification

## Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Verify Google ID Tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

---

This implementation enhances user experience by:

1. Providing a streamlined registration/login process
2. Reducing friction in the sign-up flow
3. Increasing trust with a familiar authentication method
4. Improving security by leveraging Google's authentication

Remember to replace all placeholder values with your actual Google Cloud project credentials before deploying to production.
