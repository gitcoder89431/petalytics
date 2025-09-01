// Validation utility functions

export interface ValidationRule {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	min?: number;
	max?: number;
	custom?: (value: any) => string | null;
}

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

// Generic field validation
export function validateField(value: any, rules: ValidationRule): ValidationResult {
	const errors: string[] = [];
	
	// Required check
	if (rules.required && (value === null || value === undefined || value === '')) {
		errors.push('This field is required');
		return { isValid: false, errors };
	}
	
	// Skip other validations if field is empty and not required
	if (!rules.required && (value === null || value === undefined || value === '')) {
		return { isValid: true, errors: [] };
	}
	
	// String validations
	if (typeof value === 'string') {
		if (rules.minLength && value.length < rules.minLength) {
			errors.push(`Must be at least ${rules.minLength} characters long`);
		}
		
		if (rules.maxLength && value.length > rules.maxLength) {
			errors.push(`Must be no more than ${rules.maxLength} characters long`);
		}
		
		if (rules.pattern && !rules.pattern.test(value)) {
			errors.push('Invalid format');
		}
	}
	
	// Number validations
	if (typeof value === 'number') {
		if (rules.min !== undefined && value < rules.min) {
			errors.push(`Must be at least ${rules.min}`);
		}
		
		if (rules.max !== undefined && value > rules.max) {
			errors.push(`Must be no more than ${rules.max}`);
		}
	}
	
	// Custom validation
	if (rules.custom) {
		const customError = rules.custom(value);
		if (customError) {
			errors.push(customError);
		}
	}
	
	return { isValid: errors.length === 0, errors };
}

// Validate multiple fields
export function validateForm(data: Record<string, any>, schema: Record<string, ValidationRule>): ValidationResult {
	const allErrors: string[] = [];
	
	for (const [field, rules] of Object.entries(schema)) {
		const fieldResult = validateField(data[field], rules);
		if (!fieldResult.isValid) {
			allErrors.push(...fieldResult.errors.map(error => `${field}: ${error}`));
		}
	}
	
	return { isValid: allErrors.length === 0, errors: allErrors };
}

// Common validation patterns
export const patterns = {
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	phone: /^\+?[\d\s\-\(\)]+$/,
	url: /^https?:\/\/.+/,
	alphanumeric: /^[a-zA-Z0-9]+$/,
	noSpecialChars: /^[a-zA-Z0-9\s]+$/,
};

// Pre-built validators
export const validators = {
	email: {
		required: true,
		pattern: patterns.email,
	},
	
	petName: {
		required: true,
		minLength: 1,
		maxLength: 50,
		pattern: patterns.noSpecialChars,
	},
	
	guardianName: {
		required: true,
		minLength: 2,
		maxLength: 100,
		pattern: patterns.noSpecialChars,
	},
	
	phone: {
		pattern: patterns.phone,
	},
	
	weight: {
		min: 0.1,
		max: 1000,
	},
	
	journalTitle: {
		required: true,
		minLength: 3,
		maxLength: 100,
	},
	
	journalContent: {
		required: true,
		minLength: 10,
		maxLength: 5000,
	},
};