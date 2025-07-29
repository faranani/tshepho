/**
 * Utility functions for formatting numbers and other data
 */

/**
 * Safely formats a number using toLocaleString with fallback
 * @param value - The number to format
 * @param fallback - The fallback value if formatting fails
 * @returns Formatted string
 */
export const safeToLocaleString = (value: number | undefined | null, fallback: string = '0'): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  
  try {
    return value.toLocaleString();
  } catch (error) {
    // Fallback to manual formatting if toLocaleString is not available
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

/**
 * Formats currency values safely
 * @param value - The number to format as currency
 * @param currency - The currency symbol (default: '$')
 * @param fallback - The fallback value if formatting fails
 * @returns Formatted currency string
 */
export const safeCurrencyFormat = (
  value: number | undefined | null, 
  currency: string = '$', 
  fallback: string = '$0'
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }
  
  return `${currency}${safeToLocaleString(value)}`;
};

/**
 * Formats percentage values safely
 * @param value - The number to format as percentage
 * @param fallback - The fallback value if formatting fails
 * @returns Formatted percentage string
 */
export const safePercentageFormat = (value: number | undefined | null, fallback: string = '0%'): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return fallback;
  }

  return `${value}%`;
};

/**
 * Formats timestamp to show relative time (e.g., "2 hours ago", "Just now")
 * @param timestamp - The timestamp string to format
 * @returns Formatted relative time string
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      // For older dates, show the actual date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    return 'Unknown time';
  }
};
