import * as moment from 'moment';

import { YYYY_MM_DD } from 'src/constants/date';

/**
 * Get the current date and time in the specified format.
 *
 * @param {string} format - The desired format for the date string.
 * @returns {string} - The current date and time in the specified format.
 */
export function getCurrentDate(format = YYYY_MM_DD): string {
  return moment().format(format);
}

/**
 * Get the current date
 *
 * @returns {Date}
 */
export function getDate(): Date {
  return moment().toDate();
}
