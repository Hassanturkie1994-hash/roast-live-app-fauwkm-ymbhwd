
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { RoastGift, isCinematicGift } from '@/constants/RoastGiftManifest';
import CinematicGiftOverlay from './CinematicGiftOverlay';
import RoastGiftAnimationOverlayStandard from './RoastGiftAnimationOverlayStandard';

interface RoastGiftAnimationOverlayProps {
  giftId: string;
  displayName: string;
  emoji: string;
  senderName: string;
  priceSEK: number;
  tier: 'LOW' | 'MID' | 'HIGH' | 'ULTRA';
  animationType: 'OVERLAY' | 'AR' | 'CINEMATIC';
  onAnimationComplete: () => void;
}

export default function RoastGiftAnimationOverlay(props: RoastGiftAnimationOverlayProps) {
  const { animationType, onAnimationComplete } = props;
  
  // Check if cinematic
  if (isCinematicGift(animationType)) {
    const gift: RoastGift = {
      giftId: props.giftId,
      displayName: props.displayName,
      priceSEK: props.priceSEK,
      tier: props.tier,
      animationType: props.animationType,
      soundProfile: '', // Not needed for display
      priority: 0, // Not needed for display
      emoji: props.emoji,
      description: '', // Not needed for display
    };
    
    return (
      <CinematicGiftOverlay
        gift={gift}
        senderName={props.senderName}
        onComplete={onAnimationComplete}
      />
    );
  }
  
  // Standard gift animation
  return <RoastGiftAnimationOverlayStandard {...props} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
