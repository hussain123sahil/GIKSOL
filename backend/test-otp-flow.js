const mongoose = require('mongoose');
const PasswordResetOTP = require('./backend/models/PasswordResetOTP');

async function testOTPFlow() {
  try {
    console.log('Testing OTP flow...');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/giksol', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test creating an OTP
    const testEmail = 'test@example.com';
    console.log('Creating OTP for:', testEmail);
    
    const passwordResetOTP = new PasswordResetOTP({ email: testEmail });
    const otp = passwordResetOTP.generateOTP();
    await passwordResetOTP.save();
    
    console.log('✅ OTP created successfully:', {
      email: passwordResetOTP.email,
      otp: passwordResetOTP.otp.code,
      expiresAt: passwordResetOTP.otp.expiresAt,
      isUsed: passwordResetOTP.isUsed
    });

    // Test finding the OTP
    console.log('Finding OTP...');
    const foundOTP = await PasswordResetOTP.findOne({ 
      email: testEmail, 
      isUsed: false,
      'otp.expiresAt': { $gt: new Date() }
    });
    
    if (foundOTP) {
      console.log('✅ OTP found successfully');
      
      // Test verifying the OTP
      console.log('Verifying OTP...');
      const verificationResult = foundOTP.verifyOTP(otp);
      console.log('✅ Verification result:', verificationResult);
      
      if (verificationResult.valid) {
        console.log('✅ OTP verification successful!');
      } else {
        console.log('❌ OTP verification failed:', verificationResult.message);
      }
    } else {
      console.log('❌ OTP not found');
    }

    // Clean up
    await PasswordResetOTP.deleteOne({ email: testEmail });
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testOTPFlow();
