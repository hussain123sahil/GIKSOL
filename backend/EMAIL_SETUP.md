# Email Configuration for OTP Verification

To enable OTP email verification, you need to configure email settings in your `.env` file.

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to your `.env` file**:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

Update the email service configuration in `services/emailService.js`:
```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### Yahoo Mail
```env
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

Update the email service configuration:
```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp.mail.yahoo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing Without Email

If you don't want to configure email immediately, the system will:
- Log the OTP to the console
- Still require OTP verification for registration
- Work normally for testing purposes

## Troubleshooting

1. **"Invalid login" error**: Check your app password
2. **"Connection timeout"**: Check your internet connection and firewall
3. **"Authentication failed"**: Verify your email and password are correct

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of your main account password
- Consider using a dedicated email account for your application