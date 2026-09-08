import bcrypt from "bcryptjs";

export class PasswordUtils {
    static async hashPassword(password: string): Promise<string>{
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt)
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword)
    }

    static validatePassword(password: string): { isValid: boolean; message?: string} {
        if (password.length < 8) {
            return {isValid: false, message: 'Password must be at least 8 characters long'}
        }
        if(!/[A-Z]/.test(password)) {
            return {isValid: false, message: 'Password must contain at least one uppercase letter'}
        }
        if (!/[a-z]/.test(password)){
            return {isValid: false, message: 'Password must contain at least one lowercase letter'}
        }
        if (!/[0-9]/.test(password)) {
            return {isValid: false, message: 'Password must contain at least one number'}
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return {isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)'}
        }
        return {isValid: true}
    }
}

export class PinUtils {
    static validatePin(pin: string): {isValid: boolean; message?: string} {
        const cleanPin = pin.replace(/\s/g, '')

        if (cleanPin.length !== 4) {
            return {isValid: false, message: 'PIN must be exactly 4 digits'}
        }

        if (!/^\d+$/.test(cleanPin)) {
            return {isValid: false, message: 'PIN must contain only digits'}
        }

        //Check for sequential numbers (1234, 4567, etc)
        if (this.isSequential(cleanPin)) {
            return {isValid: false, message: 'PIN cannot be sequential numbers'}
        }

        //check for repeating numbers (1111, 2222, etc)
        if (this.isRepeating(cleanPin)){
            return {isValid: false, message: 'PIN cannot be all the same digit'}
        }

        return {isValid: true}
    }

    private static isSequential(pin: string): boolean {
        const digits = pin.split('').map(Number);
        for (let i = 0; i < digits.length - 1; i++) {
            if (Math.abs(digits[i] - digits[i + 1]) !== 1) {
                return false
            }
        }
        return true
    }

    private static isRepeating(pin: string): boolean {
        return pin.split('').every(digit => digit === pin[0])
    }

    static async hashPin(pin: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(pin, salt)
    }

    static async comparePin(pin: string, hashedPin: string): Promise<boolean> {
        return bcrypt.compare(pin, hashedPin)
    }
}

export class EmailUtils {
    static validateEmail(email: string): boolean {
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email)
    }

    static normalizeEmail(email: string): string {
        return email.toLocaleLowerCase().trim()
    }
}

export class UsernameUtils {
    static validateUsername(username: string): {isValid: boolean; message?: string} {
        if (username.length < 3) {
            return {isValid: false, message: 'Username must be at least 3 characters long'}
        }

        if (username.length > 20) {
            return {isValid: false, message: 'Username must not exceed 20 characters'}
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            return {isValid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens'}
        }

        return {isValid: true}
    }
}

export class PhoneUtils {
    static validatePhoneNumber(phone: string): boolean {
        //Simple validation for international format
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return phoneRegex.test(phone)
    }
}