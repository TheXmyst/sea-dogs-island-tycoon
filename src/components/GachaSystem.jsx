import React, { useState } from 'react';
import { CAPTAIN_RARITY, getCaptainConfig, performGachaPull } from '../config/captains';
import { hasResources, deductResources } from '../utils/gameState';
import { gachaAPI } from '../services/api';
import { authAPI } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import './GachaSystem.css';

const PULL_COST_DIAMONDS = 100;
const PULL_COST_FRAGMENTS = 10;

const MULTI_PULL_COUNT = 10;
const MULTI_PULL_COST_DIAMONDS = PULL_COST_DIAMONDS * MULTI_PULL_COUNT;

export default function GachaSystem({ gameState, userId, onPullComplete }) {
  const { t } = useTranslation();
  const [pulling, setPulling] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [multiPullResults, setMultiPullResults] = useState(null);
  const [showMultiResult, setShowMultiResult] = useState(false);
  
  const canPullWithDiamonds = gameState.resources.diamonds >= PULL_COST_DIAMONDS;
  const canPullWithFragments = gameState.resources.fragments >= PULL_COST_FRAGMENTS;
  const canMultiPull = gameState.resources.diamonds >= MULTI_PULL_COST_DIAMONDS;
  
  const handlePull = async (useFragments = false) => {
    const costType = useFragments ? 'fragments' : 'diamonds';
    const costAmount = useFragments ? PULL_COST_FRAGMENTS : PULL_COST_DIAMONDS;
    
    if (!hasResources(gameState.resources, { [costType]: costAmount })) {
      alert(t('gacha.insufficientDiamonds'));
      return;
    }
    
    // Use userId from props (more reliable) or fallback to localStorage
    const playerId = userId || authAPI.getUserId();
    if (!playerId) {
      alert(t('gacha.mustBeLoggedIn'));
      return;
    }
    
    setPulling(true);
    
    try {
      // Call backend API for secure gacha pull
      const response = await gachaAPI.pull(playerId, costType, costAmount, 1);
      
      if (!response.success || !response.results) {
        throw new Error(response.error || 'Failed to pull captain');
      }
      
      const result = response.results;
      
      // Get full captain config for display
      const captainConfig = getCaptainConfig(result.captain.id);
      const fullCaptain = captainConfig ? {
        ...result.captain,
        ...captainConfig,
        // Ensure portrait exists
        portrait: captainConfig.portrait || result.captain.portrait || '👤',
      } : {
        ...result.captain,
        // Fallback portrait if no config found
        portrait: result.captain.portrait || '👤',
      };
      
      // Update game state with server response
      onPullComplete({
        resources: response.updatedResources,
        captains: response.updatedCaptains || gameState.captains || [],
        gachaPity: {
          pulls: response.newPityPulls || 0,
          epicPulls: response.newEpicPulls || 0,
          legendaryPulls: response.newLegendaryPulls || 0,
          guaranteedEpicAt: gameState.gachaPity?.guaranteedEpicAt || 50,
          guaranteedLegendaryAt: gameState.gachaPity?.guaranteedLegendaryAt || 100,
        },
        result: {
          captain: fullCaptain,
          duplicate: result.duplicate,
        },
      });
      
      setLastResult({
        captain: fullCaptain,
        duplicate: result.duplicate,
      });
      setShowResult(true);
    } catch (error) {
      console.error('Error during gacha pull:', error);
      alert(t('gacha.errorPull') + ' ' + (error.message || t('common.tryAgain')));
    } finally {
      setPulling(false);
    }
  };
  
  const handleMultiPull = async () => {
    if (!canMultiPull) {
      alert(t('gacha.insufficientDiamonds') + ' ' + MULTI_PULL_COST_DIAMONDS + ' ' + t('gacha.needDiamonds'));
      return;
    }
    
    // Use userId from props (more reliable) or fallback to localStorage
    const playerId = userId || authAPI.getUserId();
    if (!playerId) {
      alert('Vous devez être connecté pour utiliser le gacha !\n\nLe système gacha est sécurisé et nécessite une connexion pour fonctionner.');
      return;
    }
    
    setPulling(true);
    
    try {
      // Call backend API for secure multi-pull
      const response = await gachaAPI.pull(playerId, 'diamonds', PULL_COST_DIAMONDS, MULTI_PULL_COUNT);
      
      if (!response.success || !response.results || !Array.isArray(response.results)) {
        throw new Error(response.error || 'Failed to perform pulls');
      }
      
      // Get full captain configs for display
      const results = response.results.map(result => {
        const captainConfig = getCaptainConfig(result.captain.id);
        return {
          ...result,
          captain: captainConfig ? {
            ...result.captain,
            ...captainConfig,
            // Ensure portrait exists
            portrait: captainConfig.portrait || result.captain.portrait || '👤',
          } : {
            ...result.captain,
            // Fallback portrait if no config found
            portrait: result.captain.portrait || '👤',
          },
        };
      });
      
      // Update game state with server response
      onPullComplete({
        resources: response.updatedResources,
        captains: response.updatedCaptains || gameState.captains || [],
        gachaPity: {
          pulls: response.newPityPulls || 0,
          epicPulls: response.newEpicPulls || 0,
          legendaryPulls: response.newLegendaryPulls || 0,
          guaranteedEpicAt: gameState.gachaPity?.guaranteedEpicAt || 50,
          guaranteedLegendaryAt: gameState.gachaPity?.guaranteedLegendaryAt || 100,
        },
      });
      
      setMultiPullResults(results);
      setShowMultiResult(true);
    } catch (error) {
      console.error('Error during multi-pull:', error);
      alert('Error: Failed to perform pulls. ' + (error.message || 'Please try again.'));
    } finally {
      setPulling(false);
    }
  };
  
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
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };
  
  // Get pity progress (use separate counters if available, fallback to legacy)
  const gachaPity = gameState.gachaPity || { 
    pulls: 0, 
    epicPulls: 0, 
    legendaryPulls: 0, 
    guaranteedEpicAt: 50, 
    guaranteedLegendaryAt: 100 
  };
  const epicPulls = gachaPity.epicPulls !== undefined ? gachaPity.epicPulls : gachaPity.pulls || 0;
  const legendaryPulls = gachaPity.legendaryPulls !== undefined ? gachaPity.legendaryPulls : gachaPity.pulls || 0;
  const nextEpicAt = gachaPity.guaranteedEpicAt || 50;
  const nextLegendaryAt = gachaPity.guaranteedLegendaryAt || 100;
  
  // Check authentication: use userId prop or localStorage
  const isAuthenticated = !!userId || authAPI.isAuthenticated();
  
  return (
    <div className="gacha-system">
      <div className="gacha-header">
        <h2>🎰 {t('gacha.captainRecruitment')}</h2>
        <p>{t('gacha.recruitPowerful')}</p>
        {!isAuthenticated && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: 'rgba(255, 193, 7, 0.2)',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            color: '#ffc107',
            fontWeight: 'bold'
          }}>
            ⚠️ {t('gacha.mustBeConnected')}
          </div>
        )}
      </div>
      
      <div className="gacha-pity-info">
        <h3>{t('gacha.pitySystem')}</h3>
        <div className="pity-bars">
          <div className="pity-bar">
            <div className="pity-label">{t('gacha.epicGuarantee')}</div>
            <div className="pity-progress-bar">
            <div 
              className="pity-progress-fill"
              style={{ 
                width: `${Math.min(100, (epicPulls / nextEpicAt) * 100)}%`,
                background: '#9b59b6',
              }}
            />
          </div>
          <div className="pity-text">
            {epicPulls} / {nextEpicAt} {t('gacha.pulls')}
          </div>
        </div>
        <div className="pity-bar">
          <div className="pity-label">{t('gacha.legendaryGuarantee')}</div>
          <div className="pity-progress-bar">
            <div 
              className="pity-progress-fill"
              style={{ 
                width: `${Math.min(100, (legendaryPulls / nextLegendaryAt) * 100)}%`,
                background: '#f39c12',
              }}
            />
          </div>
          <div className="pity-text">
            {legendaryPulls} / {nextLegendaryAt} {t('gacha.pulls')}
          </div>
          </div>
        </div>
      </div>
      
      <div className="gacha-pull-section">
        <div className="pull-options">
          <div className="pull-option">
            <h3>{t('gacha.singlePull')}</h3>
            <div className="pull-cost">
              <span>💎 {PULL_COST_DIAMONDS}</span>
              <span>{t('common.or')}</span>
              <span>🎫 {PULL_COST_FRAGMENTS}</span>
            </div>
            <div className="pull-buttons">
              <button
                className="pull-button diamonds"
                onClick={() => handlePull(false)}
                disabled={!canPullWithDiamonds || pulling}
              >
                {pulling ? t('gacha.pulling') : `${t('gacha.pull')} 💎 ${PULL_COST_DIAMONDS}`}
              </button>
              <button
                className="pull-button fragments"
                onClick={() => handlePull(true)}
                disabled={!canPullWithFragments || pulling}
              >
                {pulling ? t('gacha.pulling') : `${t('gacha.pull')} 🎫 ${PULL_COST_FRAGMENTS}`}
              </button>
            </div>
          </div>
          
          <div className="pull-option">
            <h3>{t('gacha.multiPull')}</h3>
            <div className="pull-cost">
              <span>💎 {MULTI_PULL_COST_DIAMONDS}</span>
              <span className="multi-pull-bonus">({t('gacha.saveTime')})</span>
            </div>
            <div className="pull-buttons">
              <button
                className="pull-button multi-pull"
                onClick={handleMultiPull}
                disabled={!canMultiPull || pulling}
              >
                {pulling ? t('gacha.pulling') : `${t('gacha.multiPull')} 💎 ${MULTI_PULL_COST_DIAMONDS}`}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {showResult && lastResult && (
        <div className="gacha-result-overlay" onClick={() => setShowResult(false)}>
          <div className="gacha-result-modal" onClick={e => e.stopPropagation()}>
            <div 
              className="result-header"
              style={{ 
                background: `linear-gradient(135deg, ${getRarityColor(lastResult.captain.rarity)}22, ${getRarityColor(lastResult.captain.rarity)}44)`,
                borderColor: getRarityColor(lastResult.captain.rarity),
              }}
            >
              <h2>
                {lastResult.duplicate ? `⭐ ${t('gacha.duplicateCaptain')}!` : `🎉 ${t('gacha.newCaptain')}`}
              </h2>
              <div className="rarity-badge" style={{ background: getRarityColor(lastResult.captain.rarity) }}>
                {getRarityName(lastResult.captain.rarity)}
              </div>
            </div>
            
            <div className="result-body">
              <div className="captain-portrait-large">
                {lastResult.captain.portrait && typeof lastResult.captain.portrait === 'string' && lastResult.captain.portrait.startsWith('/') ? (
                  <img 
                    src={lastResult.captain.portrait} 
                    alt={t(`captains.items.${lastResult.captain.id}.name`, lastResult.captain.name)}
                    className="captain-portrait-image-gacha"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{lastResult.captain.portrait || '👤'}</span>
                )}
              </div>
              <h3>{t(`captains.items.${lastResult.captain.id}.name`, lastResult.captain.name)}</h3>
              <p className="captain-description">{t(`captains.items.${lastResult.captain.id}.description`, lastResult.captain.description)}</p>
              <p className="captain-role">{t('captains.captain')}: {t(`captains.${lastResult.captain.role}`, lastResult.captain.role)}</p>
              
              {lastResult.duplicate && (
                <div className="duplicate-bonus">
                  <p>⭐ {t('gacha.youOwnThis')}</p>
                  <p>+50 {t('captains.xp')} {t('gacha.bonusApplied')}</p>
                </div>
              )}
              
              <div className="captain-buffs">
                <h4>{t('captains.buffs')}:</h4>
                {Object.keys(lastResult.captain.buffs).map(buff => (
                  <div key={buff} className="buff-item">
                    <span>{buff.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span>+{Math.round(lastResult.captain.buffs[buff] * 100)}%</span>
                  </div>
                ))}
              </div>
              
              <button className="close-result-button" onClick={() => setShowResult(false)}>
                {t('gacha.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showMultiResult && multiPullResults && (
        <div className="gacha-result-overlay" onClick={() => setShowMultiResult(false)}>
          <div className="gacha-multi-result-modal" onClick={e => e.stopPropagation()}>
            <div className="multi-result-header">
              <h2>🎉 {t('gacha.multiPullResults')}</h2>
              <button className="close-multi-button" onClick={() => setShowMultiResult(false)}>×</button>
            </div>
            
            <div className="multi-result-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">{t('gacha.newCaptains')}:</span>
                  <span className="stat-value">
                    {multiPullResults.filter(r => !r.duplicate).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('gacha.duplicates')}:</span>
                  <span className="stat-value">
                    {multiPullResults.filter(r => r.duplicate).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('captains.legendary')}:</span>
                  <span className="stat-value legendary">
                    {multiPullResults.filter(r => r.captain.rarity === CAPTAIN_RARITY.LEGENDARY).length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('captains.epic')}:</span>
                  <span className="stat-value epic">
                    {multiPullResults.filter(r => r.captain.rarity === CAPTAIN_RARITY.EPIC).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="multi-result-list">
              <h3>{t('gacha.allResults')}</h3>
              <div className="results-grid">
                {multiPullResults.map((result, index) => (
                  <div 
                    key={index}
                    className="multi-result-item"
                    style={{ 
                      borderColor: getRarityColor(result.captain.rarity),
                      background: `linear-gradient(135deg, ${getRarityColor(result.captain.rarity)}22, ${getRarityColor(result.captain.rarity)}11)`,
                    }}
                  >
                    <div className="result-item-header">
                      <span className="pull-number">#{result.pullNumber}</span>
                      {result.duplicate && <span className="duplicate-badge">⭐ {t('gacha.duplicate')}</span>}
                    </div>
                    <div className="result-item-portrait">
                      {result.captain.portrait && typeof result.captain.portrait === 'string' && result.captain.portrait.startsWith('/') ? (
                        <img 
                          src={result.captain.portrait} 
                          alt={t(`captains.items.${result.captain.id}.name`, result.captain.name)}
                          className="result-item-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="result-item-emoji">{result.captain.portrait || '👤'}</span>
                      )}
                    </div>
                    <div className="result-item-name">{t(`captains.items.${result.captain.id}.name`, result.captain.name)}</div>
                    <div 
                      className="result-item-rarity"
                      style={{ color: getRarityColor(result.captain.rarity) }}
                    >
                      {getRarityName(result.captain.rarity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="close-result-button" onClick={() => setShowMultiResult(false)}>
              {t('gacha.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

