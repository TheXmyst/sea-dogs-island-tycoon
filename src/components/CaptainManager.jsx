import React, { useState } from 'react';
import { getCaptainConfig, getXPForLevel, CAPTAIN_RARITY } from '../config/captains';
import { getSkinsByType, getSkinConfig } from '../config/skins';
import { useTranslation } from '../i18n/LanguageContext';
import './CaptainManager.css';

export default function CaptainManager({ gameState, onUpdateCaptain, onEquipSkin }) {
  const { t } = useTranslation();
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [showSkinModal, setShowSkinModal] = useState(false);
  
  const captains = gameState.captains || [];
  const availableSkins = gameState.captainSkins || {};
  const activeSkins = gameState.activeSkins || {};
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case CAPTAIN_RARITY.COMMON: return '#95a5a6';
      case CAPTAIN_RARITY.RARE: return '#3498db';
      case CAPTAIN_RARITY.EPIC: return '#9b59b6';
      case CAPTAIN_RARITY.LEGENDARY: return '#f39c12';
      default: return '#ffffff';
    }
  };
  
  const getRarityName = (rarity) => {
    return t(`captains.${rarity}`, rarity.charAt(0).toUpperCase() + rarity.slice(1));
  };
  
  const getCaptainBuffs = (captain) => {
    const config = getCaptainConfig(captain.id);
    if (!config) return {};
    
    // Base buffs from captain config
    const buffs = { ...config.buffs };
    
    // Apply level scaling (buffs increase slightly with level)
    const levelMultiplier = 1 + (captain.level - 1) * 0.05;
    Object.keys(buffs).forEach(key => {
      buffs[key] = buffs[key] * levelMultiplier;
    });
    
    return buffs;
  };
  
  const handleLevelUp = (captain) => {
    const xpNeeded = getXPForLevel(captain.level);
    if (captain.xp >= xpNeeded) {
      const updatedCaptain = {
        ...captain,
        level: captain.level + 1,
        xp: captain.xp - xpNeeded,
        xpToNext: getXPForLevel(captain.level + 1),
      };
      onUpdateCaptain(updatedCaptain);
    }
  };
  
  if (captains.length === 0) {
    return (
      <div className="captain-manager">
        <div className="no-captains">
          <h2>👥 {t('captains.collection')}</h2>
          <p>{t('captains.noCaptains')}</p>
          <p>{t('captains.goToRecruitment')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="captain-manager">
      <div className="captain-manager-header">
        <h2>👥 {t('captains.collection')}</h2>
        <p>{t('captains.manage')}</p>
      </div>
      
      <div className="captains-grid">
        {captains.map(captain => {
          const config = getCaptainConfig(captain.id);
          if (!config) return null;
          
          const buffs = getCaptainBuffs(captain);
          const xpNeeded = getXPForLevel(captain.level);
          const xpPercent = (captain.xp / xpNeeded) * 100;
          const canLevelUp = captain.xp >= xpNeeded;
          const captainSkins = availableSkins[captain.id] || [];
          const activeSkin = activeSkins[captain.id] ? getSkinConfig(activeSkins[captain.id]) : null;
          
          return (
            <div 
              key={captain.id} 
              className={`captain-card ${selectedCaptain?.id === captain.id ? 'selected' : ''}`}
              onClick={() => setSelectedCaptain(captain)}
            >
              <div 
                className="captain-card-header"
                style={{ borderColor: getRarityColor(captain.rarity) }}
              >
                <div className="captain-portrait-wrapper">
                  <div className="captain-portrait">
                    {config.portrait.startsWith('/') ? (
                      <img 
                        src={config.portrait} 
                        alt={config.name}
                        className="captain-portrait-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <span>{config.portrait}</span>
                    )}
                  </div>
                  {activeSkin && (
                    <div className="skin-indicator" title={activeSkin.name}>
                      {activeSkin.icon}
                    </div>
                  )}
                </div>
                <div className="captain-info">
                  <div className="captain-name">{t(`captains.items.${captain.id}.name`, config.name)}</div>
                  <div 
                    className="captain-rarity"
                    style={{ color: getRarityColor(captain.rarity) }}
                  >
                    {getRarityName(captain.rarity)}
                  </div>
                  <div className="captain-role">{t(`captains.${config.role}`, config.role)}</div>
                </div>
              </div>
              
              <div className="captain-level">
                <div className="level-info">
                  <span>{t('captains.level')} {captain.level}</span>
                  {canLevelUp && (
                    <button 
                      className="level-up-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLevelUp(captain);
                      }}
                    >
                      {t('captains.levelUp')}
                    </button>
                  )}
                </div>
                <div className="xp-bar">
                  <div 
                    className="xp-bar-fill"
                    style={{ width: `${xpPercent}%` }}
                  />
                  <div className="xp-bar-text">
                    {captain.xp} / {xpNeeded} {t('captains.xp')}
                  </div>
                </div>
              </div>
              
              <div className="captain-buffs-preview">
                <div className="buffs-label">{t('captains.activeBuffs')}:</div>
                <div className="buffs-list">
                  {Object.keys(buffs).slice(0, 3).map(buff => (
                    <div key={buff} className="buff-preview">
                      {buff.replace(/([A-Z])/g, ' $1').trim()}: +{Math.round(buffs[buff] * 100)}%
                    </div>
                  ))}
                  {Object.keys(buffs).length > 3 && (
                    <div className="buff-preview">+{Object.keys(buffs).length - 3} more...</div>
                  )}
                </div>
              </div>
              
              {captainSkins.length > 0 && (
                <div className="captain-skins-count">
                  {captainSkins.length} {t('captains.skinsAvailable', { count: captainSkins.length })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedCaptain && (
        <div className="captain-detail-modal" onClick={() => setSelectedCaptain(null)}>
          <div className="captain-detail-content" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <button className="close-button" onClick={() => setSelectedCaptain(null)}>×</button>
              <div className="detail-portrait">
                {(() => {
                  const portrait = getCaptainConfig(selectedCaptain.id)?.portrait;
                  return portrait?.startsWith('/') ? (
                    <img 
                      src={portrait} 
                      alt={getCaptainConfig(selectedCaptain.id)?.name}
                      className="captain-portrait-image-large"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{portrait}</span>
                  );
                })()}
              </div>
              <h2>{t(`captains.items.${selectedCaptain.id}.name`, getCaptainConfig(selectedCaptain.id)?.name)}</h2>
              <div 
                className="detail-rarity"
                style={{ color: getRarityColor(selectedCaptain.rarity) }}
              >
                {getRarityName(selectedCaptain.rarity)} • {t(`captains.${selectedCaptain.role}`, selectedCaptain.role)}
              </div>
            </div>
            
            <div className="detail-body">
              <div className="detail-section">
                <h3>{t('captains.levelAndExperience')}</h3>
                <div className="level-display">
                  <div>{t('captains.level')} {selectedCaptain.level}</div>
                  <div className="xp-bar-large">
                    <div 
                      className="xp-bar-fill"
                      style={{ width: `${(selectedCaptain.xp / getXPForLevel(selectedCaptain.level)) * 100}%` }}
                    />
                    <div className="xp-bar-text">
                      {selectedCaptain.xp} / {getXPForLevel(selectedCaptain.level)} {t('captains.xp')}
                    </div>
                  </div>
                  {selectedCaptain.xp >= getXPForLevel(selectedCaptain.level) && (
                    <button 
                      className="level-up-button-large"
                      onClick={() => handleLevelUp(selectedCaptain)}
                    >
                      {t('captains.levelUp')}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h3>{t('captains.buffsAndBonuses')}</h3>
                <div className="buffs-detail">
                  {Object.entries(getCaptainBuffs(selectedCaptain)).map(([buff, value]) => (
                    <div key={buff} className="buff-detail-item">
                      <span className="buff-name">{buff.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="buff-value">+{Math.round(value * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="detail-section">
                <h3>{t('captains.skins')}</h3>
                <div className="skins-section">
                  {(availableSkins[selectedCaptain.id] || []).length > 0 ? (
                    <div className="skins-list">
                      {availableSkins[selectedCaptain.id].map(skinId => {
                        const skin = getSkinConfig(skinId);
                        if (!skin) return null;
                        const isActive = activeSkins[selectedCaptain.id] === skinId;
                        
                        return (
                          <div 
                            key={skinId}
                            className={`skin-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              if (!isActive) {
                                onEquipSkin(selectedCaptain.id, skinId);
                              }
                            }}
                          >
                            <div className="skin-icon">{skin.icon}</div>
                            <div className="skin-name">{skin.name}</div>
                            <div className="skin-type">{skin.type}</div>
                            {isActive && <div className="skin-active-badge">{t('captains.active')}</div>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-skins">{t('captains.noSkins')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

