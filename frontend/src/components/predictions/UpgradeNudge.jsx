import React from 'react';
import usePredictionsStore from '../../store/predictionsStore';

export default function UpgradeNudge({ productId }) {
  const { upgradeAvailable, recordsToUpgrade, triggerUpgrade, isUpgrading } = usePredictionsStore();

  if (!upgradeAvailable && !recordsToUpgrade) return null;

  return (
    <div className="upgrade-nudge-banner" style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: '#0369a1' }}>Unlock AI Personalisation</h4>
        {upgradeAvailable ? (
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
            You have unlocked the personalized <strong>DeepAR</strong> forecasting model based on your rich sales history. Train your model to get tighter inventory predictions!
          </p>
        ) : (
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
            Record <strong>{recordsToUpgrade} more sales</strong> to unlock the DeepAR personalized learning model. Keep going!
          </p>
        )}
      </div>

      {upgradeAvailable && (
        <button 
          onClick={() => triggerUpgrade(productId)}
          disabled={isUpgrading}
          style={{ 
            background: '#0ea5e9', 
            color: 'white', 
            padding: '8px 16px', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: isUpgrading ? 'not-allowed' : 'pointer',
            opacity: isUpgrading ? 0.7 : 1,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            marginLeft: '16px'
          }}
        >
          {isUpgrading ? 'Training...' : 'Upgrade Model'}
        </button>
      )}
    </div>
  );
}
