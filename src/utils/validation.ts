export class FormValidator {
  static validateEmail(email: string): string | null {
    if (!email) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Por favor ingresa un email válido';
    return null;
  }

  static validatePassword(password: string): string | null {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    return null;
  }

  static validateDisplayName(name: string): string | null {
    if (!name) return 'El nombre es requerido';
    if (name.length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return null;
  }

  static validatePasswordMatch(password: string, confirmPassword: string): string | null {
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  }
}