import * as React from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { useAuth } from '@/auth/AuthContext';
import { decodeBase64 } from '@/encryption/base64';
import { encryptBox } from '@/encryption/libsodium';
import { authApprove } from '@/auth/authApprove';
import { useCheckScannerPermissions } from '@/hooks/useCheckCameraPermissions';
import { Modal } from '@/modal';
import { t } from '@/text';
import { sync } from '@/sync/sync';

interface UseConnectTerminalOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useConnectTerminal(options?: UseConnectTerminalOptions) {
    const auth = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const checkScannerPermissions = useCheckScannerPermissions();

    const processAuthUrl = React.useCallback(async (url: string) => {
        if (!url.startsWith('vibe://terminal?')) {
            Modal.alert(t('common.error'), t('modals.invalidAuthUrl'), [{ text: t('common.ok') }]);
            return false;
        }
        
        // Check if user is logged in
        if (!auth.credentials) {
            Modal.alert(
                t('common.error'), 
                'You must be logged in to connect a terminal. Please create an account or log in first.',
                [{ text: t('common.ok') }]
            );
            return false;
        }
        
        setIsLoading(true);
        try {
            const tail = url.slice('vibe://terminal?'.length);
            const publicKey = decodeBase64(tail, 'base64url');
            const responseV1 = encryptBox(decodeBase64(auth.credentials.secret, 'base64url'), publicKey);
            let responseV2Bundle = new Uint8Array(sync.encryption.contentDataKey.length + 1);
            responseV2Bundle[0] = 0;
            responseV2Bundle.set(sync.encryption.contentDataKey, 1);
            const responseV2 = encryptBox(responseV2Bundle, publicKey);
            await authApprove(auth.credentials.token, publicKey, responseV1, responseV2);
            
            Modal.alert(t('common.success'), t('modals.terminalConnectedSuccessfully'), [
                { 
                    text: t('common.ok'), 
                    onPress: () => options?.onSuccess?.()
                }
            ]);
            return true;
        } catch (e) {
            console.error('Terminal connection error:', e);
            
            // Extract a more helpful error message
            let errorMessage = t('modals.failedToConnectTerminal');
            if (e instanceof Error) {
                const message = e.message;
                // Provide more specific error messages based on the error
                if (message.includes('not found') || message.includes('not_found')) {
                    errorMessage = 'Authentication request not found. Make sure you ran `vibe auth login` in the terminal and the request is still active.';
                } else if (message.includes('Cannot connect to server') || message.includes('ECONNREFUSED')) {
                    errorMessage = 'Cannot connect to server. Make sure the server is running at http://localhost:3005';
                } else if (message.includes('401') || message.includes('Unauthorized')) {
                    errorMessage = 'Authentication failed. Please make sure you are logged in to the mobile app.';
                } else if (message.includes('404')) {
                    errorMessage = 'Server endpoint not found. Please check your server configuration.';
                } else {
                    // Use the error message if it's helpful, otherwise use default
                    errorMessage = message.length < 100 ? message : t('modals.failedToConnectTerminal');
                }
            }
            
            Modal.alert(t('common.error'), errorMessage, [{ text: t('common.ok') }]);
            options?.onError?.(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [auth.credentials, options]);

    const connectTerminal = React.useCallback(async () => {
        if (await checkScannerPermissions()) {
            // Use camera scanner
            CameraView.launchScanner({
                barcodeTypes: ['qr']
            });
        } else {
            Modal.alert(t('common.error'), t('modals.cameraPermissionsRequiredToConnectTerminal'), [{ text: t('common.ok') }]);
        }
    }, [checkScannerPermissions]);

    const connectWithUrl = React.useCallback(async (url: string) => {
        return await processAuthUrl(url);
    }, [processAuthUrl]);

    // Set up barcode scanner listener
    React.useEffect(() => {
        if (CameraView.isModernBarcodeScannerAvailable) {
            const subscription = CameraView.onModernBarcodeScanned(async (event) => {
                if (event.data.startsWith('vibe://terminal?')) {
                    // Dismiss scanner on Android is called automatically when barcode is scanned
                    if (Platform.OS === 'ios') {
                        await CameraView.dismissScanner();
                    }
                    await processAuthUrl(event.data);
                }
            });
            return () => {
                subscription.remove();
            };
        }
    }, [processAuthUrl]);

    return {
        connectTerminal,
        connectWithUrl,
        isLoading,
        processAuthUrl
    };
}
