const dotenv = require('dotenv');
dotenv.config();

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer not installed. Email functionality will be disabled.');
  nodemailer = null;
}

const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    if (nodemailer) {
      // Email configuration - you'll need to set these in your .env file
      console.log('Email configuration:', {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'true' || true,
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASS
      });
      
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'true' || true, // SSL
        auth: {
          user: process.env.EMAIL_USER, // Your email
          pass: process.env.EMAIL_PASS // Your app password
        }
      });
      
      // Test the connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service connection failed:', error.message);
        } else {
          console.log('✅ Email service ready to send emails');
        }
      });
    } else {
      this.transporter = null;
    }
  }

  // Generate a Google Meet link
  generateGoogleMeetLink() {
    // Create a unique session identifier for this booking
    // This ensures both student and mentor get the same meeting link
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    
    // Use Jitsi Meet for reliable video conferencing
    // This creates a persistent meeting room that both participants can join
    // Jitsi Meet links are always valid and work immediately
    return `https://meet.jit.si/session-${sessionId}`;
  }

  // Send email to student
  async sendStudentConfirmation(sessionData, studentEmail, studentName, meetLink) {
    if (!this.transporter) {
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Session Confirmed - ${sessionData.title}`,
      html: this.getStudentEmailTemplate(sessionData, studentName, meetLink),
      attachments: [
        {
          filename: 'logo_giksol2.png',
          path: path.join(__dirname, '../../frontend/public/logo_giksol2.png'),
          cid: 'giksol-logo'
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending student email:', error.message);
      throw error;
    }
  }

  // Send email to mentor
  async sendMentorNotification(sessionData, mentorEmail, mentorName, meetLink) {
    if (!this.transporter) {
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: mentorEmail,
      subject: `New Session Booking - ${sessionData.title}`,
      html: this.getMentorEmailTemplate(sessionData, mentorName, meetLink),
      attachments: [
        {
          filename: 'logo_giksol2.png',
          path: path.join(__dirname, '../../frontend/public/logo_giksol2.png'),
          cid: 'giksol-logo'
        }
      ]
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending mentor email:', error.message);
      throw error;
    }
  }

  // Send OTP verification email
  async sendOTPVerification(email, firstName, otp, role) {
    console.log('Sending OTP verification email to:', email);
    console.log('OTP Code:', otp);
    
    if (!this.transporter) {
      console.log('⚠️ Email service not available. OTP for verification:', otp);
      console.log('⚠️ Please configure EMAIL_USER and EMAIL_PASS in .env file');
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Verify Your ${role === 'mentor' ? 'Mentor' : 'Student'} Account - GikSol`,
      html: this.getOTPEmailTemplate(firstName, otp, role)
    };

    try {
      console.log('📧 Attempting to send email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP verification email sent successfully to:', email);
      console.log('📧 Email result:', {
        messageId: result.messageId,
        response: result.response
      });
    } catch (error) {
      console.error('❌ Error sending OTP email:', error.message);
      console.error('❌ Full error:', error);
      console.log('⚠️ OTP for manual verification:', otp);
      // Don't throw error, just log it so registration can continue
    }
  }

  // Send password reset OTP email
  async sendPasswordResetOTP(email, firstName, otp) {
    console.log('Sending password reset OTP email to:', email);
    console.log('OTP Code:', otp);
    
    if (!this.transporter) {
      console.log('⚠️ Email service not available. Password reset OTP:', otp);
      console.log('⚠️ Please configure EMAIL_USER and EMAIL_PASS in .env file');
      return;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset - GikSol',
      html: this.getPasswordResetOTPEmailTemplate(firstName, otp)
    };

    try {
      console.log('📧 Attempting to send password reset email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully to:', email);
      console.log('📧 Email result:', {
        messageId: result.messageId,
        response: result.response
      });
    } catch (error) {
      console.error('❌ Error sending password reset OTP email:', error.message);
      console.error('❌ Full error:', error);
      console.log('⚠️ Password reset OTP for manual verification:', otp);
      // Don't throw error, just log it so password reset can continue
    }
  }

  // Student email template
  getStudentEmailTemplate(sessionData, studentName, meetLink) {
    const sessionDate = new Date(sessionData.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const sessionTime = new Date(sessionData.scheduledDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Session Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .meet-button { background: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .session-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4285f4; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Session Confirmed!</h1>
                <p>Your mentoring session has been successfully booked</p>
            </div>
            
            <div class="content">
                <h2>Hello ${studentName}!</h2>
                <p>Great news! Your mentoring session has been confirmed. Here are the details:</p>
                
                <div class="session-details">
                    <h3>📅 Session Details</h3>
                    <p><strong>Title:</strong> ${sessionData.title}</p>
                    <p><strong>Date:</strong> ${sessionDate}</p>
                    <p><strong>Time:</strong> ${sessionTime}</p>
                    <p><strong>Duration:</strong> ${sessionData.duration} minutes</p>
                    <p><strong>Type:</strong> ${sessionData.sessionType}</p>
                    ${sessionData.description ? `<p><strong>Description:</strong> ${sessionData.description}</p>` : ''}
                </div>

                <div style="text-align: center;">
                    <a href="${meetLink}" class="meet-button">🔗 Join Video Session</a>
                </div>

                <div class="session-details">
                    <h3>📝 Important Notes</h3>
                    <ul>
                        <li>Please join the meeting 5 minutes before the scheduled time</li>
                        <li>Ensure you have a stable internet connection</li>
                        <li>Test your camera and microphone beforehand</li>
                        <li>If you need to reschedule, please contact your mentor directly</li>
                    </ul>
                </div>

                <p>We're excited to see you in your mentoring session! If you have any questions, feel free to reach out.</p>
                
                <div style="text-align: left; margin: 10px 0 0px 0;">
                    <img src="cid:giksol-logo" alt="GikSol Logo" style="width: 60px; height: 60px; object-fit: contain;">
                </div>
                
                <p>Best regards,<br>Team GikSol</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Mentor email template
  getMentorEmailTemplate(sessionData, mentorName, meetLink) {
    const sessionDate = new Date(sessionData.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const sessionTime = new Date(sessionData.scheduledDate).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Session Booking</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .meet-button { background: #4285f4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .session-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 New Session Booking!</h1>
                <p>A student has booked a mentoring session with you</p>
            </div>
            
            <div class="content">
                <h2>Hello ${mentorName}!</h2>
                <p>You have received a new session booking. Here are the details:</p>
                
                <div class="session-details">
                    <h3>📅 Session Details</h3>
                    <p><strong>Title:</strong> ${sessionData.title}</p>
                    <p><strong>Date:</strong> ${sessionDate}</p>
                    <p><strong>Time:</strong> ${sessionTime}</p>
                    <p><strong>Duration:</strong> ${sessionData.duration} minutes</p>
                    <p><strong>Type:</strong> ${sessionData.sessionType}</p>
                    ${sessionData.description ? `<p><strong>Description:</strong> ${sessionData.description}</p>` : ''}
                </div>

                <div style="text-align: center;">
                    <a href="${meetLink}" class="meet-button">🔗 Join Video Session</a>
                </div>

                <div class="session-details">
                    <h3>📝 Preparation Tips</h3>
                    <ul>
                        <li>Review the session description and student's notes</li>
                        <li>Prepare any materials or resources you want to share</li>
                        <li>Test your camera and microphone before the session</li>
                        <li>Join the meeting 5 minutes early to ensure everything is working</li>
                    </ul>
                </div>

                <p>Thank you for being an amazing mentor! If you need to reschedule, please contact the student directly.</p>
                
                <div style="text-align: left; margin: 10px 0 0px 0;">
                    <img src="cid:giksol-logo" alt="GikSol Logo" style="width: 60px; height: 60px; object-fit: contain;">
                </div>
                
                <p>Best regards,<br>Team GikSol</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // OTP verification email template
  getOTPEmailTemplate(firstName, otp, role) {
    const roleText = role === 'mentor' ? 'Mentor' : 'Student';
    const roleIcon = role === 'mentor' ? '👨‍🏫' : '🎓';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: #4285f4; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4285f4; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${roleIcon} Welcome to GikSol!</h1>
                <p>Verify your ${roleText} account to get started</p>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                <p>Thank you for registering as a ${roleText} on GikSol. To complete your registration, please verify your email address using the OTP code below:</p>
                
                <div class="otp-code">
                    ${otp}
                </div>
                
                <div class="info-box">
                    <h3>📝 Important Information</h3>
                    <ul>
                        <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                        <li>You have <strong>3 attempts</strong> to enter the correct OTP</li>
                        <li>If you don't verify within 10 minutes, you'll need to request a new OTP</li>
                        <li>Keep this code secure and don't share it with anyone</li>
                    </ul>
                </div>

                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> If you didn't create an account with GikSol, please ignore this email. Your account will not be activated without verification.
                </div>

                <p>Once verified, you'll be able to:</p>
                <ul>
                    ${role === 'mentor' ? 
                      '<li>Create your mentor profile and showcase your expertise</li><li>Set your availability and hourly rates</li><li>Connect with students and start mentoring</li><li>Earn money by sharing your knowledge</li>' :
                      '<li>Browse and connect with expert mentors</li><li>Book learning sessions</li><li>Track your learning progress</li><li>Access exclusive learning resources</li>'
                    }
                </ul>
                
                <p>If you have any questions, feel free to contact our support team.</p>
                
                <p>Best regards,<br>The GikSol Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>© 2024 GikSol. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Password reset OTP email template
  getPasswordResetOTPEmailTemplate(firstName, otp) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - GikSol</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-code { background: #f5576c; color: white; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; }
            .info-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .security-notice { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Reset your GikSol account password</p>
            </div>
            
            <div class="content">
                <h2>Hello ${firstName}!</h2>
                <p>We received a request to reset your password for your GikSol account. To proceed with the password reset, please use the OTP code below:</p>
                
                <div class="otp-code">
                    ${otp}
                </div>
                
                <div class="info-box">
                    <h3>📝 Important Information</h3>
                    <ul>
                        <li>This OTP is valid for <strong>10 minutes</strong> only</li>
                        <li>You have <strong>3 attempts</strong> to enter the correct OTP</li>
                        <li>If you don't use this OTP within 10 minutes, you'll need to request a new one</li>
                        <li>Keep this code secure and don't share it with anyone</li>
                        <li>After entering the OTP, you'll be able to set a new password</li>
                    </ul>
                </div>

                <div class="security-notice">
                    <strong>🔒 Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged. If you're concerned about your account security, please contact our support team immediately.
                </div>

                <div class="warning">
                    <strong>⚠️ Important:</strong> Never share this OTP with anyone. GikSol will never ask for your password or OTP via email, phone, or any other method.
                </div>

                <p>If you have any questions or need assistance, feel free to contact our support team.</p>
                
                <p>Best regards,<br>The GikSol Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>© 2024 GikSol. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
