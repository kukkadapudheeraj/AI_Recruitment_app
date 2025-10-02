/**
 * AI Recruitment Application - Clean Code Version
 * A modern SPA for AI-powered recruitment and job description generation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const CONSTANTS = {
  // Storage Keys
  STORAGE_KEYS: {
    USERS: "users",
    CURRENT_USER: "currentUser",
    JOB_DESCRIPTIONS: "jobDescriptions",
    OPENAI_API_KEY: "openai_api_key",
    OPENAI_MODEL: "openai_model",
    USE_PROXY: "use_proxy",
    PROXY_BASE: "proxy_base",
    JD_DRAFT: "jdDraft",
  },

  // API Configuration
  API: {
    DEFAULT_MODEL: "gpt-4o-mini",
    DEFAULT_PROXY_BASE: "http://localhost:8787",
    OPENAI_ENDPOINT: "https://api.openai.com/v1/chat/completions",
    TEMPERATURE: 0.3,
  },

  // UI Configuration
  UI: {
    MAX_PREVIEW_LENGTH: 500,
    TEXTAREA_ROWS: 8,
    PROGRESS_STEPS: [
      "Analyzing job description...",
      "Identifying target companies...",
      "Generating Boolean search strings...",
      "Finalizing sourcing strategy...",
    ],
  },

  // Button Variants
  BUTTON_VARIANTS: {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    LINK_LIKE: "linklike",
  },

  // Job Description Sources
  JD_SOURCES: {
    SAVED: "saved",
    CUSTOM: "custom",
  },

  // Input Types
  INPUT_TYPES: {
    TEXT: "text",
    EMAIL: "email",
    PASSWORD: "password",
    TEXTAREA: "textarea",
  },
};

// ============================================================================
// PASSWORD SECURITY UTILITIES
// ============================================================================

/**
 * Secure password hashing and validation utilities
 */
const PasswordSecurity = {
  /**
   * Hash a password using Web Crypto API with PBKDF2
   * @param {string} password - Plain text password
   * @param {string} salt - Salt for hashing (optional, will generate if not provided)
   * @returns {Promise<Object>} Object containing hashed password and salt
   */
  async hashPassword(password, salt = null) {
    try {
      // Generate salt if not provided
      if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
      } else if (typeof salt === "string") {
        // Convert string salt back to Uint8Array
        salt = new Uint8Array(salt.split(",").map(Number));
      }

      // Import password as key material
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      // Derive key using PBKDF2
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000, // High iteration count for security
          hash: "SHA-256",
        },
        keyMaterial,
        256 // 256 bits
      );

      // Convert to hex string
      const hashedPassword = Array.from(new Uint8Array(derivedBits))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return {
        hashedPassword,
        salt: Array.from(salt).join(","),
      };
    } catch (error) {
      console.error("Password hashing failed:", error);
      throw new Error("Password hashing failed. Please try again.");
    }
  },

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password to verify
   * @param {string} hashedPassword - Stored hashed password
   * @param {string} salt - Salt used for the original hash
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hashedPassword, salt) {
    try {
      const { hashedPassword: newHash } = await this.hashPassword(
        password,
        salt
      );
      return newHash === hashedPassword;
    } catch (error) {
      console.error("Password verification failed:", error);
      return false;
    }
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with errors array
   */
  validatePasswordStrength(password) {
    const errors = [];

    if (!password) {
      errors.push("Password is required");
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    // Check for common weak passwords
    const commonPasswords = [
      "password",
      "123456",
      "password123",
      "admin",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
      "abc123",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common. Please choose a stronger password");
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password),
    };
  },

  /**
   * Calculate password strength score (0-100)
   * @param {string} password - Password to analyze
   * @returns {number} Strength score
   */
  calculatePasswordStrength(password) {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential patterns

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default: 16)
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16) {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    return Array.from(array, (byte) => charset[byte % charset.length]).join("");
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * DOM utility functions for cleaner element creation and selection
 */
const DOMUtils = {
  /**
   * Select element by selector with optional root context
   * @param {string} selector - CSS selector
   * @param {Element} root - Root element to search within
   * @returns {Element|null} Selected element
   */
  select(selector, root = document) {
    return root.querySelector(selector);
  },

  /**
   * Create DOM element with attributes and children
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {Array|string|Element} children - Child elements
   * @returns {Element} Created element
   */
  createElement(tag, attributes = {}, children = []) {
    if (!tag) {
      console.error("DOMUtils.createElement() called with invalid tag:", tag);
      return document.createElement("div");
    }

    const element = document.createElement(tag);

    // Set attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.setAttribute(element, key, value);
      });
    }

    // Append children
    if (children) {
      this.appendChildren(element, children);
    }

    return element;
  },

  /**
   * Set attribute on element with proper handling for special cases
   * @param {Element} element - Target element
   * @param {string} key - Attribute key
   * @param {*} value - Attribute value
   */
  setAttribute(element, key, value) {
    switch (key) {
      case "class":
        element.className = value;
        break;
      case "innerHTML":
        element.innerHTML = value;
        break;
      case "htmlFor":
        element.setAttribute("for", value);
        break;
      case "href":
        element.setAttribute("href", value);
        break;
      default:
        if (key.startsWith("on") && typeof value === "function") {
          element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
          element[key] = value;
        }
    }
  },

  /**
   * Append children to element with proper type handling
   * @param {Element} element - Parent element
   * @param {Array|string|Element} children - Children to append
   */
  appendChildren(element, children) {
    const childrenArray = Array.isArray(children) ? children : [children];

    childrenArray.forEach((child) => {
      if (child == null) return;

      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child && child.nodeType) {
        element.appendChild(child);
      }
    });
  },
};

/**
 * String utility functions
 */
const StringUtils = {
  /**
   * Clean text for HR systems by removing markdown and formatting
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanForHR(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/\n\n\n+/g, "\n\n") // Clean up multiple newlines
      .replace(/^#+\s*/gm, "") // Remove markdown headers
      .trim();
  },

  /**
   * Generate filename-safe string
   * @param {string} text - Text to convert
   * @returns {string} Filename-safe string
   */
  toFilename(text) {
    return text.replace(/\s+/g, "-");
  },

  /**
   * Truncate text to specified length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncate(text, maxLength = CONSTANTS.UI.MAX_PREVIEW_LENGTH) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  },
};

/**
 * Validation utility functions
 */
const ValidationUtils = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email || "");
  },

  /**
   * Validate signup form data
   * @param {Object} fields - Form fields
   * @returns {Object} Validation errors
   */
  validateSignup(fields) {
    const errors = {};
    const users = StorageManager.loadUsers();

    // Basic field validation
    if (!fields.first) errors.first = "First name is required.";
    if (!fields.last) errors.last = "Last name is required.";
    if (!fields.username) errors.username = "Username is required.";
    if (!fields.email) errors.email = "Email is required.";
    else if (!this.isValidEmail(fields.email))
      errors.email = "Please enter a valid email.";

    // Enhanced password validation
    if (!fields.password) {
      errors.password = "Password is required.";
    } else {
      const passwordValidation = PasswordSecurity.validatePasswordStrength(
        fields.password
      );
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.errors.join(". ");
      }
    }

    // Username uniqueness check
    if (
      fields.username &&
      users.some(
        (u) => u.username.toLowerCase() === fields.username.toLowerCase()
      )
    ) {
      errors.username = "Username already taken.";
    }

    // Email uniqueness check
    if (
      fields.email &&
      users.some((u) => u.email.toLowerCase() === fields.email.toLowerCase())
    ) {
      errors.email = "Email address already registered.";
    }

    return errors;
  },

  /**
   * Validate login credentials
   * @param {Object} credentials - Login credentials
   * @returns {Object} Validation errors
   */
  validateLogin(credentials) {
    const errors = {};

    if (!credentials.username) errors.username = "Username is required.";
    if (!credentials.password) errors.password = "Password is required.";

    return errors;
  },
};

// ============================================================================
// STORAGE MANAGEMENT
// ============================================================================

/**
 * Centralized storage management for the application
 */
const StorageManager = {
  /**
   * Load users from localStorage
   * @returns {Array} Array of users
   */
  loadUsers() {
    try {
      return JSON.parse(
        localStorage.getItem(CONSTANTS.STORAGE_KEYS.USERS) || "[]"
      );
    } catch (error) {
      console.error("Error loading users:", error);
      return [];
    }
  },

  /**
   * Save users to localStorage
   * @param {Array} users - Users to save
   */
  saveUsers(users) {
    try {
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  },

  /**
   * Get current user from sessionStorage
   * @returns {Object|null} Current user or null
   */
  getCurrentUser() {
    try {
      return JSON.parse(
        sessionStorage.getItem(CONSTANTS.STORAGE_KEYS.CURRENT_USER) || "null"
      );
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  /**
   * Set current user in sessionStorage
   * @param {Object} user - User to set as current
   */
  setCurrentUser(user) {
    try {
      sessionStorage.setItem(
        CONSTANTS.STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(user)
      );
    } catch (error) {
      console.error("Error setting current user:", error);
    }
  },

  /**
   * Clear current user from sessionStorage
   */
  clearCurrentUser() {
    try {
      sessionStorage.removeItem(CONSTANTS.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error("Error clearing current user:", error);
    }
  },

  /**
   * Load all job descriptions
   * @returns {Array} Array of job descriptions
   */
  loadJobDescriptions() {
    try {
      return JSON.parse(
        localStorage.getItem(CONSTANTS.STORAGE_KEYS.JOB_DESCRIPTIONS) || "[]"
      );
    } catch (error) {
      console.error("Error loading job descriptions:", error);
      return [];
    }
  },

  /**
   * Save all job descriptions
   * @param {Array} jobDescriptions - Job descriptions to save
   */
  saveJobDescriptions(jobDescriptions) {
    try {
      localStorage.setItem(
        CONSTANTS.STORAGE_KEYS.JOB_DESCRIPTIONS,
        JSON.stringify(jobDescriptions)
      );
    } catch (error) {
      console.error("Error saving job descriptions:", error);
    }
  },

  /**
   * Save a single job description
   * @param {Object} jobDescription - Job description to save
   */
  saveJobDescription(jobDescription) {
    const jobDescriptions = this.loadJobDescriptions();
    jobDescriptions.unshift(jobDescription);
    this.saveJobDescriptions(jobDescriptions);
  },

  /**
   * Get API key (always empty since we use proxy)
   * @returns {string} Empty string (API key handled by server)
   */
  getApiKey() {
    return ""; // API key is handled by the server via .env file
  },

  /**
   * Set API key (no-op since we use proxy)
   * @param {string} apiKey - API key (ignored)
   */
  setApiKey(apiKey) {
    // No-op: API key is handled by the server
  },

  /**
   * Get AI model (always returns default)
   * @returns {string} Default model name
   */
  getModel() {
    return CONSTANTS.API.DEFAULT_MODEL;
  },

  /**
   * Set AI model (no-op since we use default)
   * @param {string} model - Model (ignored)
   */
  setModel(model) {
    // No-op: Using default model
  },

  /**
   * Check if proxy is enabled (always true)
   * @returns {boolean} Always true (we always use proxy)
   */
  isProxyEnabled() {
    return true; // Always use proxy for simplicity
  },

  /**
   * Set proxy enabled state (no-op since always enabled)
   * @param {boolean} enabled - Whether proxy is enabled (ignored)
   */
  setProxyEnabled(enabled) {
    // No-op: Always use proxy
  },

  /**
   * Get proxy base URL
   * @returns {string} Proxy base URL
   */
  getProxyBase() {
    return (
      localStorage.getItem(CONSTANTS.STORAGE_KEYS.PROXY_BASE) ||
      CONSTANTS.API.DEFAULT_PROXY_BASE
    );
  },

  /**
   * Set proxy base URL
   * @param {string} baseUrl - Proxy base URL
   */
  setProxyBase(baseUrl) {
    localStorage.setItem(
      CONSTANTS.STORAGE_KEYS.PROXY_BASE,
      baseUrl || CONSTANTS.API.DEFAULT_PROXY_BASE
    );
  },
};

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Reusable UI components with consistent styling and behavior
 */
const UIComponents = {
  /**
   * Create a label element
   * @param {string} forId - ID of associated element
   * @param {string} text - Label text
   * @returns {Element} Label element
   */
  createLabel(forId, text) {
    return DOMUtils.createElement(
      "label",
      {
        class: "sr-only",
        htmlFor: forId,
      },
      text
    );
  },

  /**
   * Create a button element
   * @param {string} label - Button text
   * @param {Object} options - Button options
   * @returns {Element} Button element
   */
  createButton(label, options = {}) {
    const {
      variant = CONSTANTS.BUTTON_VARIANTS.PRIMARY,
      onClick = null,
      href = null,
    } = options;

    const className = this.getButtonClassName(variant);
    const elementType = href ? "a" : "button";
    const attributes = { class: className, onclick: onClick };

    if (href) {
      attributes.href = href;
    }

    return DOMUtils.createElement(elementType, attributes, label);
  },

  /**
   * Get button CSS class name based on variant
   * @param {string} variant - Button variant
   * @returns {string} CSS class name
   */
  getButtonClassName(variant) {
    switch (variant) {
      case CONSTANTS.BUTTON_VARIANTS.LINK_LIKE:
        return "btn linklike";
      case CONSTANTS.BUTTON_VARIANTS.SECONDARY:
        return "btn secondary";
      default:
        return "btn";
    }
  },

  /**
   * Create a text input element
   * @param {string} placeholder - Input placeholder
   * @param {string} type - Input type
   * @param {string} name - Input name
   * @param {string} id - Input ID
   * @param {string} value - Input value
   * @returns {Element} Input element
   */
  createTextInput(
    placeholder,
    type = CONSTANTS.INPUT_TYPES.TEXT,
    name = null,
    id = null,
    value = ""
  ) {
    return DOMUtils.createElement("input", {
      class: "input",
      placeholder,
      type,
      name,
      id: id || name || this.generateIdFromPlaceholder(placeholder),
      value,
    });
  },

  /**
   * Generate ID from placeholder text
   * @param {string} placeholder - Placeholder text
   * @returns {string} Generated ID
   */
  generateIdFromPlaceholder(placeholder) {
    return placeholder.toLowerCase().replace(/\s+/g, "-");
  },

  /**
   * Create a section element
   * @param {string} title - Section title
   * @param {Element|Array} content - Section content
   * @returns {Element} Section element
   */
  createSection(title, content) {
    return DOMUtils.createElement("section", { class: "card" }, [
      DOMUtils.createElement("h2", {}, title),
      DOMUtils.createElement("div", {}, content),
    ]);
  },

  /**
   * Create a loading spinner
   * @param {string} text - Loading text
   * @param {number} size - Spinner size in pixels
   * @returns {Element} Loading spinner element
   */
  createLoadingSpinner(text = "Loading...", size = 32) {
    return DOMUtils.createElement(
      "div",
      {
        class: "card",
        style: "margin-top: 20px; text-align: center; padding: 40px 20px;",
      },
      [
        DOMUtils.createElement("div", {
          class: "loading-spinner",
          style: `width: ${size}px; height: ${size}px; border: 3px solid #e5e7eb; border-top: 3px solid #2563eb; border-radius: 50%; margin: 0 auto 16px;`,
        }),
        DOMUtils.createElement(
          "h3",
          { style: "margin: 0 0 8px 0; color: #1f2937;" },
          text
        ),
      ]
    );
  },

  /**
   * Create a notice/alert element
   * @param {string} message - Notice message
   * @param {string} type - Notice type (error, success, info)
   * @returns {Element} Notice element
   */
  createNotice(message, type = "info") {
    const className = `notice ${type}`;
    return DOMUtils.createElement("div", { class: className }, message);
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Copy text to clipboard with user feedback
 * @param {string} text - Text to copy
 */
function copyToClipboard(text) {
  const cleanText = StringUtils.cleanForHR(text);

  try {
    navigator.clipboard.writeText(cleanText);
    showNotification(
      "✅ Job description copied! Ready to paste into HR systems.",
      "success"
    );
  } catch (error) {
    // Fallback for older browsers
    const textarea = DOMUtils.createElement("textarea", {}, cleanText);
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showNotification(
      "✅ Job description copied! Ready to paste into HR systems.",
      "success"
    );
  }
}

/**
 * Download text as a file
 * @param {string} filename - Name of the file
 * @param {string} text - Text content to download
 */
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = DOMUtils.createElement(
    "a",
    { href: url, download: filename },
    ""
  );

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 500);
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info, warning)
 */
function showNotification(message, type = "info") {
  // Create notification container if it doesn't exist
  let container = document.querySelector("#notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
    min-width: 320px;
    max-width: 480px;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
    cursor: pointer;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  // Set type-specific styles and icons
  let icon, bgColor, borderColor;
  switch (type) {
    case "success":
      icon = "✅";
      bgColor = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      borderColor = "rgba(16, 185, 129, 0.3)";
      break;
    case "error":
      icon = "❌";
      bgColor = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
      borderColor = "rgba(239, 68, 68, 0.3)";
      break;
    case "warning":
      icon = "⚠️";
      bgColor = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      borderColor = "rgba(245, 158, 11, 0.3)";
      break;
    default: // info
      icon = "ℹ️";
      bgColor = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
      borderColor = "rgba(59, 130, 246, 0.3)";
  }

  notification.style.background = bgColor;
  notification.style.borderColor = borderColor;

  // Create content
  notification.innerHTML = `
    <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1;">${message}</span>
    <span style="opacity: 0.7; font-size: 12px; flex-shrink: 0;">×</span>
  `;

  // Add click to dismiss
  notification.addEventListener("click", () => {
    dismissNotification(notification);
  });

  // Add to container
  container.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
    notification.style.opacity = "1";
  }, 10);

  // Auto dismiss after delay (longer for errors)
  const dismissDelay =
    type === "error" ? 7000 : type === "success" ? 4000 : 5000;
  setTimeout(() => {
    dismissNotification(notification);
  }, dismissDelay);
}

/**
 * Dismiss a notification with animation
 * @param {HTMLElement} notification - Notification element to dismiss
 */
function dismissNotification(notification) {
  if (!notification || !notification.parentNode) return;

  notification.style.transform = "translateX(100%)";
  notification.style.opacity = "0";

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

/**
 * Route guard to check if user is authenticated
 * @param {Function} viewFunction - Function to render the view
 * @returns {Function} Protected view function
 */
function createRouteGuard(viewFunction) {
  return () => {
    if (!StorageManager.getCurrentUser()) {
      showNotification("Please login to access this page.", "error");
      location.hash = "#/login";
      return Views.Login();
    }
    return viewFunction();
  };
}

// ============================================================================
// AI INTEGRATION
// ============================================================================

/**
 * AI service for handling OpenAI API calls and proxy interactions
 */
const AIService = {
  /**
   * Generate content via proxy
   * @param {Object} answers - User answers for job description
   * @returns {Promise<string>} Generated content
   */
  async generateViaProxy(answers) {
    // Create a modified answers object without any company information
    const answersForAPI = { ...answers };
    // Always delete company information to make job descriptions generic
    delete answersForAPI.company;

    // Convert skills array to string if it exists
    if (answersForAPI.skills && Array.isArray(answersForAPI.skills)) {
      answersForAPI.skills = answersForAPI.skills.join(", ");
    }

    // Convert benefits array to string if it exists
    if (answersForAPI.benefits && Array.isArray(answersForAPI.benefits)) {
      answersForAPI.benefits = answersForAPI.benefits.join(", ");
    }

    console.log("Sending to AI proxy:", {
      url: StorageManager.getProxyBase() + "/api/generate",
      answers: answersForAPI,
      model: StorageManager.getModel(),
    });

    const response = await fetch(
      StorageManager.getProxyBase() + "/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersForAPI,
          model: StorageManager.getModel(),
        }),
      }
    );

    console.log("AI proxy response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI proxy error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("AI proxy response data:", data);
    return data.text;
  },

  /**
   * Polish content via proxy
   * @param {string} content - Content to polish
   * @param {string} instructions - Polish instructions
   * @returns {Promise<string>} Polished content
   */
  async polishViaProxy(content, instructions) {
    const response = await fetch(
      StorageManager.getProxyBase() + "/api/polish",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          instructions,
          model: StorageManager.getModel(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data.text;
  },

  /**
   * Generate sourcing strategy via proxy
   * @param {string} jobDescription - Job description text
   * @param {string} location - Job location
   * @returns {Promise<Object>} Sourcing strategy data
   */
  async sourcingViaProxy(jobDescription, location) {
    const response = await fetch(
      StorageManager.getProxyBase() + "/api/sourcing",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd: jobDescription,
          location,
          model: StorageManager.getModel(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data;
  },

  /**
   * Chat with OpenAI API
   * @param {Array} messages - Chat messages
   * @param {Object} options - Chat options
   * @returns {Promise<string>} AI response
   */
  async chat(messages, options = {}) {
    const apiKey = StorageManager.getApiKey();
    if (!apiKey) {
      throw new Error(
        "Missing OpenAI API key. Go to Settings and save your key."
      );
    }

    const model = options.model || StorageManager.getModel();
    const endpoint = options.endpoint || CONSTANTS.API.OPENAI_ENDPOINT;

    const requestBody = {
      model,
      messages,
      temperature: options.temperature ?? CONSTANTS.API.TEMPERATURE,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim?.() || "";
  },

  /**
   * Generate sourcing strategy
   * @param {string} jobDescription - Job description
   * @param {string} location - Job location
   * @returns {Promise<Object>} Sourcing strategy
   */
  async generateSourcingStrategy(jobDescription, location) {
    const systemPrompt = this.buildSourcingSystemPrompt(location);
    const userPrompt = `Job Description:\n\n${jobDescription}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return this.parseSourcingResponse(response, location);
  },

  /**
   * Build system prompt for sourcing strategy generation
   * @param {string} location - Job location
   * @returns {string} System prompt
   */
  buildSourcingSystemPrompt(location) {
    return `You are a recruiter who has just completed an intake meeting and has a detailed job description for a role based in ${location}. Your next task is to identify potential candidates for this role. Follow these steps:

1. Based on the job description scoped above, identify 10 top companies known for having talent with relevant skills and experience for this role.

2. Generate a specific Boolean search string for each identified company to use in LinkedIn searches. CRITICAL: Each LinkedIn search string MUST include the specific company name to target candidates from that exact company. The goal is to find LinkedIn profiles of potential candidates who could fit this role well and work at the specific company.

3. Also create a Boolean string to search in Dice job portal.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "companies": [
    {
      "name": "Company Name",
      "linkedinSearch": "Boolean search string for LinkedIn that includes the company name",
      "reason": "Why this company has relevant talent"
    }
  ],
  "diceSearch": "Boolean search string for Dice job portal",
  "summary": "Brief summary of sourcing strategy"
}

EXAMPLES of proper LinkedIn search strings:
- For Google: site:linkedin.com/in/ ("Google" OR "Alphabet") AND "software engineer" AND "${location}"
- For Microsoft: site:linkedin.com/in/ "Microsoft" AND "data scientist" AND "${location}"
- For Amazon: site:linkedin.com/in/ "Amazon" AND "product manager" AND "${location}"

Do not include any text before or after the JSON.`;
  },

  /**
   * Parse sourcing response from AI
   * @param {string} response - AI response
   * @param {string} location - Job location
   * @returns {Object} Parsed sourcing data
   */
  parseSourcingResponse(response, location) {
    try {
      let jsonStr = response.trim();

      // Find JSON object boundaries
      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}") + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd);
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and clean structure
      return {
        companies: Array.isArray(parsed.companies) ? parsed.companies : [],
        diceSearch: parsed.diceSearch || "",
        summary: parsed.summary || "Sourcing strategy generated successfully.",
      };
    } catch (error) {
      console.error("JSON parsing failed:", error);
      console.error("Response was:", response);

      // Return fallback data
      return {
        companies: [
          {
            name: "Sample Company",
            linkedinSearch: `site:linkedin.com/in/ "Sample Company" AND "software developer" AND "${location}"`,
            reason: "Sample company with relevant talent",
          },
        ],
        diceSearch: `"${location}" AND "software developer" AND "full time"`,
        summary:
          "Fallback sourcing strategy generated. Please check your AI settings.",
      };
    }
  },
};

// ============================================================================
// JOB DESCRIPTION BUILDER
// ============================================================================

/**
 * Job Description Builder service
 */
const JobDescriptionBuilder = {
  /**
   * Build AI prompt from user answers
   * @param {Object} answers - User answers
   * @returns {string} Formatted prompt
   */
  buildPromptFromAnswers(answers) {
    const lines = [];

    lines.push(`Job Role: ${answers.role || ""}`);
    if (answers.company) lines.push(`Company: ${answers.company}`);
    lines.push(`Location: ${answers.location || ""}`);
    if (answers.timezone) lines.push(`Time zone: ${answers.timezone}`);
    lines.push(`Employment type: ${answers.hireType || ""}`);
    if (answers.duration) lines.push(`Contract duration: ${answers.duration}`);
    if (answers.domain) lines.push(`Domain preference: ${answers.domain}`);
    if (answers.skills) lines.push(`Key skills: ${answers.skills}`);
    if (answers.goals) lines.push(`1-year success goals: ${answers.goals}`);
    if (answers.kpi) lines.push(`KPIs: ${answers.kpi}`);
    if (answers.superstar)
      lines.push(`Superstar outcomes: ${answers.superstar}`);
    if (answers.ninety) lines.push(`First 90 days: ${answers.ninety}`);
    if (answers.benefits) lines.push(`Benefits and perks: ${answers.benefits}`);
    if (answers.applicationProcess) {
      lines.push(`Application process: ${answers.applicationProcess}`);
    }

    return lines.join("\n");
  },

  /**
   * Build job description from answers (fallback)
   * @param {Object} answers - User answers
   * @returns {string} Formatted job description
   */
  buildJobDescription(answers) {
    const sections = [
      `JOB TITLE: ${answers.role || ""}`,
      answers.company ? `COMPANY: ${answers.company}` : "",
      `LOCATION: ${answers.location || ""}`,
      answers.timezone ? `TIME ZONE: ${answers.timezone}` : "",
      `EMPLOYMENT TYPE: ${answers.hireType || ""}`,
      answers.duration ? `CONTRACT DURATION: ${answers.duration}` : "",
      "",
      "JOB SUMMARY",
      `We are seeking a ${answers.role || "professional"} to join our team${
        answers.location ? ` in ${answers.location}` : ""
      }. ${answers.domain ? `This role focuses on ${answers.domain}.` : ""}`,
      "",
      "KEY RESPONSIBILITIES",
      answers.goals ? `• ${answers.goals.split("\n").join("\n• ")}` : "",
      "",
      "REQUIRED SKILLS",
      answers.skills ? `• ${answers.skills.split("\n").join("\n• ")}` : "",
      "",
      "PREFERRED QUALIFICATIONS",
      answers.kpi ? `• ${answers.kpi.split("\n").join("\n• ")}` : "",
      "",
      "SUPERSTAR OUTCOMES",
      answers.superstar
        ? `• ${answers.superstar.split("\n").join("\n• ")}`
        : "",
      "",
      "FIRST 90 DAYS",
      answers.ninety ? `• ${answers.ninety.split("\n").join("\n• ")}` : "",
      "",
      "BENEFITS & PERKS",
      answers.benefits
        ? `• ${answers.benefits.split("\n").join("\n• ")}`
        : "• Competitive salary\n• Health insurance\n• Professional development opportunities",
      "",
      "HOW TO APPLY",
      answers.applicationProcess ||
        "Please submit your resume and cover letter to our HR department.",
      "",
      "Equal Opportunity Employer",
      "We are an equal opportunity employer and value diversity at our company. We do not discriminate on the basis of race, religion, color, national origin, gender, sexual orientation, age, marital status, veteran status, or disability status.",
    ];

    return sections.filter((line) => line !== "").join("\n");
  },
};

// ============================================================================
// VIEWS (SCREENS)
// ============================================================================

/**
 * Application views/screens
 */
const Views = {
  /**
   * Home screen
   * @returns {Element} Home view element
   */
  Home() {
    const currentUser = StorageManager.getCurrentUser();
    const jobDescriptions = StorageManager.loadJobDescriptions();

    if (currentUser) {
      // User is logged in - show personalized dashboard
      return Views.renderAuthenticatedHome(currentUser, jobDescriptions);
    } else {
      // User is not logged in - show welcome screen
      return Views.renderUnauthenticatedHome();
    }
  },

  /**
   * Render home page for authenticated users
   * @param {Object} user - Current user
   * @param {Array} jobDescriptions - User's job descriptions
   * @returns {Element} Authenticated home view
   */
  renderAuthenticatedHome(user, jobDescriptions) {
    return DOMUtils.createElement("div", { class: "container" }, [
      // Welcome section
      DOMUtils.createElement("div", { class: "card network" }, [
        DOMUtils.createElement(
          "h2",
          { class: "section-title" },
          `Welcome back, ${user.first || user.username}!`
        ),
        DOMUtils.createElement(
          "p",
          { class: "subtitle" },
          "Ready to streamline your recruitment process? Choose your workspace below."
        ),
      ]),

      DOMUtils.createElement("div", { class: "grid grid-2" }, [
        // Workspace selection
        UIComponents.createSection("Choose a workspace", [
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "Pick Sales or Recruitment to continue"
          ),
          DOMUtils.createElement("div", { class: "grid grid-2" }, [
            UIComponents.createSection("Sales", [
              DOMUtils.createElement(
                "p",
                {},
                "Tools for crafting sales job descriptions with AI."
              ),
              UIComponents.createButton("Go to Sales", { href: "#/sales" }),
            ]),
            UIComponents.createSection("Recruitment", [
              DOMUtils.createElement(
                "p",
                {},
                "End-to-end recruiter workflow assistance."
              ),
              UIComponents.createButton("Go to Recruitment", {
                href: "#/recruitment",
              }),
            ]),
          ]),
        ]),

        // User dashboard
        UIComponents.createSection("Your Dashboard", [
          Views.createDashboardStats(jobDescriptions),
          DOMUtils.createElement(
            "div",
            { class: "grid", style: "margin-top: 16px;" },
            [
              UIComponents.createButton("View All Job Descriptions", {
                href: "#/jd-view",
                style: "width: 100%; justify-content: center;",
              }),
              UIComponents.createButton("Start Sourcing", {
                href: "#/sourcing",
                variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                style: "width: 100%; justify-content: center;",
              }),
            ]
          ),
        ]),
      ]),
    ]);
  },

  /**
   * Render home page for unauthenticated users
   * @returns {Element} Unauthenticated home view
   */
  renderUnauthenticatedHome() {
    return DOMUtils.createElement("div", { class: "container" }, [
      DOMUtils.createElement("div", { class: "grid grid-2" }, [
        UIComponents.createSection("Choose a workspace", [
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "Pick Sales or Recruitment to continue"
          ),
          DOMUtils.createElement("div", { class: "grid grid-2" }, [
            UIComponents.createSection("Sales", [
              DOMUtils.createElement(
                "p",
                {},
                "Tools for crafting sales job descriptions with AI."
              ),
              UIComponents.createButton("Go to Sales", { href: "#/sales" }),
            ]),
            UIComponents.createSection("Recruitment", [
              DOMUtils.createElement(
                "p",
                {},
                "End-to-end recruiter workflow assistance."
              ),
              UIComponents.createButton("Go to Recruitment", {
                href: "#/recruitment",
              }),
            ]),
          ]),
        ]),
        UIComponents.createSection("Get Started", [
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "Sign in to save your work and access all features"
          ),
          DOMUtils.createElement("div", { class: "grid" }, [
            UIComponents.createButton("Login", { href: "#/login" }),
            UIComponents.createButton("Sign up", {
              variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
              href: "#/signup",
            }),
          ]),
        ]),
      ]),
    ]);
  },

  /**
   * Create dashboard stats for authenticated users
   * @param {Array} jobDescriptions - User's job descriptions
   * @returns {Element} Stats element
   */
  createDashboardStats(jobDescriptions) {
    const stats = [
      {
        label: "Job Descriptions",
        value: jobDescriptions.length,
        color: "#2563eb",
      },
      { label: "Active Tools", value: "2", color: "#10b981" },
      { label: "Coming Soon", value: "3", color: "#f59e0b" },
    ];

    return DOMUtils.createElement(
      "div",
      {
        style:
          "display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px;",
      },
      stats.map((stat) =>
        DOMUtils.createElement(
          "div",
          {
            style:
              "text-align: center; flex: 1; padding: 12px; background: #f8fafc; border-radius: 8px;",
          },
          [
            DOMUtils.createElement(
              "div",
              {
                style: `font-size: 20px; font-weight: 700; color: ${stat.color}; margin-bottom: 4px;`,
              },
              stat.value
            ),
            DOMUtils.createElement(
              "div",
              {
                style:
                  "font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;",
              },
              stat.label
            ),
          ]
        )
      )
    );
  },

  /**
   * Login screen
   * @returns {Element} Login view element
   */
  Login() {
    const handleSubmit = async (event) => {
      event.preventDefault();

      const credentials = {
        username: DOMUtils.select("#login-username").value.trim(),
        password: DOMUtils.select("#login-password").value,
      };

      const errors = ValidationUtils.validateLogin(credentials);

      if (Object.keys(errors).length > 0) {
        const errorMessage = Object.values(errors).join(". ");
        showNotification(errorMessage, "error");
        return;
      }

      try {
        const users = StorageManager.loadUsers();
        const user = users.find(
          (u) => u.username.toLowerCase() === credentials.username.toLowerCase()
        );

        if (!user) {
          showNotification("Invalid username or password.", "error");
          return;
        }

        // Debug logging
        console.log("User found:", {
          username: user.username,
          hasHashedPassword: !!user.hashedPassword,
          hasSalt: !!user.salt,
          hasLegacyPassword: !!user.password,
          userData: user,
        });

        // Verify password - handle both old and new user data structures
        let isValidPassword = false;

        if (user.hashedPassword && user.salt) {
          // New secure password verification
          console.log("Using secure password verification");
          isValidPassword = await PasswordSecurity.verifyPassword(
            credentials.password,
            user.hashedPassword,
            user.salt
          );
          console.log("Secure verification result:", isValidPassword);
        } else if (user.password) {
          // Legacy password verification (plain text comparison)
          console.log("Using legacy password verification");
          console.log("Entered password:", credentials.password);
          console.log("Stored password:", user.password);
          isValidPassword = credentials.password === user.password;
          console.log("Legacy verification result:", isValidPassword);

          // If legacy login is successful, upgrade the user to secure hashing
          if (isValidPassword) {
            try {
              const { hashedPassword, salt } =
                await PasswordSecurity.hashPassword(credentials.password);
              user.hashedPassword = hashedPassword;
              user.salt = salt;
              delete user.password; // Remove plain text password

              // Update user in storage
              const users = StorageManager.loadUsers();
              const userIndex = users.findIndex(
                (u) => u.username.toLowerCase() === user.username.toLowerCase()
              );
              if (userIndex !== -1) {
                users[userIndex] = user;
                StorageManager.saveUsers(users);
                console.log("User password upgraded to secure hashing");
              }
            } catch (error) {
              console.error("Error upgrading user password:", error);
              // Continue with login even if upgrade fails
            }
          }
        } else {
          // No password field found - invalid user data
          showNotification(
            "Account data is corrupted. Please contact support.",
            "error"
          );
          return;
        }

        if (!isValidPassword) {
          showNotification("Invalid username or password.", "error");
          return;
        }

        // Set current user (without password data)
        StorageManager.setCurrentUser({
          username: user.username,
          first: user.first,
          last: user.last,
          email: user.email,
        });

        showNotification(
          `Welcome back, ${user.first || user.username}!`,
          "success"
        );
        location.hash = "#/";
        NavigationManager.updateHeaderAuth();
      } catch (error) {
        console.error("Login error:", error);
        showNotification("Login failed. Please try again.", "error");
      }
    };

    return DOMUtils.createElement("div", { class: "full-center" }, [
      DOMUtils.createElement("div", { class: "card centered network" }, [
        DOMUtils.createElement(
          "h2",
          { class: "section-title" },
          "AI for recruitment"
        ),
        DOMUtils.createElement("p", { class: "subtitle" }, "Welcome back"),
        DOMUtils.createElement(
          "form",
          { class: "form", onsubmit: handleSubmit },
          [
            UIComponents.createLabel("login-username", "Username"),
            UIComponents.createTextInput(
              "Username",
              CONSTANTS.INPUT_TYPES.TEXT,
              "username",
              "login-username"
            ),
            UIComponents.createLabel("login-password", "Password"),
            DOMUtils.createElement(
              "div",
              { class: "password-input-container" },
              [
                DOMUtils.createElement("input", {
                  class: "input",
                  id: "login-password",
                  type: CONSTANTS.INPUT_TYPES.PASSWORD,
                  name: "password",
                  placeholder: "Enter your password",
                  style: "padding-right: 40px;",
                }),
                DOMUtils.createElement(
                  "button",
                  {
                    type: "button",
                    class: "password-toggle-btn",
                    id: "login-password-toggle",
                    onclick: () => {
                      const passwordInput = DOMUtils.select("#login-password");
                      const toggleBtn = DOMUtils.select(
                        "#login-password-toggle"
                      );

                      if (passwordInput.type === "password") {
                        passwordInput.type = "text";
                        toggleBtn.innerHTML = "👁️";
                        toggleBtn.title = "Hide password";
                      } else {
                        passwordInput.type = "password";
                        toggleBtn.innerHTML = "🙈";
                        toggleBtn.title = "Show password";
                      }
                    },
                    title: "Show password",
                    style:
                      "position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;",
                  },
                  "🙈"
                ),
              ]
            ),
            UIComponents.createButton("Login"),
            UIComponents.createButton("Sign up", {
              variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
              href: "#/signup",
            }),
          ]
        ),
      ]),
    ]);
  },

  /**
   * Signup screen
   * @returns {Element} Signup view element
   */
  Signup() {
    const handleSubmit = async (event) => {
      event.preventDefault();

      const fields = {
        first: DOMUtils.select("#su-first").value.trim(),
        last: DOMUtils.select("#su-last").value.trim(),
        username: DOMUtils.select("#su-username").value.trim(),
        email: DOMUtils.select("#su-email").value.trim(),
        password: DOMUtils.select("#su-password").value,
      };

      const errors = ValidationUtils.validateSignup(fields);

      if (Object.keys(errors).length > 0) {
        const errorMessage = Object.values(errors)
          .map((error) => `- ${error}`)
          .join("<br>");
        showNotification(errorMessage, "error");
        return;
      }

      try {
        // Hash the password securely
        const { hashedPassword, salt } = await PasswordSecurity.hashPassword(
          fields.password
        );

        // Create user object without storing plain text password
        const newUser = {
          username: fields.username,
          email: fields.email,
          first: fields.first,
          last: fields.last,
          hashedPassword: hashedPassword,
          salt: salt,
          createdAt: new Date().toISOString(),
        };

        const users = StorageManager.loadUsers();
        users.push(newUser);
        StorageManager.saveUsers(users);

        showNotification(
          "Account created successfully! You can now login.",
          "success"
        );
        setTimeout(() => {
          location.hash = "#/login";
        }, 1500);
      } catch (error) {
        console.error("Signup error:", error);
        showNotification("Account creation failed. Please try again.", "error");
      }
    };

    const handlePasswordChange = () => {
      const password = DOMUtils.select("#su-password").value;
      const strengthIndicator = DOMUtils.select("#password-strength");

      if (strengthIndicator && password) {
        const validation = PasswordSecurity.validatePasswordStrength(password);
        const strength = validation.strength;

        let strengthText = "";
        let strengthColor = "";

        if (strength < 30) {
          strengthText = "Weak";
          strengthColor = "#ef4444";
        } else if (strength < 60) {
          strengthText = "Medium";
          strengthColor = "#f59e0b";
        } else if (strength < 80) {
          strengthText = "Good";
          strengthColor = "#10b981";
        } else {
          strengthText = "Strong";
          strengthColor = "#059669";
        }

        strengthIndicator.textContent = `Password Strength: ${strengthText} (${strength}%)`;
        strengthIndicator.style.color = strengthColor;
        strengthIndicator.style.fontSize = "12px";
        strengthIndicator.style.marginTop = "4px";
      }
    };

    return UIComponents.createSection("Create your account", [
      DOMUtils.createElement(
        "form",
        { class: "form", onsubmit: handleSubmit },
        [
          UIComponents.createLabel("su-first", "First Name"),
          UIComponents.createTextInput(
            "First Name",
            CONSTANTS.INPUT_TYPES.TEXT,
            "first",
            "su-first"
          ),
          UIComponents.createLabel("su-last", "Last Name"),
          UIComponents.createTextInput(
            "Last Name",
            CONSTANTS.INPUT_TYPES.TEXT,
            "last",
            "su-last"
          ),
          UIComponents.createLabel("su-username", "Username"),
          UIComponents.createTextInput(
            "Username",
            CONSTANTS.INPUT_TYPES.TEXT,
            "username",
            "su-username"
          ),
          UIComponents.createLabel("su-email", "Email"),
          UIComponents.createTextInput(
            "Email",
            CONSTANTS.INPUT_TYPES.EMAIL,
            "email",
            "su-email"
          ),
          UIComponents.createLabel("su-password", "Password"),
          DOMUtils.createElement("div", { class: "password-input-container" }, [
            DOMUtils.createElement("input", {
              class: "input",
              id: "su-password",
              type: CONSTANTS.INPUT_TYPES.PASSWORD,
              name: "password",
              placeholder: "Create a strong password",
              oninput: handlePasswordChange,
              style: "padding-right: 40px;",
            }),
            DOMUtils.createElement(
              "button",
              {
                type: "button",
                class: "password-toggle-btn",
                id: "su-password-toggle",
                onclick: () => {
                  const passwordInput = DOMUtils.select("#su-password");
                  const toggleBtn = DOMUtils.select("#su-password-toggle");

                  if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    toggleBtn.innerHTML = "👁️";
                    toggleBtn.title = "Hide password";
                  } else {
                    passwordInput.type = "password";
                    toggleBtn.innerHTML = "🙈";
                    toggleBtn.title = "Show password";
                  }
                },
                title: "Show password",
                style:
                  "position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;",
              },
              "🙈"
            ),
          ]),
          DOMUtils.createElement("div", { id: "password-strength" }),
          DOMUtils.createElement(
            "div",
            {
              style: "margin: 8px 0; font-size: 12px; color: #6b7280;",
            },
            [
              DOMUtils.createElement(
                "p",
                { style: "margin: 4px 0;" },
                "Password requirements:"
              ),
              DOMUtils.createElement(
                "ul",
                { style: "margin: 4px 0; padding-left: 16px;" },
                [
                  DOMUtils.createElement(
                    "li",
                    {},
                    "At least 8 characters long"
                  ),
                  DOMUtils.createElement(
                    "li",
                    {},
                    "Contains uppercase and lowercase letters"
                  ),
                  DOMUtils.createElement(
                    "li",
                    {},
                    "Contains at least one number"
                  ),
                  DOMUtils.createElement(
                    "li",
                    {},
                    "Contains at least one special character"
                  ),
                ]
              ),
            ]
          ),
          UIComponents.createButton("Sign up"),
          DOMUtils.createElement("div", {}, [
            DOMUtils.createElement(
              "span",
              { class: "caption" },
              "Already have an account? "
            ),
            DOMUtils.createElement("a", { href: "#/login" }, "Login"),
          ]),
        ]
      ),
    ]);
  },

  /**
   * Sales workspace screen
   * @returns {Element} Sales view element
   */
  Sales() {
    return UIComponents.createSection("Sales Workspace", [
      DOMUtils.createElement("div", { class: "grid grid-2" }, [
        UIComponents.createSection("Job Description Builder", [
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "Create compelling sales job descriptions with AI assistance"
          ),
          UIComponents.createButton("Start Building", {
            href: "#/jd-builder",
            style: "width: 100%; justify-content: center;",
          }),
        ]),
        UIComponents.createSection("Your Sales JDs", [
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "View and manage your saved sales job descriptions"
          ),
          UIComponents.createButton("View All", {
            href: "#/jd-view",
            variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
            style: "width: 100%; justify-content: center;",
          }),
        ]),
      ]),
      DOMUtils.createElement(
        "div",
        { class: "grid grid-2", style: "margin-top: 24px;" },
        [
          UIComponents.createSection("Candidate Sourcing", [
            DOMUtils.createElement(
              "p",
              { class: "caption" },
              "Find top sales talent using AI-powered search strategies"
            ),
            UIComponents.createButton("Start Sourcing", {
              href: "#/sourcing",
              variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
              style: "width: 100%; justify-content: center;",
            }),
          ]),
          UIComponents.createSection("Quick Actions", [
            DOMUtils.createElement(
              "p",
              { class: "caption" },
              "Common sales recruitment tasks"
            ),
            DOMUtils.createElement("div", { class: "grid" }, [
              UIComponents.createButton("Back to Home", {
                href: "#/",
                variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
                style: "width: 100%; justify-content: center;",
              }),
            ]),
          ]),
        ]
      ),
    ]);
  },
};

// ============================================================================
// ROUTING
// ============================================================================

/**
 * Application routing configuration
 */
const Router = {
  routes: {
    "": Views.Home,
    "#/": Views.Home,
    "#/login": Views.Login,
    "#/signup": Views.Signup,
    // Additional routes will be added after Views object is extended
  },

  /**
   * Render the current view based on hash
   */
  render() {
    const root = DOMUtils.select("#app");
    if (!root) {
      console.error("App root element not found");
      return;
    }

    root.innerHTML = "";
    const currentHash = location.hash;
    const view = this.routes[currentHash] || Views.Home;

    try {
      const content = view();
      if (!content || !content.nodeType) {
        throw new Error(
          `View function returned invalid content: ${typeof content}`
        );
      }
      root.appendChild(content);
    } catch (error) {
      console.error("Error rendering content:", error);
      root.innerHTML = `
        <div class="container">
          <div class="card">
            <h2>Error</h2>
            <p>There was an error loading the page: ${error.message}</p>
          </div>
        </div>
      `;
    }
  },
};

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
function initializeApp() {
  // Set up event listeners
  window.addEventListener("hashchange", () => {
    Router.render();
    NavigationManager.updateHeaderAuth();
  });

  window.addEventListener("DOMContentLoaded", () => {
    const yearElement = DOMUtils.select("#year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
    Router.render();
    NavigationManager.updateHeaderAuth();
  });
}

// Start the application
initializeApp();
/**
 * Clean Views Implementation
 * Additional views and components for the clean codebase
 */

// ============================================================================
// ADDITIONAL VIEWS
// ============================================================================

// Extend the Views object with additional methods
Object.assign(Views, {
  /**
   * Job Description View screen
   * @returns {Element} JDView element
   */
  JDView() {
    const jobDescriptions = StorageManager.loadJobDescriptions();

    if (!jobDescriptions.length) {
      return DOMUtils.createElement("div", { class: "container" }, [
        DOMUtils.createElement("div", { class: "card network" }, [
          DOMUtils.createElement(
            "h2",
            { class: "section-title" },
            "Job Descriptions"
          ),
          DOMUtils.createElement(
            "p",
            { class: "subtitle" },
            "No saved items yet."
          ),
          UIComponents.createButton("Create one now", { href: "#/jd-builder" }),
        ]),
      ]);
    }

    const latest = jobDescriptions[0];
    const formatDate = (dateString) => new Date(dateString).toLocaleString();

    const jobDescriptionItems = jobDescriptions.map((jd) =>
      DOMUtils.createElement("div", { class: "item" }, [
        DOMUtils.createElement("span", {
          class: "icon",
          innerHTML:
            '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke-width="2"/><path d="M8 7h8M8 11h8M8 15h5" stroke-width="2"/></svg>',
        }),
        DOMUtils.createElement("div", {}, [
          DOMUtils.createElement("strong", {}, jd.title),
          DOMUtils.createElement(
            "div",
            { class: "caption" },
            formatDate(jd.createdAt)
          ),
        ]),
        UIComponents.createButton("View", {
          variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
          onClick: () => Views.showJobDescription(jd),
        }),
      ])
    );

    return DOMUtils.createElement("div", { class: "container" }, [
      DOMUtils.createElement("div", { class: "grid grid-2" }, [
        DOMUtils.createElement("section", { class: "card" }, [
          DOMUtils.createElement("h3", {}, "Latest"),
          DOMUtils.createElement(
            "pre",
            { style: "white-space:pre-wrap" },
            latest.content
          ),
          DOMUtils.createElement(
            "div",
            { style: "display:flex; gap:8px; flex-wrap:wrap; marginTop:" },
            [
              UIComponents.createButton("Copy", {
                onClick: () => copyToClipboard(latest.content),
              }),
              UIComponents.createButton("Download .txt", {
                onClick: () =>
                  downloadText(
                    StringUtils.toFilename(latest.title || "job-description") +
                      ".txt",
                    latest.content
                  ),
              }),
              UIComponents.createButton("Open builder", {
                variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
                href: "#/jd-builder",
              }),
            ]
          ),
        ]),
        DOMUtils.createElement("section", { class: "card" }, [
          DOMUtils.createElement("h3", {}, "Saved job descriptions"),
          DOMUtils.createElement("div", { class: "list" }, jobDescriptionItems),
        ]),
      ]),
    ]);
  },

  /**
   * Show detailed job description view
   * @param {Object} jobDescription - Job description object
   */
  showJobDescription(jobDescription) {
    const handlePolish = async () => {
      try {
        const instructions = DOMUtils.select("#polish-notes").value.trim();
        if (!instructions) {
          showNotification("Add what you want to polish.", "error");
          return;
        }

        const systemPrompt =
          "You are a meticulous recruiter editor. Improve clarity, grammar, flow, and impact. Keep structure and bullet points. Do not invent facts; only refine based on the user's instructions.";
        const content = `Original JD:\n\n${jobDescription.content}\n\nPolish instructions:\n${instructions}`;

        const polished = StorageManager.isProxyEnabled()
          ? await AIService.polishViaProxy(jobDescription.content, instructions)
          : await AIService.chat([
              { role: "system", content: systemPrompt },
              { role: "user", content: content },
            ]);

        DOMUtils.select("#jd-text").textContent = polished;
      } catch (error) {
        showNotification(error.message || String(error), "error");
      }
    };

    const handleSaveFinal = () => {
      const jobDescriptions = StorageManager.loadJobDescriptions();
      const updated = jobDescriptions.map((jd) =>
        jd.id === jobDescription.id
          ? {
              ...jd,
              text: DOMUtils.select("#jd-text").textContent,
              final: true,
            }
          : jd
      );

      StorageManager.saveJobDescriptions(updated);
      showNotification("Saved final version.", "success");
      location.hash = "#/jd-view";
    };

    const root = DOMUtils.select("#app");
    root.innerHTML = "";
    root.appendChild(
      DOMUtils.createElement("div", { class: "container" }, [
        DOMUtils.createElement("div", { class: "card network" }, [
          DOMUtils.createElement(
            "h2",
            { class: "section-title" },
            jobDescription.title
          ),
          DOMUtils.createElement(
            "pre",
            {
              id: "jd-text",
              style: "white-space:pre-wrap",
            },
            jobDescription.content
          ),
          DOMUtils.createElement(
            "div",
            { class: "card", style: "margin-top:12px" },
            [
              DOMUtils.createElement("h4", {}, "Polish with AI"),
              DOMUtils.createElement("textarea", {
                class: "input",
                id: "polish-notes",
                rows: 4,
                placeholder:
                  "e.g., make it punchier, emphasize cloud migration, reduce buzzwords, add measurable KPIs...",
              }),
              DOMUtils.createElement(
                "div",
                { style: "display:flex; gap:8px; margin-top:8px" },
                [
                  UIComponents.createButton("Polish with AI", {
                    onClick: handlePolish,
                  }),
                ]
              ),
            ]
          ),
          DOMUtils.createElement(
            "div",
            {
              style: "display:flex; gap:8px; flex-wrap:wrap; margin-top:8px",
            },
            [
              UIComponents.createButton("Copy", {
                onClick: () => copyToClipboard(jobDescription.content),
              }),
              UIComponents.createButton("Download .txt", {
                onClick: () =>
                  downloadText(
                    StringUtils.toFilename(
                      jobDescription.title || "job-description"
                    ) + ".txt",
                    jobDescription.content
                  ),
              }),
              UIComponents.createButton("Back to list", {
                variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
                onClick: () => {
                  location.hash = "#/jd-view";
                },
              }),
              UIComponents.createButton("Save Final", {
                onClick: handleSaveFinal,
              }),
            ]
          ),
        ]),
      ])
    );
  },

  /**
   * Sourcing screen
   * @returns {Element} Sourcing view element
   */
  Sourcing() {
    const jobDescriptions = StorageManager.loadJobDescriptions();

    const state = {
      selectedJobDescription: null,
      customJobDescription: "",
      jobDescriptionSource:
        jobDescriptions.length > 0
          ? CONSTANTS.JD_SOURCES.SAVED
          : CONSTANTS.JD_SOURCES.CUSTOM,
      location: "",
      isLoading: false,
      results: null,
      loadingStep: 0,
    };

    // Define rerender function first
    let rerenderSourcing;

    const handleJobDescriptionSelect = (jd) => {
      state.selectedJobDescription = jd;
      state.results = null;
      rerenderSourcing();
    };

    const handleSourceChange = (source) => {
      state.jobDescriptionSource = source;
      state.results = null;
      if (source === CONSTANTS.JD_SOURCES.SAVED) {
        state.customJobDescription = "";
      } else {
        state.selectedJobDescription = null;
      }
      rerenderSourcing();
    };

    const getCurrentJobDescriptionText = () => {
      if (
        state.jobDescriptionSource === CONSTANTS.JD_SOURCES.SAVED &&
        state.selectedJobDescription
      ) {
        return state.selectedJobDescription.content;
      } else if (
        state.jobDescriptionSource === CONSTANTS.JD_SOURCES.CUSTOM &&
        state.customJobDescription.trim()
      ) {
        return state.customJobDescription.trim();
      }
      return null;
    };

    const handleLocationSubmit = async () => {
      const jobDescriptionText = getCurrentJobDescriptionText();
      if (!jobDescriptionText || !state.location.trim()) {
        showNotification(
          "Please provide a job description and enter a location.",
          "error"
        );
        return;
      }

      state.isLoading = true;
      state.loadingStep = 1;
      rerenderSourcing();

      const progressInterval = setInterval(() => {
        if (state.loadingStep < CONSTANTS.UI.PROGRESS_STEPS.length) {
          state.loadingStep++;
          rerenderSourcing();
        }
      }, 1000);

      try {
        const results = StorageManager.isProxyEnabled()
          ? await AIService.sourcingViaProxy(jobDescriptionText, state.location)
          : await AIService.generateSourcingStrategy(
              jobDescriptionText,
              state.location
            );

        clearInterval(progressInterval);
        state.results = results;
      } catch (error) {
        clearInterval(progressInterval);
        showNotification(
          "Error generating sourcing strategy: " + error.message,
          "error"
        );
      } finally {
        state.isLoading = false;
        state.loadingStep = 0;
        rerenderSourcing();
      }
    };

    const copySearchString = (text) => {
      copyToClipboard(text);
    };

    rerenderSourcing = () => {
      const root = DOMUtils.select("#app");
      root.innerHTML = "";
      root.appendChild(
        Views.renderSourcingInterface(
          jobDescriptions,
          state,
          handleJobDescriptionSelect,
          handleSourceChange,
          handleLocationSubmit,
          copySearchString
        )
      );
    };

    // Initial render
    setTimeout(() => {
      rerenderSourcing();
    }, 0);

    return DOMUtils.createElement("div"); // Placeholder
  },

  /**
   * Render sourcing interface
   * @param {Array} jobDescriptions - Available job descriptions
   * @param {Object} state - Current state
   * @param {Function} onJDSelect - JD selection handler
   * @param {Function} onSourceChange - Source change handler
   * @param {Function} onLocationSubmit - Location submit handler
   * @param {Function} onCopySearch - Copy search handler
   * @returns {Element} Sourcing interface element
   */
  renderSourcingInterface(
    jobDescriptions,
    state,
    onJDSelect,
    onSourceChange,
    onLocationSubmit,
    onCopySearch
  ) {
    return DOMUtils.createElement("div", { class: "container" }, [
      DOMUtils.createElement("div", { class: "card network" }, [
        DOMUtils.createElement(
          "h2",
          { class: "section-title" },
          "Sourcing Consultants"
        ),
        DOMUtils.createElement(
          "p",
          { class: "subtitle" },
          "Generate Boolean search strings for finding candidates"
        ),

        // Show helpful message when no saved JDs exist
        jobDescriptions.length === 0 &&
          DOMUtils.createElement(
            "div",
            {
              style:
                "margin-bottom: 20px; padding: 16px; background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px;",
            },
            [
              DOMUtils.createElement(
                "p",
                {
                  style: "margin: 0 0 8px 0; font-weight: 500; color: #1e40af;",
                },
                "💡 Quick Start"
              ),
              DOMUtils.createElement(
                "p",
                { style: "margin: 0; font-size: 14px; color: #1e40af;" },
                "No saved job descriptions? No problem! You can paste any job description directly into the text area below to generate sourcing strategies."
              ),
            ]
          ),

        DOMUtils.createElement("div", { class: "form" }, [
          DOMUtils.createElement(
            "label",
            { style: "font-weight: 600; margin-bottom: 12px; display: block;" },
            "Job Description Source:"
          ),

          // Radio buttons for JD source selection
          DOMUtils.createElement(
            "div",
            { style: "display: flex; gap: 20px; margin-bottom: 16px;" },
            [
              DOMUtils.createElement(
                "label",
                {
                  style:
                    "display: flex; align-items: center; gap: 8px; cursor: pointer;",
                },
                [
                  DOMUtils.createElement("input", {
                    type: "radio",
                    name: "jd-source",
                    value: CONSTANTS.JD_SOURCES.SAVED,
                    checked:
                      state.jobDescriptionSource === CONSTANTS.JD_SOURCES.SAVED,
                    disabled: state.isLoading,
                    onchange: () => onSourceChange(CONSTANTS.JD_SOURCES.SAVED),
                    style: "margin: 0;",
                  }),
                  DOMUtils.createElement(
                    "span",
                    {},
                    "Use Saved Job Description"
                  ),
                ]
              ),
              DOMUtils.createElement(
                "label",
                {
                  style:
                    "display: flex; align-items: center; gap: 8px; cursor: pointer;",
                },
                [
                  DOMUtils.createElement("input", {
                    type: "radio",
                    name: "jd-source",
                    value: CONSTANTS.JD_SOURCES.CUSTOM,
                    checked:
                      state.jobDescriptionSource ===
                      CONSTANTS.JD_SOURCES.CUSTOM,
                    disabled: state.isLoading,
                    onchange: () => onSourceChange(CONSTANTS.JD_SOURCES.CUSTOM),
                    style: "margin: 0;",
                  }),
                  DOMUtils.createElement(
                    "span",
                    {},
                    "Paste Custom Job Description"
                  ),
                ]
              ),
            ]
          ),

          // Saved JD selection
          state.jobDescriptionSource === CONSTANTS.JD_SOURCES.SAVED &&
            DOMUtils.createElement("div", { style: "margin-bottom: 16px;" }, [
              DOMUtils.createElement(
                "label",
                { for: "jd-select" },
                "Select Job Description:"
              ),
              jobDescriptions.length > 0
                ? DOMUtils.createElement(
                    "select",
                    {
                      id: "jd-select",
                      class: "input",
                      disabled: state.isLoading,
                      onchange: (e) =>
                        onJDSelect(
                          jobDescriptions.find((jd) => jd.id === e.target.value)
                        ),
                      style: state.isLoading
                        ? "opacity: 0.6; cursor: not-allowed;"
                        : "",
                    },
                    [
                      DOMUtils.createElement(
                        "option",
                        { value: "" },
                        "Choose a job description..."
                      ),
                      ...jobDescriptions.map((jd) =>
                        DOMUtils.createElement(
                          "option",
                          {
                            value: jd.id,
                          },
                          `${jd.title} - ${new Date(
                            jd.createdAt
                          ).toLocaleDateString()}`
                        )
                      ),
                    ]
                  )
                : DOMUtils.createElement(
                    "div",
                    {
                      style:
                        "padding: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; color: #92400e;",
                    },
                    [
                      DOMUtils.createElement(
                        "p",
                        { style: "margin: 0 0 8px 0; font-weight: 500;" },
                        "No saved job descriptions found."
                      ),
                      DOMUtils.createElement(
                        "div",
                        { style: "margin: 0; font-size: 14px;" },
                        [
                          DOMUtils.createElement(
                            "p",
                            { style: "margin: 0 0 8px 0;" },
                            "Create one using the Job Description Builder or use the 'Paste Custom Job Description' option above."
                          ),
                          UIComponents.createButton("Create Job Description", {
                            href: "#/jd-builder",
                            style: "padding: 8px 16px; font-size: 14px;",
                          }),
                        ]
                      ),
                    ]
                  ),
            ]),

          // Custom JD textarea
          state.jobDescriptionSource === CONSTANTS.JD_SOURCES.CUSTOM &&
            DOMUtils.createElement("div", { style: "margin-bottom: 16px;" }, [
              DOMUtils.createElement(
                "label",
                { for: "custom-jd" },
                "Paste Your Job Description:"
              ),
              DOMUtils.createElement("textarea", {
                id: "custom-jd",
                class: "input",
                placeholder: "Paste your job description here...",
                rows: CONSTANTS.UI.TEXTAREA_ROWS,
                disabled: state.isLoading,
                value: state.customJobDescription,
                oninput: (e) => {
                  state.customJobDescription = e.target.value;
                  state.results = null;
                },
                style: state.isLoading
                  ? "opacity: 0.6; cursor: not-allowed;"
                  : "",
              }),
            ]),

          // Preview section
          (state.selectedJobDescription ||
            (state.jobDescriptionSource === CONSTANTS.JD_SOURCES.CUSTOM &&
              state.customJobDescription.trim())) &&
            DOMUtils.createElement(
              "div",
              {
                class: "card",
                style: "margin: 10px 0; background: #f8f9fa",
              },
              [
                DOMUtils.createElement(
                  "h4",
                  {},
                  state.jobDescriptionSource === CONSTANTS.JD_SOURCES.CUSTOM
                    ? "Custom Job Description Preview:"
                    : "Selected Job Description:"
                ),
                DOMUtils.createElement(
                  "pre",
                  {
                    style:
                      "white-space: pre-wrap; font-size: 12px; max-height: 200px; overflow-y: auto",
                  },
                  state.jobDescriptionSource === CONSTANTS.JD_SOURCES.CUSTOM
                    ? StringUtils.truncate(state.customJobDescription)
                    : StringUtils.truncate(state.selectedJobDescription.content)
                ),
              ]
            ),

          // Location input
          DOMUtils.createElement(
            "label",
            { for: "location-input" },
            "Job Location:"
          ),
          DOMUtils.createElement("input", {
            id: "location-input",
            class: "input",
            placeholder: "e.g., New York, Remote, San Francisco",
            value: state.location,
            disabled: state.isLoading,
            oninput: (e) => {
              state.location = e.target.value;
            },
            style: state.isLoading ? "opacity: 0.6; cursor: not-allowed;" : "",
          }),

          // Submit button or loading state
          state.isLoading
            ? Views.renderLoadingState(state)
            : UIComponents.createButton("Generate Sourcing Strategy", {
                onClick: onLocationSubmit,
                style: "width: 100%; justify-content: center;",
              }),
        ]),

        // Results section
        state.results &&
          Views.renderSourcingResults(state.results, onCopySearch),
      ]),
    ]);
  },

  /**
   * Render loading state for sourcing
   * @param {Object} state - Current state object
   * @returns {Element} Loading state element
   */
  renderLoadingState(state) {
    const currentStep =
      CONSTANTS.UI.PROGRESS_STEPS[state.loadingStep - 1] || "Starting...";
    const progress =
      (state.loadingStep / CONSTANTS.UI.PROGRESS_STEPS.length) * 100;

    return DOMUtils.createElement(
      "div",
      {
        style:
          "display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: #6b7280; color: white; border-radius: 999px; width: 100%; font-weight: 600; cursor: not-allowed;",
      },
      [
        DOMUtils.createElement("div", {
          class: "loading-spinner",
          style:
            "width: 16px; height: 16px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%;",
        }),
        "Generating sourcing strategy...",
      ]
    );
  },

  /**
   * Render sourcing results
   * @param {Object} results - Sourcing results
   * @param {Function} onCopySearch - Copy search handler
   * @returns {Element} Results element
   */
  renderSourcingResults(results, onCopySearch) {
    return DOMUtils.createElement(
      "div",
      { class: "card", style: "margin-top: 20px" },
      [
        DOMUtils.createElement("h3", {}, "Sourcing Strategy"),
        DOMUtils.createElement(
          "p",
          { class: "subtitle" },
          results.summary || ""
        ),

        DOMUtils.createElement(
          "h4",
          { style: "margin-top: 20px" },
          "Dice Job Portal Search"
        ),
        DOMUtils.createElement(
          "div",
          { class: "card", style: "background: #f8f9fa; margin: 10px 0" },
          [
            DOMUtils.createElement(
              "pre",
              {
                style:
                  "white-space: pre-wrap; font-family: monospace; font-size: 12px; margin: 0",
              },
              results.diceSearch || "No Dice search string generated"
            ),
            UIComponents.createButton("Copy Dice Search", {
              variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
              onClick: () => onCopySearch(results.diceSearch),
            }),
          ]
        ),

        DOMUtils.createElement(
          "h4",
          { style: "margin-top: 20px" },
          "Company-Specific LinkedIn Searches"
        ),
        DOMUtils.createElement(
          "p",
          {
            style:
              "margin: 8px 0 16px 0; font-size: 14px; color: #6b7280; font-style: italic;",
          },
          "Each search string targets candidates from the specific company listed. Copy and paste these into Google or LinkedIn search to find relevant profiles."
        ),
        DOMUtils.createElement(
          "div",
          { class: "grid" },
          (results.companies || []).map((company) =>
            DOMUtils.createElement("div", { class: "card" }, [
              DOMUtils.createElement("h5", {}, company.name),
              DOMUtils.createElement(
                "p",
                { class: "caption" },
                company.reason || ""
              ),
              DOMUtils.createElement(
                "div",
                { class: "card", style: "background: #f8f9fa; margin: 10px 0" },
                [
                  DOMUtils.createElement(
                    "pre",
                    {
                      style:
                        "white-space: pre-wrap; font-family: monospace; font-size: 12px; margin: 0",
                    },
                    company.linkedinSearch || "No search string generated"
                  ),
                  UIComponents.createButton("Copy LinkedIn Search", {
                    variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                    onClick: () => onCopySearch(company.linkedinSearch),
                  }),
                ]
              ),
            ])
          )
        ),
      ]
    );
  },

  /**
   * Recruitment screen
   * @returns {Element} Recruitment view element
   */
  Recruitment() {
    const icons = {
      posting:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke-width="2"/><path d="M8 7h8M8 11h8M8 15h5" stroke-width="2"/></svg>',
      search:
        '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke-width="2"/></svg>',
      check:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M20 7l-9 9-5-5" stroke-width="2"/></svg>',
      calendar:
        '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke-width="2"/><path d="M16 3v4M8 3v4M3 11h18" stroke-width="2"/></svg>',
      feedback:
        '<svg viewBox="0 0 24 24" fill="none"><path d="M21 15a4 4 0 0 1-4 4H8l-4 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8z" stroke-width="2"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke-width="2"/></svg>',
    };

    const createFeatureCard = (
      title,
      description,
      iconSvg,
      action,
      status = "available"
    ) => {
      const statusColor =
        status === "available"
          ? "#10b981"
          : status === "coming-soon"
          ? "#f59e0b"
          : "#6b7280";
      const statusText =
        status === "available"
          ? "Ready"
          : status === "coming-soon"
          ? "Coming Soon"
          : "In Development";

      return DOMUtils.createElement(
        "div",
        {
          class: "card",
          style: `border-left: 4px solid ${statusColor}; position: relative;`,
        },
        [
          DOMUtils.createElement(
            "div",
            {
              style:
                "display: flex; align-items: center; gap: 12px; margin-bottom: 8px;",
            },
            [
              DOMUtils.createElement("span", {
                class: "icon",
                innerHTML: iconSvg,
                style: `color: ${statusColor};`,
              }),
              DOMUtils.createElement(
                "h3",
                { style: "margin: 0; font-size: 18px;" },
                title
              ),
              DOMUtils.createElement(
                "span",
                {
                  style: `background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;`,
                },
                statusText
              ),
            ]
          ),
          DOMUtils.createElement(
            "p",
            {
              style:
                "margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;",
            },
            description
          ),
          action &&
            DOMUtils.createElement(
              "div",
              { style: "margin-top: auto;" },
              action
            ),
        ]
      );
    };

    return DOMUtils.createElement("div", { class: "container" }, [
      DOMUtils.createElement("div", { class: "card network" }, [
        DOMUtils.createElement(
          "div",
          { style: "text-align: center; margin-bottom: 32px;" },
          [
            DOMUtils.createElement(
              "h2",
              { class: "section-title" },
              "AI-Powered Recruitment Hub"
            ),
            DOMUtils.createElement(
              "p",
              {
                class: "subtitle",
                style: "font-size: 16px; max-width: 600px; margin: 0 auto;",
              },
              "Streamline your recruitment process with intelligent tools designed for modern recruiters"
            ),
          ]
        ),

        DOMUtils.createElement(
          "div",
          { class: "grid grid-2", style: "gap: 20px;" },
          [
            createFeatureCard(
              "Job Description Builder",
              "Create compelling, AI-generated job descriptions that attract top talent. Includes company-specific formatting and ATS optimization.",
              icons.posting,
              UIComponents.createButton("Create Job Description", {
                href: "#/jd-builder",
                style: "width: 100%; justify-content: center;",
              }),
              "available"
            ),

            createFeatureCard(
              "Smart Candidate Sourcing",
              "Generate targeted Boolean search strings for LinkedIn and job portals. Find candidates from top companies with relevant skills.",
              icons.search,
              UIComponents.createButton("Start Sourcing", {
                href: "#/sourcing",
                style: "width: 100%; justify-content: center;",
              }),
              "available"
            ),

            createFeatureCard(
              "Candidate Validation",
              "AI-powered screening and validation tools to quickly assess candidate fit and qualifications.",
              icons.check,
              UIComponents.createButton("Coming Soon", {
                variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                style: "width: 100%; justify-content: center; opacity: 0.6;",
                onClick: () =>
                  showNotification("This feature is coming soon!", "info"),
              }),
              "coming-soon"
            ),

            createFeatureCard(
              "Interview Scheduling",
              "Automated interview coordination with calendar integration and candidate communication.",
              icons.calendar,
              UIComponents.createButton("Coming Soon", {
                variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                style: "width: 100%; justify-content: center; opacity: 0.6;",
                onClick: () =>
                  showNotification("This feature is coming soon!", "info"),
              }),
              "coming-soon"
            ),

            createFeatureCard(
              "Interview Feedback",
              "Structured feedback collection and analysis to improve your hiring decisions.",
              icons.feedback,
              UIComponents.createButton("Coming Soon", {
                variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                style: "width: 100%; justify-content: center; opacity: 0.6;",
                onClick: () =>
                  showNotification("This feature is coming soon!", "info"),
              }),
              "coming-soon"
            ),

            createFeatureCard(
              "Quick Actions",
              "Access your saved job descriptions and recent sourcing strategies in one place.",
              icons.plus,
              DOMUtils.createElement(
                "div",
                { style: "display: flex; gap: 8px; flex-wrap: wrap;" },
                [
                  UIComponents.createButton("View All JDs", {
                    href: "#/jd-view",
                    variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
                    style: "flex: 1; min-width: 120px;",
                  }),
                  UIComponents.createButton("Settings", {
                    href: "#/settings",
                    variant: CONSTANTS.BUTTON_VARIANTS.LINK_LIKE,
                    style: "flex: 1; min-width: 120px;",
                  }),
                ]
              ),
              "available"
            ),
          ]
        ),

        // Stats Section
        DOMUtils.createElement(
          "div",
          {
            class: "card",
            style:
              "margin-top: 24px; background: linear-gradient(135deg, #f8fafc, #e2e8f0); text-align: center;",
          },
          [
            DOMUtils.createElement(
              "h3",
              { style: "margin: 0 0 8px 0; color: #1f2937;" },
              "Your Recruitment Dashboard"
            ),
            DOMUtils.createElement(
              "p",
              {
                style: "margin: 0; color: #6b7280; font-size: 14px;",
              },
              "Track your progress and manage your recruitment pipeline efficiently"
            ),
            DOMUtils.createElement(
              "div",
              {
                style:
                  "display: flex; justify-content: center; gap: 24px; margin-top: 16px; flex-wrap: wrap;",
              },
              [
                Views.createStatItem(
                  StorageManager.loadJobDescriptions().length,
                  "Job Descriptions"
                ),
                Views.createStatItem("2", "Active Tools"),
                Views.createStatItem("3", "Coming Soon"),
              ]
            ),
          ]
        ),
      ]),
    ]);
  },

  /**
   * Create stat item for dashboard
   * @param {string|number} value - Stat value
   * @param {string} label - Stat label
   * @returns {Element} Stat item element
   */
  createStatItem(value, label) {
    return DOMUtils.createElement("div", { style: "text-align: center;" }, [
      DOMUtils.createElement(
        "div",
        {
          style: "font-size: 24px; font-weight: 700; color: #2563eb;",
        },
        value
      ),
      DOMUtils.createElement(
        "div",
        {
          style:
            "font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;",
        },
        label
      ),
    ]);
  },

  /**
   * Settings screen
   * @returns {Element} Settings view element
   */
  Settings() {
    return DOMUtils.createElement("div", { class: "container" }, [
      DOMUtils.createElement("div", { class: "card network" }, [
        DOMUtils.createElement(
          "h2",
          { class: "section-title" },
          "System Configuration"
        ),
        UIComponents.createNotice(
          "✅ AI configuration is automatically handled by the system. No setup required!",
          "success"
        ),
        DOMUtils.createElement("div", { class: "form" }, [
          DOMUtils.createElement(
            "div",
            {
              style:
                "background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 16px;",
            },
            [
              DOMUtils.createElement(
                "h4",
                {
                  style: "margin: 0 0 12px 0; color: #1f2937;",
                },
                "Current Configuration"
              ),
              DOMUtils.createElement(
                "div",
                {
                  style: "display: grid; gap: 8px; font-size: 14px;",
                },
                [
                  DOMUtils.createElement("div", {}, [
                    DOMUtils.createElement("strong", {}, "AI Model: "),
                    DOMUtils.createElement(
                      "span",
                      { style: "color: #059669;" },
                      StorageManager.getModel()
                    ),
                  ]),
                  DOMUtils.createElement("div", {}, [
                    DOMUtils.createElement("strong", {}, "Proxy Status: "),
                    DOMUtils.createElement(
                      "span",
                      { style: "color: #059669;" },
                      "✅ Enabled"
                    ),
                  ]),
                  DOMUtils.createElement("div", {}, [
                    DOMUtils.createElement("strong", {}, "API Security: "),
                    DOMUtils.createElement(
                      "span",
                      { style: "color: #059669;" },
                      "✅ Server-side managed"
                    ),
                  ]),
                ]
              ),
            ]
          ),
          DOMUtils.createElement(
            "div",
            {
              style:
                "background: #eff6ff; padding: 16px; border-radius: 12px; border: 1px solid #3b82f6;",
            },
            [
              DOMUtils.createElement(
                "h4",
                {
                  style: "margin: 0 0 8px 0; color: #1e40af;",
                },
                "💡 About This Setup"
              ),
              DOMUtils.createElement(
                "p",
                {
                  style:
                    "margin: 0; font-size: 14px; color: #1e40af; line-height: 1.5;",
                },
                "The application uses a secure server-side configuration. API keys are stored safely on the server, and the optimal AI model is pre-selected for the best experience."
              ),
            ]
          ),
        ]),
      ]),
    ]);
  },

  /**
   * Job Description Builder screen
   * @returns {Element} JD Builder view element
   */
  JDBuilder() {
    return UIComponents.createSection("Job Description Builder", [
      DOMUtils.createElement("div", { class: "card" }, [
        DOMUtils.createElement(
          "h3",
          { class: "section-title" },
          "Create Your Job Description"
        ),
        DOMUtils.createElement(
          "p",
          { class: "caption" },
          "Answer a few questions and we'll generate a professional job description using AI"
        ),
        DOMUtils.createElement(
          "div",
          { class: "grid", style: "margin-top: 24px; gap: 16px;" },
          [
            UIComponents.createButton("Start Building", {
              onClick: () => {
                // Start the job description building process
                location.hash = "#/jd-builder/questions";
              },
              style: "width: 100%; justify-content: center;",
            }),
            UIComponents.createButton("View Examples", {
              href: "#/jd-view",
              variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
              style: "width: 100%; justify-content: center;",
            }),
          ]
        ),
      ]),
    ]);
  },

  /**
   * Create a skills input component with removable tags
   * @param {Array} skills - Array of current skills
   * @param {Function} onSkillsChange - Callback when skills change
   * @returns {Element} Skills input element
   */
  createSkillsInput(skills, onSkillsChange) {
    const skillsContainer = DOMUtils.createElement("div", {
      id: "skills-container",
      style: "margin-bottom: 24px;",
    });

    const input = DOMUtils.createElement("input", {
      type: "text",
      placeholder: "Type a skill and press Enter to add it...",
      class: "input",
      style: "width: 100%; margin-bottom: 12px;",
      onkeydown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const value = e.target.value.trim();
          if (value && !skills.includes(value)) {
            const newSkills = [...skills, value];
            onSkillsChange(newSkills);
            e.target.value = "";
            renderSkills();
          }
        }
      },
    });

    const renderSkills = () => {
      const tagsContainer = DOMUtils.createElement("div", {
        style: "display: flex; flex-wrap: wrap; gap: 8px; min-height: 32px;",
      });

      skills.forEach((skill, index) => {
        const tag = DOMUtils.createElement(
          "div",
          {
            style:
              "display: flex; align-items: center; background: #e0f2fe; border: 1px solid #0288d1; border-radius: 16px; padding: 4px 12px; font-size: 14px; color: #01579b;",
          },
          [
            DOMUtils.createElement("span", {}, skill),
            DOMUtils.createElement(
              "button",
              {
                type: "button",
                style:
                  "background: none; border: none; color: #01579b; margin-left: 8px; cursor: pointer; font-size: 16px; line-height: 1; padding: 0;",
                onclick: () => {
                  const newSkills = skills.filter((_, i) => i !== index);
                  onSkillsChange(newSkills);
                  renderSkills();
                },
              },
              "×"
            ),
          ]
        );
        tagsContainer.appendChild(tag);
      });

      // Replace the tags container
      const existingContainer = DOMUtils.select("#skills-tags-container");
      if (existingContainer) {
        existingContainer.parentNode.replaceChild(
          tagsContainer,
          existingContainer
        );
      } else {
        skillsContainer.appendChild(tagsContainer);
      }
      tagsContainer.id = "skills-tags-container";
    };

    // Initial render
    skillsContainer.appendChild(input);
    renderSkills();

    return skillsContainer;
  },

  /**
   * Create a multi-select component with clickable suggestions and removable tags
   * @param {Array} selectedItems - Array of currently selected items
   * @param {Array} suggestions - Array of available suggestions
   * @param {Function} onItemsChange - Callback when items change
   * @returns {Element} Multi-select input element
   */
  createMultiSelectInput(selectedItems, suggestions, onItemsChange) {
    const container = DOMUtils.createElement("div", {
      style: "margin-bottom: 24px;",
    });

    // Create input for custom benefits
    const input = DOMUtils.createElement("input", {
      type: "text",
      placeholder: "Type a custom benefit and press Enter...",
      class: "input",
      style: "width: 100%; margin-bottom: 12px;",
    });

    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value && !selectedItems.includes(value)) {
          selectedItems.push(value);
          onItemsChange(selectedItems);
          e.target.value = "";
          updateDisplay();
        }
      }
    };

    // Create tags container
    const tagsContainer = DOMUtils.createElement("div", {
      style:
        "display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; min-height: 32px;",
    });

    // Create suggestions container
    const suggestionsLabel = DOMUtils.createElement(
      "div",
      {
        style: "font-size: 12px; color: #6b7280; margin-bottom: 8px;",
      },
      "💡 Click to add:"
    );

    const suggestionsContainer = DOMUtils.createElement("div", {
      style: "display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;",
    });

    const updateDisplay = () => {
      // Update tags
      tagsContainer.innerHTML = "";
      selectedItems.forEach((item, index) => {
        const tag = DOMUtils.createElement("div", {
          style:
            "display: flex; align-items: center; background: #e0f2fe; border: 1px solid #0288d1; border-radius: 16px; padding: 4px 12px; font-size: 14px; color: #01579b;",
        });

        const span = DOMUtils.createElement("span", {}, item);
        const removeBtn = DOMUtils.createElement(
          "button",
          {
            type: "button",
            style:
              "background: none; border: none; color: #01579b; margin-left: 8px; cursor: pointer; font-size: 16px; line-height: 1; padding: 0;",
          },
          "×"
        );

        removeBtn.onclick = () => {
          selectedItems.splice(index, 1);
          onItemsChange(selectedItems);
          updateDisplay();
        };

        tag.appendChild(span);
        tag.appendChild(removeBtn);
        tagsContainer.appendChild(tag);
      });

      // Update suggestions
      suggestionsContainer.innerHTML = "";
      suggestions.forEach((suggestion) => {
        const isSelected = selectedItems.includes(suggestion);
        const btn = DOMUtils.createElement(
          "button",
          {
            type: "button",
            style: isSelected
              ? "background: #e0f2fe; border: 1px solid #0288d1; border-radius: 12px; padding: 4px 12px; font-size: 12px; color: #01579b; cursor: pointer; transition: all 0.2s;"
              : "background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 12px; padding: 4px 12px; font-size: 12px; color: #374151; cursor: pointer; transition: all 0.2s;",
          },
          suggestion
        );

        btn.onclick = () => {
          if (selectedItems.includes(suggestion)) {
            // Remove if already selected
            const index = selectedItems.indexOf(suggestion);
            selectedItems.splice(index, 1);
          } else {
            // Add if not selected
            selectedItems.push(suggestion);
          }
          onItemsChange(selectedItems);
          updateDisplay();
        };

        btn.onmouseover = () => {
          if (selectedItems.includes(suggestion)) {
            btn.style.background = "#b3e5fc";
          } else {
            btn.style.background = "#e5e7eb";
            btn.style.borderColor = "#9ca3af";
          }
        };

        btn.onmouseout = () => {
          if (selectedItems.includes(suggestion)) {
            btn.style.background = "#e0f2fe";
            btn.style.borderColor = "#0288d1";
          } else {
            btn.style.background = "#f3f4f6";
            btn.style.borderColor = "#d1d5db";
          }
        };

        suggestionsContainer.appendChild(btn);
      });
    };

    // Build the component
    container.appendChild(input);
    container.appendChild(tagsContainer);
    container.appendChild(suggestionsLabel);
    container.appendChild(suggestionsContainer);

    // Initial display update
    updateDisplay();

    return container;
  },

  /**
   * Job Description Builder Questions screen - Conversational format
   * @returns {Element} JD Questions view element
   */
  JDQuestions() {
    // Questions array without company name
    const questions = [
      {
        key: "role",
        q: "What is the job role?",
        type: "text",
        placeholder:
          "e.g., Senior Software Engineer, Marketing Manager, Sales Director",
        suggestions: [
          "Software Engineer",
          "Product Manager",
          "Marketing Specialist",
          "Sales Representative",
          "Data Analyst",
          "UX Designer",
          "DevOps Engineer",
          "Business Analyst",
        ],
      },
      {
        key: "location",
        q: "Where is the job located?",
        type: "text",
        placeholder: "e.g., San Francisco, CA or Remote or Hybrid",
        suggestions: [
          "Remote",
          "New York, NY",
          "San Francisco, CA",
          "Austin, TX",
          "Seattle, WA",
          "Boston, MA",
          "Chicago, IL",
          "Hybrid",
        ],
      },
      {
        key: "timezone",
        q: "What time zone should they work in?",
        type: "text",
        placeholder: "e.g., PST, EST, GMT, or Flexible",
        suggestions: [
          "PST (Pacific)",
          "EST (Eastern)",
          "CST (Central)",
          "MST (Mountain)",
          "GMT (UTC)",
          "Flexible",
          "Any timezone",
          "Business hours only",
        ],
      },
      {
        key: "hireType",
        q: "What type of employment?",
        type: "select",
        options: ["Full-time", "Part-time", "Contract", "Freelance"],
      },
      {
        key: "duration",
        q: "If contract, what's the duration?",
        type: "text",
        placeholder: "e.g., 6 months, 1 year, 3-6 months",
        suggestions: [
          "3 months",
          "6 months",
          "1 year",
          "2 years",
          "3-6 months",
          "6-12 months",
          "Project-based",
          "Until filled permanently",
        ],
        condition: (answers) => answers.hireType === "Contract",
      },
      {
        key: "domain",
        q: "What industry or domain?",
        type: "text",
        placeholder: "e.g., SaaS, Healthcare, Finance, E-commerce",
        suggestions: [
          "SaaS",
          "Healthcare",
          "Finance",
          "E-commerce",
          "Education",
          "Manufacturing",
          "Retail",
          "Technology",
          "Consulting",
          "Non-profit",
        ],
      },
      {
        key: "skills",
        q: "What are the key skills required?",
        type: "textarea",
        placeholder: "Type a skill and press Enter to add it...",
        suggestions: [
          "JavaScript",
          "Python",
          "Project Management",
          "Sales",
          "Marketing",
          "Data Analysis",
          "Leadership",
          "Communication",
        ],
      },
      {
        key: "goals",
        q: "What are the 1-year success goals?",
        type: "textarea",
        placeholder:
          "e.g., Achieve 150% of sales quota, Launch 3 new products, Reduce customer churn by 20%",
        suggestions: [
          "Increase revenue by 30%",
          "Launch new product line",
          "Build team of 5 people",
          "Improve customer satisfaction",
          "Reduce costs by 15%",
          "Expand to new markets",
        ],
      },
      {
        key: "kpi",
        q: "What are the key performance indicators?",
        type: "text",
        placeholder:
          "e.g., Monthly recurring revenue, Customer acquisition cost, Response time",
        suggestions: [
          "Monthly Recurring Revenue (MRR)",
          "Customer Acquisition Cost (CAC)",
          "Customer Lifetime Value (CLV)",
          "Response Time",
          "Conversion Rate",
          "User Engagement",
          "Sales Quota",
          "Customer Satisfaction Score",
        ],
      },
      {
        key: "superstar",
        q: "What would make this person a superstar?",
        type: "textarea",
        placeholder:
          "e.g., Exceed all KPIs by 200%, Become a thought leader in the industry, Mentor junior team members",
        suggestions: [
          "Exceed KPIs by 200%",
          "Become industry thought leader",
          "Mentor junior team members",
          "Innovate new processes",
          "Build strong client relationships",
          "Drive team collaboration",
        ],
      },
      {
        key: "ninety",
        q: "What should they achieve in the first 90 days?",
        type: "textarea",
        placeholder:
          "e.g., Complete onboarding, Close first deal, Build pipeline of $500K",
        suggestions: [
          "Complete full onboarding",
          "Close first major deal",
          "Build $500K pipeline",
          "Meet all team members",
          "Understand company processes",
          "Deliver first project",
          "Establish key relationships",
        ],
      },
      {
        key: "benefits",
        q: "What benefits and perks are offered?",
        type: "multi-select",
        placeholder:
          "Click suggestions below to add benefits, or type your own",
        suggestions: [
          "Health insurance",
          "401k matching",
          "Flexible PTO",
          "Stock options",
          "Remote work",
          "Learning budget",
          "Gym membership",
          "Free meals",
          "Transportation allowance",
          "Dental insurance",
          "Vision insurance",
          "Life insurance",
          "Parental leave",
          "Professional development",
          "Work from home stipend",
        ],
      },
      {
        key: "applicationProcess",
        q: "What's the application process?",
        type: "text",
        placeholder:
          "e.g., Send resume to jobs@company.com, Include cover letter, 3 rounds of interviews",
        suggestions: [
          "Email resume to jobs@company.com",
          "Include cover letter",
          "3 rounds of interviews",
          "Technical assessment",
          "Reference check",
          "Background verification",
          "Portfolio review",
          "Case study presentation",
        ],
      },
    ];

    // Initialize state
    let currentStep = 0;
    let answers = {};

    // Filter questions based on conditions
    const getFilteredQuestions = () => {
      return questions.filter((question) => {
        if (!question.condition) return true;
        return question.condition(answers);
      });
    };

    const renderQuestion = () => {
      const filteredQuestions = getFilteredQuestions();
      const question = filteredQuestions[currentStep];
      const isLastQuestion = currentStep === filteredQuestions.length - 1;

      const handleNext = () => {
        // For skills, check if there are any skills added
        if (question.key === "skills") {
          if (!answers[question.key] || answers[question.key].length === 0) {
            showNotification("Please add at least one skill.", "error");
            return;
          }
        } else if (question.type === "multi-select") {
          // For multi-select, check if there are any items selected
          if (!answers[question.key] || answers[question.key].length === 0) {
            showNotification("Please select at least one option.", "error");
            return;
          }
        } else {
          // For other inputs, check if there's a value
          const input = DOMUtils.select("#current-answer");
          if (!input || !input.value.trim()) {
            showNotification("Please provide an answer.", "error");
            return;
          }

          const answer = input.value.trim();
          answers[question.key] = answer;
        }

        currentStep++;

        // Re-filter questions after getting new answer
        const newFilteredQuestions = getFilteredQuestions();

        if (currentStep < newFilteredQuestions.length) {
          renderQuestion();
        } else {
          generateJobDescription();
        }
      };

      const handleBack = () => {
        if (currentStep > 0) {
          currentStep--;
          renderQuestion();
        }
      };

      const questionElement = DOMUtils.createElement(
        "div",
        { class: "card", style: "margin-top: 24px;" },
        [
          DOMUtils.createElement(
            "div",
            { style: "text-align: center; margin-bottom: 24px;" },
            [
              DOMUtils.createElement(
                "div",
                {
                  style: "font-size: 14px; color: #6b7280; margin-bottom: 8px;",
                },
                `Question ${currentStep + 1} of ${filteredQuestions.length}`
              ),
              DOMUtils.createElement(
                "div",
                {
                  style:
                    "width: 100%; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;",
                },
                [
                  DOMUtils.createElement("div", {
                    style: `width: ${
                      ((currentStep + 1) / filteredQuestions.length) * 100
                    }%; height: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8); transition: width 0.3s ease;`,
                  }),
                ]
              ),
            ]
          ),

          DOMUtils.createElement(
            "h2",
            {
              style: "margin-bottom: 16px; color: #1f2937; font-size: 24px;",
            },
            question.q
          ),

          question.type === "select"
            ? DOMUtils.createElement(
                "select",
                {
                  class: "input",
                  id: "current-answer",
                  style: "width: 100%; margin-bottom: 24px;",
                  value: answers[question.key] || "",
                },
                [
                  DOMUtils.createElement(
                    "option",
                    { value: "" },
                    "Select an option..."
                  ),
                  ...question.options.map((option) =>
                    DOMUtils.createElement("option", { value: option }, option)
                  ),
                ]
              )
            : question.key === "skills"
            ? createSkillsInput(answers[question.key] || [], (newSkills) => {
                answers[question.key] = newSkills;
              })
            : question.type === "multi-select"
            ? Views.createMultiSelectInput(
                answers[question.key] || [],
                question.suggestions || [],
                (newItems) => {
                  answers[question.key] = newItems;
                }
              )
            : question.type === "textarea"
            ? DOMUtils.createElement("textarea", {
                class: "input",
                id: "current-answer",
                placeholder: question.placeholder || "Type your answer here...",
                rows: 4,
                style: "width: 100%; margin-bottom: 24px; resize: vertical;",
                value: answers[question.key] || "",
              })
            : UIComponents.createTextInput(
                question.placeholder || "Type your answer here...",
                CONSTANTS.INPUT_TYPES.TEXT,
                question.key,
                "current-answer",
                answers[question.key] || ""
              ),

          // Add suggestion chips for non-select, non-skills, and non-multi-select questions
          question.type !== "select" &&
            question.key !== "skills" &&
            question.type !== "multi-select" &&
            question.suggestions &&
            DOMUtils.createElement("div", { style: "margin-bottom: 16px;" }, [
              DOMUtils.createElement(
                "div",
                {
                  style: "font-size: 12px; color: #6b7280; margin-bottom: 8px;",
                },
                "💡 Suggestions:"
              ),
              DOMUtils.createElement(
                "div",
                {
                  style: "display: flex; flex-wrap: wrap; gap: 6px;",
                },
                question.suggestions.slice(0, 6).map((suggestion) =>
                  DOMUtils.createElement(
                    "button",
                    {
                      type: "button",
                      style:
                        "background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 12px; padding: 4px 12px; font-size: 12px; color: #374151; cursor: pointer; transition: all 0.2s;",
                      onmouseover:
                        "this.style.background='#e5e7eb'; this.style.borderColor='#9ca3af';",
                      onmouseout:
                        "this.style.background='#f3f4f6'; this.style.borderColor='#d1d5db';",
                      onclick: () => {
                        const input = DOMUtils.select("#current-answer");
                        if (input) {
                          input.value = suggestion;
                          input.focus();
                        }
                      },
                    },
                    suggestion
                  )
                )
              ),
            ]),

          DOMUtils.createElement(
            "div",
            {
              class: "grid",
              style: "gap: 12px; margin-top: 24px;",
            },
            [
              currentStep > 0
                ? UIComponents.createButton("← Back", {
                    variant: CONSTANTS.BUTTON_VARIANTS.SECONDARY,
                    onClick: handleBack,
                    style: "justify-content: center;",
                  })
                : DOMUtils.createElement("div"),

              UIComponents.createButton(
                isLastQuestion ? "Generate Job Description →" : "Next →",
                {
                  onClick: handleNext,
                  style: "justify-content: center;",
                }
              ),
            ]
          ),
        ]
      );

      // Clear and render
      const container = DOMUtils.select("#jd-question-container");
      if (container) {
        container.innerHTML = "";
        container.appendChild(questionElement);
      }
    };

    const generateJobDescription = async () => {
      // Show loading state
      const container = DOMUtils.select("#jd-question-container");
      if (container) {
        container.innerHTML = "";
        container.appendChild(
          DOMUtils.createElement(
            "div",
            {
              style: "text-align: center; padding: 60px 20px;",
            },
            [
              DOMUtils.createElement("div", {
                style:
                  "width: 64px; height: 64px; border: 4px solid #e5e7eb; border-top: 4px solid #2563eb; border-radius: 50%; margin: 0 auto 24px; animation: spin 1s linear infinite;",
              }),
              DOMUtils.createElement(
                "h3",
                {
                  style: "margin: 0 0 12px 0; color: #1f2937; font-size: 24px;",
                },
                "Generating Job Description"
              ),
              DOMUtils.createElement(
                "p",
                {
                  style: "margin: 0; color: #6b7280; font-size: 16px;",
                },
                "Our AI is crafting a professional job description based on your answers..."
              ),
            ]
          )
        );
      }

      try {
        console.log("Generating job description with answers:", answers);

        // Generate job description using AI
        const generatedText = await AIService.generateViaProxy(answers);

        console.log("Generated text:", generatedText);

        // Save the job description
        const jobDescription = {
          id: Date.now().toString(),
          title: answers.role,
          location: answers.location,
          content: generatedText,
          createdAt: new Date().toISOString(),
          answers: answers,
        };

        StorageManager.saveJobDescription(jobDescription);

        // Show success state briefly, then redirect
        if (container) {
          container.innerHTML = "";
          container.appendChild(
            DOMUtils.createElement(
              "div",
              {
                style: "text-align: center; padding: 60px 20px;",
              },
              [
                DOMUtils.createElement(
                  "div",
                  {
                    style:
                      "width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;",
                  },
                  "✓"
                ),
                DOMUtils.createElement(
                  "h3",
                  {
                    style:
                      "margin: 0 0 12px 0; color: #1f2937; font-size: 24px;",
                  },
                  "Job Description Generated!"
                ),
                DOMUtils.createElement(
                  "p",
                  {
                    style: "margin: 0; color: #6b7280; font-size: 16px;",
                  },
                  "Redirecting to view your new job description..."
                ),
              ]
            )
          );
        }

        setTimeout(() => {
          location.hash = "#/jd-view";
        }, 2000);
      } catch (error) {
        console.error("Error generating job description:", error);
        console.error("Error details:", error.message);
        console.error("Answers that caused error:", answers);

        // Show error state
        if (container) {
          container.innerHTML = "";
          container.appendChild(
            DOMUtils.createElement(
              "div",
              {
                style: "text-align: center; padding: 60px 20px;",
              },
              [
                DOMUtils.createElement(
                  "div",
                  {
                    style:
                      "width: 64px; height: 64px; background: #ef4444; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;",
                  },
                  "✕"
                ),
                DOMUtils.createElement(
                  "h3",
                  {
                    style:
                      "margin: 0 0 12px 0; color: #1f2937; font-size: 24px;",
                  },
                  "Generation Failed"
                ),
                DOMUtils.createElement(
                  "p",
                  {
                    style:
                      "margin: 0 0 24px 0; color: #6b7280; font-size: 16px;",
                  },
                  "There was an issue generating your job description. Please try again."
                ),
                UIComponents.createButton("Try Again", {
                  onClick: () => renderQuestion(),
                  style: "justify-content: center;",
                }),
              ]
            )
          );
        }
      }
    };

    // Start the question flow after a short delay to ensure DOM is ready
    setTimeout(() => {
      renderQuestion();
    }, 100);

    return UIComponents.createSection("Job Description Builder", [
      DOMUtils.createElement(
        "div",
        { class: "card", style: "max-width: 600px; margin: 0 auto;" },
        [
          DOMUtils.createElement(
            "h2",
            { class: "section-title" },
            "Tell us about the role"
          ),
          DOMUtils.createElement(
            "p",
            { class: "caption" },
            "Answer these questions and we'll generate a professional job description using AI"
          ),

          DOMUtils.createElement("div", { id: "jd-question-container" }, [
            // Question content will be dynamically inserted here
          ]),
        ]
      ),
    ]);
  },
});

// ============================================================================
// NAVIGATION MANAGER
// ============================================================================

/**
 * Navigation manager for handling UI updates after login/logout
 */
const NavigationManager = {
  /**
   * Update header authentication state
   */
  updateHeaderAuth() {
    const nav = document.querySelector(".nav");
    const currentUser = StorageManager.getCurrentUser();

    if (!nav) return;

    if (currentUser) {
      // User is logged in - show user info and logout
      nav.innerHTML = `
        <span class="nav-user">Welcome, ${
          currentUser.first || currentUser.username
        }!</span>
        <a href="#/" class="nav-link">Home</a>
        <button class="nav-link logout-btn" onclick="NavigationManager.logout()">Logout</button>
      `;
    } else {
      // User is not logged in - show login/signup
      nav.innerHTML = `
        <a href="#/login" class="nav-link">Login</a>
        <a href="#/signup" class="nav-link">Sign up</a>
        <a href="#/" class="nav-link">Home</a>
      `;
    }
  },

  /**
   * Handle user logout
   */
  logout() {
    StorageManager.clearCurrentUser();
    showNotification("Logged out successfully!", "success");
    this.updateHeaderAuth();
    location.hash = "#/";
  },

  /**
   * Update navigation based on authentication state
   */
  updateNavigation() {
    this.updateHeaderAuth();
  },
};

// ============================================================================
// DEBUG UTILITIES (Temporary - Remove in production)
// ============================================================================

/**
 * Debug function to create a test user account
 * Call this from browser console: window.createTestUser()
 */
window.createTestUser = function () {
  const testUser = {
    username: "dheerajkukkadapu",
    email: "test@example.com",
    first: "Dheeraj",
    last: "Kukkadapu",
    password: "password123", // Plain text for testing
    createdAt: new Date().toISOString(),
  };

  const users = StorageManager.loadUsers();
  // Remove existing user if any
  const filteredUsers = users.filter(
    (u) => u.username.toLowerCase() !== testUser.username.toLowerCase()
  );
  filteredUsers.push(testUser);
  StorageManager.saveUsers(filteredUsers);

  console.log("Test user created:", testUser);
  console.log("All users:", StorageManager.loadUsers());
};

/**
 * Debug function to view all users
 * Call this from browser console: window.viewAllUsers()
 */
window.viewAllUsers = function () {
  console.log("All users:", StorageManager.loadUsers());
};

// ============================================================================
// ROUTING CONFIGURATION
// ============================================================================

// Update the Router routes to include all views
Object.assign(Router.routes, {
  "#/sales": createRouteGuard(Views.Sales),
  "#/jd-builder": createRouteGuard(Views.JDBuilder),
  "#/jd-builder/questions": createRouteGuard(Views.JDQuestions),
  "#/jd-view": createRouteGuard(Views.JDView),
  "#/sourcing": createRouteGuard(Views.Sourcing),
  "#/recruitment": createRouteGuard(Views.Recruitment),
  "#/settings": createRouteGuard(Views.Settings),
});
