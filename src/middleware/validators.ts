import { Request, Response, NextFunction } from 'express';

export const validateSignup = (req: Request, res: Response, next: NextFunction): void => {
  const { firstName, lastName, username, email, phoneNumber, country, currency, accountType, pin, password, confirmPassword, agreedToTerms } = req.body;

  const errors: string[] = [];

  if (!firstName || firstName.toString().trim().length < 2) errors.push('First name must be at least 2 characters');
  if (!lastName || lastName.toString().trim().length < 2) errors.push('Last name must be at least 2 characters');
  if (!username || username.toString().trim().length < 3) errors.push('Username must be at least 3 characters');
  if (!email) errors.push('Email is required');
  if (!phoneNumber) errors.push('Phone number is required');
  if (!country) errors.push('Country is required');
  if (!currency) errors.push('Currency is required');
  if (!accountType) errors.push('Account type is required');
  if (!pin) errors.push('PIN is required');
  if (!password) errors.push('Password is required');
  if (!confirmPassword) errors.push('Confirm password is required');
  if (!agreedToTerms) errors.push('You must agree to terms and services');

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation errors', errors });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  if (!password) {
    res.status(400).json({ success: false, message: 'Password is required' });
    return;
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { token, email, newPassword, confirmPassword } = req.body;

  const errors: string[] = [];

  if (!token) errors.push('Token is required');
  if (!email) errors.push('Email is required');
  if (!newPassword) errors.push('New password is required');
  if (!confirmPassword) errors.push('Confirm password is required');

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation errors', errors });
    return;
  }

  next();
};

export const validateVerifyEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { token, email } = req.body;

  if (!token) {
    res.status(400).json({ success: false, message: 'Token is required' });
    return;
  }

  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  next();
};

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token is required' });
    return;
  }

  next();
};

export const validateChangePassword = (req: Request, res: Response, next: NextFunction): void => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const errors: string[] = [];

  if (!oldPassword) errors.push('Old password is required');
  if (!newPassword) errors.push('New password is required');
  if (!confirmPassword) errors.push('Confirm password is required');

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('New passwords do not match');
  }

  if (newPassword && newPassword.length < 8) {
    errors.push('New password must be at least 8 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation errors', errors });
    return;
  }

  next();
};

export const validateContactSupport = (req: Request, res: Response, next: NextFunction): void => {
  console.log('[v0] validateContactSupport - req.body:', req.body);
  console.log('[v0] validateContactSupport - Content-Type:', req.headers['content-type']);
  
  const { topic, subject, message } = req.body || {};

  const errors: string[] = [];

  if (!topic) errors.push('Topic is required');
  if (!subject) errors.push('Subject is required');
  if (!message) errors.push('Message is required');

  const validTopics = ['Account', 'Billing & Payments', 'Transactions', 'Technical issue', 'Other'];
  if (topic && !validTopics.includes(topic)) {
    errors.push('Invalid topic. Must be one of: Account, Billing & Payments, Transactions, Technical issue, Other');
  }

  if (subject && subject.length > 150) {
    errors.push('Subject must be less than 150 characters');
  }

  if (message && message.length > 5000) {
    errors.push('Message must be less than 5000 characters');
  }

  if (message && message.length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation errors', errors });
    return;
  }

  next();
};

const BTC_ADDRESS_REGEX =
  /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{25,90})$/;

export const validateWithdrawalRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { amount, bitcoinAddress } = req.body;

  const errors: string[] = [];

  if (amount === undefined || amount === null) {
    errors.push('Amount is required');
  } else if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!bitcoinAddress || typeof bitcoinAddress !== 'string' || !bitcoinAddress.trim()) {
    errors.push('Bitcoin wallet address is required');
  } else if (!BTC_ADDRESS_REGEX.test(bitcoinAddress.trim())) {
    errors.push('Please provide a valid Bitcoin wallet address');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation errors', errors });
    return;
  }

  next();
};
