# Email Setup Guide for Password Reset

## Quick Setup

1. **Create a `.env` file** in the `backend` directory (if it doesn't exist)

2. **Add these lines to your `.env` file:**
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=your-app-password-here
EMAIL_FROM=noreply@wildlifeapp.com
```

## Gmail Setup Steps

### Step 1: Enable 2-Step Verification
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security**
3. Enable **2-Step Verification** if not already enabled

### Step 2: Create App Password
1. Still in Security settings, scroll to **2-Step Verification**
2. Click on **App passwords**
3. Select **Mail** as the app and **Other (Custom name)** as device
4. Enter a name like "Wildlife App"
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Add to .env
Replace in your `.env` file:
- `SMTP_USER` with your Gmail address
- `SMTP_PASS` with the app password (remove spaces: `abcdefghijklmnop`)

## Alternative: Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## After Setup

1. **Restart your backend server** (stop and start again)
2. **Test the forgot password flow**
3. **Check your backend console** - you should see:
   - `✅ Password reset email sent successfully to user@email.com`

## Troubleshooting

### "Email credentials not configured"
- Make sure `.env` file exists in `backend` folder
- Check that `SMTP_USER` and `SMTP_PASS` are set
- Restart the server after adding/updating `.env`

### "Error sending email"
- Verify your Gmail app password is correct (no spaces)
- Make sure 2-Step Verification is enabled
- Check that your email in `SMTP_USER` matches the account with the app password

### Email goes to spam
- This is normal for automated emails
- Check your spam/junk folder
- The email will come from the address in `EMAIL_FROM`

