/* lib/types/emailAddress.ts */
import isEmail from 'validator/lib/isEmail';

const validatorOptions = {
  allow_display_name: false,
  allow_underscores: false,
  require_display_name: false,
  allow_utf8_local_part: true,
  require_tld: true,
  blacklisted_chars: '',
  ignore_max_length: false, // max byte length is 64 for user name and 254 for domain name
  host_blacklist: [],
  host_whitelist: []
};

export type EmailAddress = string;

// At runtime, still need a function to *assert* that a string is a valid email
// and then "cast" it to the EmailAddress type. JavaScript is responsible for runtime checks
export function isValidEmailAddress(value: string): value is EmailAddress {
  return isEmail(value, validatorOptions);
}
