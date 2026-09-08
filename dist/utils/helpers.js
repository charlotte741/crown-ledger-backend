"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneUtils = exports.UsernameUtils = exports.EmailUtils = exports.PinUtils = exports.PasswordUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class PasswordUtils {
    static async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    static async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    static validatePassword(password) {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
        }
        return { isValid: true };
    }
}
exports.PasswordUtils = PasswordUtils;
class PinUtils {
    static validatePin(pin) {
        const cleanPin = pin.replace(/\s/g, '');
        if (cleanPin.length !== 4) {
            return { isValid: false, message: 'PIN must be exactly 4 digits' };
        }
        if (!/^\d+$/.test(cleanPin)) {
            return { isValid: false, message: 'PIN must contain only digits' };
        }
        //Check for sequential numbers (1234, 4567, etc)
        if (this.isSequential(cleanPin)) {
            return { isValid: false, message: 'PIN cannot be sequential numbers' };
        }
        //check for repeating numbers (1111, 2222, etc)
        if (this.isRepeating(cleanPin)) {
            return { isValid: false, message: 'PIN cannot be all the same digit' };
        }
        return { isValid: true };
    }
    static isSequential(pin) {
        const digits = pin.split('').map(Number);
        for (let i = 0; i < digits.length - 1; i++) {
            if (Math.abs(digits[i] - digits[i + 1]) !== 1) {
                return false;
            }
        }
        return true;
    }
    static isRepeating(pin) {
        return pin.split('').every(digit => digit === pin[0]);
    }
    static async hashPin(pin) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(pin, salt);
    }
    static async comparePin(pin, hashedPin) {
        return bcryptjs_1.default.compare(pin, hashedPin);
    }
}
exports.PinUtils = PinUtils;
class EmailUtils {
    static validateEmail(email) {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    }
    static normalizeEmail(email) {
        return email.toLocaleLowerCase().trim();
    }
}
exports.EmailUtils = EmailUtils;
class UsernameUtils {
    static validateUsername(username) {
        if (username.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters long' };
        }
        if (username.length > 20) {
            return { isValid: false, message: 'Username must not exceed 20 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return { isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }
        return { isValid: true };
    }
}
exports.UsernameUtils = UsernameUtils;
class PhoneUtils {
    static validatePhoneNumber(phone) {
        //Simple validation for international format
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone);
    }
}
exports.PhoneUtils = PhoneUtils;
