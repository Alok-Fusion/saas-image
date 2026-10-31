import React from 'react'
import { Zap, ZapOff } from 'lucide-react'
import { useCapabilities } from '../utils/capabilities'

export const ReduceEffectsToggle: React.FC = () => {
    const { userReducedEffects, toggleReduceEffects } = useCapabilities()

    return (
        <button
            type="button"
            className={`effects-toggle-btn ${userReducedEffects ? 'is-reduced' : ''}`}
            onClick={toggleReduceEffects}
            title={userReducedEffects ? 'Switch to Full 3D & Immersive FX' : 'Switch to Performance / Reduced FX'}
            aria-label={userReducedEffects ? 'Switch to Full 3D and Immersive FX' : 'Switch to Performance and Reduced FX'}
        >
            {userReducedEffects ? <ZapOff size={14} /> : <Zap size={14} />}
            <span className="effects-toggle-text">{userReducedEffects ? 'Minimal FX' : '3D Immersive'}</span>
        </button>
    )
}

export default ReduceEffectsToggle

