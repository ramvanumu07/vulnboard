/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize and validate user inputs to prevent XSS attacks
 * and ensure data integrity throughout the application.
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 * while preserving legitimate content.
 * 
 * @param {string} input - The input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {number} options.maxLength - Maximum allowed length (default: 1000)
 * @param {boolean} options.allowHTML - Whether to allow basic HTML tags (default: false)
 * @param {boolean} options.preserveNewlines - Whether to preserve newline characters (default: true)
 * @returns {string} Sanitized string
 * 
 * @example
 * const cleanInput = sanitizeInput('<script>alert("xss")</script>Hello World');
 * // Returns: 'Hello World'
 */
export function sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
        return '';
    }

    const {
        maxLength = 1000,
        allowHTML = false,
        preserveNewlines = true
    } = options;

    let sanitized = input;

    // Remove null bytes and control characters except newlines/tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    if (!allowHTML) {
        // Remove HTML tags and potentially dangerous characters
        sanitized = sanitized
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>\"']/g, '') // Remove dangerous characters
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }

    // Handle newlines
    if (!preserveNewlines) {
        sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }

    // Trim whitespace and limit length
    sanitized = sanitized.trim();

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Sanitizes an email address to ensure it's properly formatted
 * and doesn't contain malicious content.
 * 
 * @param {string} email - The email address to sanitize
 * @returns {string} Sanitized email address
 * 
 * @example
 * const cleanEmail = sanitizeEmail('user@example.com<script>');
 * // Returns: 'user@example.com'
 */
export function sanitizeEmail(email) {
    if (typeof email !== 'string') {
        return '';
    }

    // Remove all characters except alphanumeric, @, ., -, _, +
    const sanitized = email
        .toLowerCase()
        .replace(/[^a-z0-9@.\-_+]/g, '')
        .trim();

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * Sanitizes a URL to ensure it's safe and properly formatted.
 * 
 * @param {string} url - The URL to sanitize
 * @param {Array<string>} allowedProtocols - Allowed URL protocols (default: ['http', 'https'])
 * @returns {string} Sanitized URL or empty string if invalid
 * 
 * @example
 * const cleanUrl = sanitizeUrl('javascript:alert(1)');
 * // Returns: ''
 */
export function sanitizeUrl(url, allowedProtocols = ['http', 'https']) {
    if (typeof url !== 'string') {
        return '';
    }

    const sanitized = url.trim();

    try {
        const urlObj = new URL(sanitized);

        if (!allowedProtocols.includes(urlObj.protocol.replace(':', ''))) {
            return '';
        }

        // Remove any dangerous characters from the URL
        return urlObj.toString().replace(/[<>"']/g, '');
    } catch (error) {
        // Invalid URL
        return '';
    }
}

/**
 * Sanitizes a filename to ensure it's safe for storage and display.
 * 
 * @param {string} filename - The filename to sanitize
 * @param {number} maxLength - Maximum filename length (default: 255)
 * @returns {string} Sanitized filename
 * 
 * @example
 * const cleanFilename = sanitizeFilename('../../etc/passwd');
 * // Returns: 'etc_passwd'
 */
export function sanitizeFilename(filename, maxLength = 255) {
    if (typeof filename !== 'string') {
        return '';
    }

    // Remove path traversal attempts and dangerous characters
    const sanitized = filename
        .replace(/[/\\:*?"<>|]/g, '_') // Replace dangerous characters with underscore
        .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
        .replace(/^\.+/, '') // Remove leading dots
        .trim();

    // Limit length and ensure it's not empty
    const result = sanitized.substring(0, maxLength);

    return result || 'untitled';
}

/**
 * Sanitizes a numeric input to ensure it's a valid number within bounds.
 * 
 * @param {any} input - The input to sanitize as a number
 * @param {Object} options - Sanitization options
 * @param {number} options.min - Minimum allowed value
 * @param {number} options.max - Maximum allowed value
 * @param {number} options.defaultValue - Default value if input is invalid (default: 0)
 * @param {boolean} options.allowFloat - Whether to allow floating-point numbers (default: true)
 * @returns {number} Sanitized number
 * 
 * @example
 * const rating = sanitizeNumber('8.5', { min: 0, max: 10, defaultValue: 5 });
 * // Returns: 8.5
 */
export function sanitizeNumber(input, options = {}) {
    const {
        min = -Infinity,
        max = Infinity,
        defaultValue = 0,
        allowFloat = true
    } = options;

    let num = parseFloat(input);

    if (isNaN(num) || !isFinite(num)) {
        return defaultValue;
    }

    if (!allowFloat) {
        num = Math.floor(num);
    }

    // Clamp to bounds
    num = Math.max(min, Math.min(max, num));

    return num;
}

/**
 * Deep sanitizes an object by recursively sanitizing all string values.
 * 
 * @param {any} obj - The object to sanitize
 * @param {Object} options - Sanitization options (passed to sanitizeInput)
 * @returns {any} Sanitized object
 * 
 * @example
 * const clean = deepSanitize({
 *   title: '<script>alert("xss")</script>Task',
 *   nested: { description: 'Safe content' }
 * });
 * // Returns: { title: 'Task', nested: { description: 'Safe content' } }
 */
export function deepSanitize(obj, options = {}) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return sanitizeInput(obj, options);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item, options));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Sanitize both key and value
            const cleanKey = sanitizeInput(key, { maxLength: 100, allowHTML: false });
            if (cleanKey) { // Only include valid keys
                sanitized[cleanKey] = deepSanitize(value, options);
            }
        }
        return sanitized;
    }

    // For primitive types (number, boolean, etc.), return as-is
    return obj;
}

/**
 * Validates and sanitizes task data specifically for the Kanban application.
 * 
 * @param {Object} taskData - Raw task data from user input
 * @returns {Object} Sanitized and validated task data
 * 
 * @example
 * const cleanTask = sanitizeTaskData({
 *   title: '<script>evil</script>Important Task',
 *   priority: 'High',
 *   rating: '8.5'
 * });
 */
export function sanitizeTaskData(taskData) {
    if (!taskData || typeof taskData !== 'object') {
        return {};
    }

    const sanitized = {};

    // Title - required, max 200 characters
    if (taskData.title) {
        sanitized.title = sanitizeInput(taskData.title, {
            maxLength: 200,
            allowHTML: false,
            preserveNewlines: false
        });
    }

    // Details/Description - optional, max 2000 characters, allow newlines
    if (taskData.details) {
        sanitized.details = sanitizeInput(taskData.details, {
            maxLength: 2000,
            allowHTML: false,
            preserveNewlines: true
        });
    }

    // Priority - must be from allowed values
    const allowedPriorities = ['Critical', 'High', 'Medium', 'Low'];
    if (taskData.priority && allowedPriorities.includes(taskData.priority)) {
        sanitized.priority = taskData.priority;
    }

    // Rating - number between 0 and 10
    if (taskData.rating !== undefined) {
        sanitized.rating = sanitizeNumber(taskData.rating, {
            min: 0,
            max: 10,
            defaultValue: 0,
            allowFloat: true
        });
    }

    // Labels - array of strings
    if (Array.isArray(taskData.labels)) {
        sanitized.labels = taskData.labels
            .map(label => sanitizeInput(label, { maxLength: 50, allowHTML: false }))
            .filter(label => label.length > 0) // Remove empty labels
            .slice(0, 10); // Limit to 10 labels max
    }

    // Status - string with limited options
    const allowedStatuses = ['', 'active', 'completed', 'archived'];
    if (taskData.status && allowedStatuses.includes(taskData.status)) {
        sanitized.status = taskData.status;
    }

    return sanitized;
}

/**
 * Validates and sanitizes column data for the Kanban board.
 * 
 * @param {Object} columnData - Raw column data from user input
 * @returns {Object} Sanitized and validated column data
 */
export function sanitizeColumnData(columnData) {
    if (!columnData || typeof columnData !== 'object') {
        return {};
    }

    const sanitized = {};

    // Title - required, max 100 characters
    if (columnData.title) {
        sanitized.title = sanitizeInput(columnData.title, {
            maxLength: 100,
            allowHTML: false,
            preserveNewlines: false
        });
    }

    // Order - number
    if (columnData.order !== undefined) {
        sanitized.order = sanitizeNumber(columnData.order, {
            min: 0,
            max: 1000,
            defaultValue: 0,
            allowFloat: false
        });
    }

    return sanitized;
}

/**
 * Validates and sanitizes label data.
 * 
 * @param {Object} labelData - Raw label data from user input
 * @returns {Object} Sanitized and validated label data
 */
export function sanitizeLabelData(labelData) {
    if (!labelData || typeof labelData !== 'object') {
        return {};
    }

    const sanitized = {};

    // Name - required, max 50 characters
    if (labelData.name) {
        sanitized.name = sanitizeInput(labelData.name, {
            maxLength: 50,
            allowHTML: false,
            preserveNewlines: false
        });
    }

    // Color - hex color code validation
    if (labelData.color) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const cleanColor = sanitizeInput(labelData.color, {
            maxLength: 7,
            allowHTML: false
        });

        if (colorRegex.test(cleanColor)) {
            sanitized.color = cleanColor;
        }
    }

    return sanitized;
}
