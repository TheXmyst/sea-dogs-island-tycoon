/**
 * Helper functions to translate game configuration objects
 * (buildings, ships, captains, etc.)
 */

import { translations } from './translations';

const defaultLanguage = 'en';
let currentLanguage = defaultLanguage;

export function setConfigLanguage(lang) {
  currentLanguage = lang;
}

export function getConfigTranslation(key, fallback = null) {
  const keys = key.split('.');
  let value = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      // Fallback to default language
      value = translations[defaultLanguage];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object') {
          value = value[fallbackKey];
        } else {
          return fallback || key;
        }
      }
      break;
    }
  }
  
  return value || fallback || key;
}

/**
 * Translate building name
 */
export function translateBuildingName(buildingId) {
  return getConfigTranslation(`buildings.items.${buildingId}.name`, buildingId);
}

/**
 * Translate building description
 */
export function translateBuildingDescription(buildingId) {
  return getConfigTranslation(`buildings.items.${buildingId}.description`, '');
}

/**
 * Translate ship name
 */
export function translateShipName(shipId) {
  return getConfigTranslation(`ships.items.${shipId}.name`, shipId);
}

/**
 * Translate ship description
 */
export function translateShipDescription(shipId) {
  return getConfigTranslation(`ships.items.${shipId}.description`, '');
}

/**
 * Translate captain name
 */
export function translateCaptainName(captainId) {
  return getConfigTranslation(`captains.items.${captainId}.name`, captainId);
}

/**
 * Translate captain description
 */
export function translateCaptainDescription(captainId) {
  return getConfigTranslation(`captains.items.${captainId}.description`, '');
}

/**
 * Translate resource name
 */
export function translateResourceName(resourceId) {
  return getConfigTranslation(`resources.${resourceId}`, resourceId);
}

