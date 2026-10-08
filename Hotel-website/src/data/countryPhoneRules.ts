export interface CountryPhoneRule {
  name: string;
  code: string;
  min: number;
  max: number;
}

export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  { name: "India", code: "+91", min: 10, max: 10 },
  { name: "United States", code: "+1", min: 10, max: 10 },
  { name: "Canada", code: "+1", min: 10, max: 10 },
  { name: "United Kingdom", code: "+44", min: 10, max: 10 },
  { name: "United Arab Emirates", code: "+971", min: 9, max: 9 },
  { name: "Saudi Arabia", code: "+966", min: 9, max: 9 },
  { name: "Qatar", code: "+974", min: 8, max: 8 },
  { name: "Kuwait", code: "+965", min: 8, max: 8 },
  { name: "Oman", code: "+968", min: 8, max: 8 },
  { name: "Singapore", code: "+65", min: 8, max: 8 },
  { name: "Australia", code: "+61", min: 9, max: 9 },
  { name: "New Zealand", code: "+64", min: 8, max: 10 },
  { name: "Germany", code: "+49", min: 10, max: 11 },
  { name: "France", code: "+33", min: 9, max: 9 },
  { name: "Italy", code: "+39", min: 9, max: 10 },
  { name: "Spain", code: "+34", min: 9, max: 9 },
  { name: "South Africa", code: "+27", min: 9, max: 9 },
  { name: "Nigeria", code: "+234", min: 10, max: 10 },
  { name: "Japan", code: "+81", min: 10, max: 10 },
  { name: "China", code: "+86", min: 11, max: 11 },
  { name: "Malaysia", code: "+60", min: 9, max: 10 },
  { name: "Thailand", code: "+66", min: 9, max: 9 },
  { name: "Indonesia", code: "+62", min: 9, max: 12 },
  { name: "Philippines", code: "+63", min: 10, max: 10 },
  { name: "Brazil", code: "+55", min: 10, max: 11 },
  { name: "Mexico", code: "+52", min: 10, max: 10 },
  { name: "Russia", code: "+7", min: 10, max: 10 },
];

export function getPhoneRule(code: string): CountryPhoneRule {
  return COUNTRY_PHONE_RULES.find((country) => country.code === code) || COUNTRY_PHONE_RULES[0];
}

export function phoneRuleMessage(rule: CountryPhoneRule): string {
  return rule.min === rule.max
    ? `${rule.name} mobile number must contain exactly ${rule.min} digits.`
    : `${rule.name} mobile number must contain ${rule.min}-${rule.max} digits.`;
}
