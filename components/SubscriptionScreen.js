import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useIAP, purchaseUpdatedListener, purchaseErrorListener } from 'react-native-iap';
import { verifySubscription } from '../utils/http-requests';

// Tässä on vain se yksi ainoa tilaustuote, jonka luot Play Consoleen
const SUBSCRIPTION_SKUS = ['premium_monthly']; 

const SubscriptionScreen = ({ user, subscription, setSubscription, onLoginRequired, onSuccess }) => {
  // 2. Otetaan tarvittavat funktiot ja tilat suoraan useIAP-hookista
  const {
    connected,
    subscriptions,        // Tilaustuotteet päätyvät v15-versiossa aina tähän taulukkoon
    fetchProducts,        // Tämä on virallinen funktio kaikelle haulle v15+ versiossa
    requestPurchase,      // Tilausten tekoon käytettävä uusi yhtenäinen funktio
    finishTransaction,
  } = useIAP();

  useEffect(() => {
    if (connected) {
      fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' })
        .catch((err) => console.log('Virhe tuotteiden haussa (fetchProducts):', err));
    }
  }, [connected]);

  useEffect(() => {
    const updateListener = purchaseUpdatedListener(async (purchase) => {
      if (purchase?.purchaseToken || purchase?.transactionReceipt) {
        try {
          // Lähetetään kuittitoken backendille varmistukseen
          const data = await verifySubscription(user, purchase);

          if (data.success) {
            await finishTransaction({ purchase, isConsumable: false });
            setSubscription({
              ...subscription,
              purchase_token: data.purchase_token,
              status: 'active'
            });
            Alert.alert('Onnistui!', 'Premium-tilaus aktivoitu.');
          } else {
            Alert.alert('Virhe (success false)', 'Palvelin ei voinut vahvistaa tilausta.');
          }
          if (onSuccess) onSuccess();
        } catch (err) {
          Alert.alert('Virhe', 'Palvelin ei voinut vahvistaa tilausta.');
          console.error('Kuitin käsittelyvirhe:', err);
        }
      }
    });

    const errorListener = purchaseErrorListener((error) => {
      console.warn('Ostovirhe tai peruutus:', error);
    });

    // Siivotaan kuuntelijat kun komponentti poistuu näytöltä
    return () => {
      updateListener.remove();
      errorListener.remove();
    };
  }, [user, onSuccess, finishTransaction]);

  const handleSubscribe = async (sku, offerToken) => {
    if (!user) {
      Alert.alert('Kirjaudu sisään', 'Sinun täytyy kirjautua sisään ennen tilauksen tekemistä.', [
        { text: 'Peruuta' },
        { text: 'Kirjaudu', onPress: onLoginRequired }
      ]);
      return;
    }

    try {
      const accountId = user?.id ? String(user.id) : undefined;
      await requestPurchase({
        request: {
          google: {
            skus: [sku],
            subscriptionOffers: [
              {
                sku: sku,
                offerToken: offerToken,
              }
            ],
            ...(accountId ? { obfuscatedAccountIdAndroid: accountId } : {}),
          },
        },
        type: 'subs',
      });
    } catch (err) {
      console.log('Ostopre-virhe:', err);
    }
  };

  // Jos yhteys Google Playhin ei ole vielä valmis, näytetään latausruutu
  if (!connected) return <ActivityIndicator style={{ marginTop: 20 }} />;

  // Otetaan listalta ensimmäinen tilaustuote (jos se on jo ladattu)
  const premiumProduct = subscriptions[0];

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Hanki Premium-ominaisuudet</Text>
      
      {!premiumProduct || !premiumProduct.subscriptionOffers ? (
        <Text style={{ color: 'gray', textAlign: 'center', paddingHorizontal: 20 }}>
          Ladataan paketteja...
        </Text>
      ) : (
        premiumProduct.subscriptionOffers.map((offer) => {
          const offerToken = offer.offerTokenAndroid;
          
          const pricingPhase = offer.pricingPhasesAndroid?.pricingPhaseList?.[0];
          const formattedPrice = pricingPhase?.formattedPrice || 'Hinta ladataan...';
          
          const isPrepaidId = offer.basePlanId?.toLowerCase().includes('prepaid');
          const isPrepaid = pricingPhase?.recurrenceMode === 3 || isPrepaidId;

          return (
            <TouchableOpacity 
              key={offerToken} 
              style={[styles.button, isPrepaid ? styles.prepaidButton : styles.autoRenewButton]} 
              onPress={() => handleSubscribe(premiumProduct.id, offerToken)}
            >
              <Text style={styles.btnText}>
                {isPrepaid 
                  ? `Kertamaksu: 1 Kuukausi (${formattedPrice})` 
                  : `Jatkuva tilaus: Kuukausittain (${formattedPrice})`
                }
              </Text>
              <Text style={styles.subText}>
                {isPrepaid 
                  ? 'Maksu kerran, ei automaattista uusiutumista' 
                  : 'Uusiutuu automaattisesti, voit peruuttaa milloin vain'
                }
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

export default SubscriptionScreen;

const styles = StyleSheet.create({
  box: { marginTop: 40, width: '100%', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  button: { padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 12 },
  autoRenewButton: { backgroundColor: '#1E90FF' }, 
  prepaidButton: { backgroundColor: '#2E8B57' },    
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: '#f0f0f0', fontSize: 12, marginTop: 4 }
});