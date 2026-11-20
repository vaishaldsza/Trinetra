export function getLocales() {
  return [
    {
      languageTag: 'en-US',
      languageCode: 'en',
      regionCode: 'US',
      currencyCode: 'USD',
      currencySymbol: '$',
      decimalSeparator: '.',
      digitGroupingSeparator: ',',
      textDirection: 'ltr' as const,
      measurementSystem: 'metric' as const
    }
  ];
}

export function getCalendars() {
  return [];
}
