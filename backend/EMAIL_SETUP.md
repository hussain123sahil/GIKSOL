# Email Configuration Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASSWORD`

## Alternative Email Services

You can also use other email services by modifying the transporter configuration in `services/emailService.js`:

### Outlook/Hotmail
```javascript
this.transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### Yahoo
```javascript
this.transporter = nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Testing

After setup, test the email functionality by creating a session booking. Both student and mentor should receive emails with Google Meet links.

## Troubleshooting

- Ensure your email credentials are correct
- Check that 2FA is enabled for Gmail
- Verify the app password is correct
- Check firewall/antivirus settings that might block SMTP
